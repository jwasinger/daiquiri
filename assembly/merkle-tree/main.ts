// import { bn128_frm_zero, bn128_fr_mul, bn128_frm_fromMontgomery, bn128_frm_toMontgomery, bn128_frm_mul, bn128_frm_add, bn128_g1m_toMontgomery, bn128_g2m_toMontgomery, bn128_g1m_neg, bn128_ftm_one, bn128_pairingEq4, bn128_g1m_timesScalar, bn128_g1m_add, bn128_g1m_affine, bn128_g1m_neg} from "./websnark_bn128";

import { bn128_frm_fromMontgomery, bn128_frm_toMontgomery } from "./websnark_bn128";

import { groth16_verify } from "./groth16_verify";

const SIZE_F = 32;
import { mimc_init, NULL_HASH } from "./mimc.ts";

const p_NULL_HASH = NULL_HASH.buffer as usize;

// root for an empty tree of depth 20
export const NULL_ROOT: Array<u64> = [ 0xd6b781f439c20c0b, 0x5d00fc101129f08f, 0x137981fece56e977, 0x04af9e46dbc42b94 ];

import { verify_merkle_proof, merkle_proof_init, compute_root } from "./merkle_tree.ts";

import { mimc_compress2 } from "./mimc.ts";

import { memcpy, memcmp } from "./util.ts";

@external("env", "debug_printMemHex")
export declare function debug_mem(pos: i32, len: i32): void;

@external("env", "input_size")
export declare function input_size(): i32;

@external("env", "input_data_copy")
export declare function input_data_copy(outputOffset: i32, srcOffset: i32, length: i32): void;

@external("env", "prestate_copy")
export declare function prestate_copy(dst: i32): void;

@external("env", "save_output")
export declare function save_output(offset: i32): void;

const SELECTOR_DEPOSIT: u8 = 0;
const SELECTOR_WITHDRAW: u8 = 1;

function append_leaf(input_data: usize, p_prestate_root: usize, out_root: usize, is_deposit: bool): usize {
    let p_mixer_root = input_data;

    // represents either the withdraw or deposit root
    let p_last_witness = p_mixer_root + SIZE_F;
    let p_merkle_proof = p_last_witness + SIZE_F;
    let p_merkle_root = p_merkle_proof;

    merkle_proof_init(p_merkle_proof);

    let tmp1: usize = (new Uint8Array(SIZE_F)).buffer as usize;
    let tmp2: usize = (new Uint8Array(SIZE_F)).buffer as usize;
    let tmp3: usize = (new Uint8Array(SIZE_F)).buffer as usize;

    let p_proof_leaf = p_merkle_proof + 40 + 20 + 20 * SIZE_F;

    bn128_frm_toMontgomery(p_prestate_root, p_prestate_root);
    bn128_frm_toMontgomery(p_last_witness, p_last_witness);
    bn128_frm_toMontgomery(p_mixer_root, p_mixer_root);

    // ensure the leaf was not previously in the tree 
    // i.e. replacing the leaf with NULL and calculating the mixer root 
    // should yield the prestate

    memcpy(tmp1, p_mixer_root);
    memcpy(tmp2, p_proof_leaf);

    memcpy(p_mixer_root, p_prestate_root);
    memcpy(p_proof_leaf, p_NULL_HASH);

    compute_root(p_merkle_proof, p_merkle_root);
    
    if (is_deposit) {
        mimc_compress2(p_merkle_root, p_last_witness, tmp3);
    } else {
        mimc_compress2(p_last_witness, p_merkle_root, tmp3);
    }

    if (memcmp(tmp3, p_prestate_root) != 0) {
        debug_mem(3, SIZE_F);
        return 0;
    }

    // calculate the new mixer root based on the addition of a commitment/nullifier

    memcpy(p_mixer_root, tmp1);
    memcpy(p_proof_leaf, tmp2);

    compute_root(p_merkle_proof, p_merkle_root);

    if (is_deposit) {
        mimc_compress2(p_merkle_root, p_last_witness, tmp3);
    } else {
        mimc_compress2(p_last_witness, p_merkle_root, tmp3);
    }

    if (memcmp(tmp3, p_mixer_root) != 0) {
        debug_mem(3, SIZE_F);
        return 0;
    }

    bn128_frm_fromMontgomery(p_mixer_root, out_root);
    return p_proof_leaf + SIZE_F;
}

function deposit(input_data: usize, prestate_root: usize, out_root: usize): void {
    append_leaf(input_data, prestate_root, out_root, true);
}

function withdraw(input_data: usize, prestate_root: usize, out_root: usize): i32 {
    /*
    Withdrawal proof is composed of:
    * Merkle proof that new nullifierHash is in the nullifier tree
    * A Groth16 proof that Pedersen(nullifier + Secret) is in the commitment tree
    */

    let tmp1: usize = (new Uint8Array(SIZE_F)).buffer as usize;
    let groth_proof_start: usize = append_leaf(input_data, prestate_root, tmp1, false);

    // verify the post-state root is an input to the ZKP

    // verify the ZKP

    if(groth16_verify(input_data) != 0) {
        debug_mem(0, SIZE_F);
    }

    return 0;
}

// TODO make all numbers in the proof expected to be passed in montgomery form
export function main(): i32 {
    let input_data_len = input_size();
    let input_data_buff = new ArrayBuffer(input_data_len);
    input_data_copy(input_data_buff as usize, 0, input_data_len);

    let selector = load<u8>(input_data_buff as usize); 
    let prestate = new Uint8Array(SIZE_F);
    let result = new Uint8Array(SIZE_F);
    let input_data_start = input_data_buff as usize + 1;

    prestate_copy(prestate.buffer as usize);

    mimc_init();

    if (selector == SELECTOR_DEPOSIT) {
        deposit(input_data_start, prestate.buffer as usize, result.buffer as usize);
    } else if(selector == SELECTOR_WITHDRAW) {
        withdraw(input_data_start, prestate.buffer as usize, result.buffer as usize);
    } else {
        // invalid selector
        // throw exception
    }

    // withdraw(input_data_buff as usize, prestate.buffer as usize, result.buffer as usize);
    
    //deposit(input_data_buff as usize, prestate.buffer as usize, result.buffer as usize);

    save_output(result.buffer as usize);

    return 0;
}
