// import { bn128_frm_zero, bn128_fr_mul, bn128_frm_fromMontgomery, bn128_frm_toMontgomery, bn128_frm_mul, bn128_frm_add, bn128_g1m_toMontgomery, bn128_g2m_toMontgomery, bn128_g1m_neg, bn128_ftm_one, bn128_pairingEq4, bn128_g1m_timesScalar, bn128_g1m_add, bn128_g1m_affine, bn128_g1m_neg} from "./websnark_bn128";

import { bn128_frm_fromMontgomery, bn128_frm_toMontgomery } from "./websnark_bn128";

import { groth16_verify } from "./groth16_verify";

const SIZE_F = 32;
const SIZE_F1 = SIZE_F * 3;

import { mimc_init, NULL_HASH } from "./mimc.ts";

const p_NULL_HASH = NULL_HASH.buffer as usize;

// root for an empty tree of depth 20
export const NULL_ROOT: Array<u64> = [ 0xd6b781f439c20c0b, 0x5d00fc101129f08f, 0x137981fece56e977, 0x04af9e46dbc42b94 ];

import { verify_merkle_proof, merkle_proof_init, compute_root } from "./merkle_tree.ts";

import { mimc_compress2 } from "./mimc.ts";

import { memcpy, memcmp } from "./util.ts";

@external("env", "debug_printMemHex")
export declare function debug_mem(pos: i32, len: i32): void;

@external("env", "eth2_blockDataSize")
export declare function input_size(): i32;

@external("env", "eth2_blockDataCopy")
export declare function input_data_copy(outputOffset: i32, srcOffset: i32, length: i32): void;

@external("env", "eth2_loadPreStateRoot")
export declare function prestate_copy(dst: i32): void;

@external("env", "eth2_savePostStateRoot")
export declare function save_output(offset: i32): void;

// TODO make all numbers in the proof expected to be passed in montgomery form
export function main(): i32 {
    let input_data_len = input_size();
    let input_data_buff = new ArrayBuffer(input_data_len);
    input_data_copy(input_data_buff as usize, 0, input_data_len);

    let selector = load<u8>(input_data_buff as usize); 
    let prestate = new Uint8Array(SIZE_F);
    let result = new Uint8Array(SIZE_F);
    let cur = (new Uint8Array(SIZE_F)).buffer as usize;

    prestate_copy(prestate.buffer as usize);
    mimc_init();

    for (let i = 0; i < 20; i++) {
        mimc_compress2(NULL_ROOT.buffer as usize, cur, cur);
    }

    save_output(result.buffer as usize);

    return 0;
}
