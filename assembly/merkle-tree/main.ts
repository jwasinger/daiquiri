// import { bn128_frm_zero, bn128_fr_mul, bn128_frm_fromMontgomery, bn128_frm_toMontgomery, bn128_frm_mul, bn128_frm_add, bn128_g1m_toMontgomery, bn128_g2m_toMontgomery, bn128_g1m_neg, bn128_ftm_one, bn128_pairingEq4, bn128_g1m_timesScalar, bn128_g1m_add, bn128_g1m_affine, bn128_g1m_neg} from "./websnark_bn128";

const SIZE_F = 32;
import { mimc_init } from "./mimc.ts";

import { verify_merkle_proof } from "./merkle_tree.ts";

@external("env", "debug_printMemHex")
export declare function debug_mem(pos: i32, len: i32): void;

@external("env", "input_size")
export declare function input_size(): i32;

@external("env", "input_data_copy")
export declare function input_data_copy(outputOffset: i32, srcOffset: i32, length: i32): void;

@external("env", "load_prestate")
export declare function load_prestate(offset: i32);

@external("env", "save_output")
export declare function save_output(offset: i32): void;

function deposit(input_data: usize, p_result_root: usize): void {
    let p_prestate = new Uint8Array(SIZE_F).buffer as usize;
    load_prestate(p_prestate);

    let p_nullifier_root = input_data;

    // last commitment proof
    let p_commitment_root = input_data + SIZE_F;

    let p_tmp = new Uint8Array(SIZE_F).buffer as usize;
    let p_computed_root = new Uint8Array(SIZE_F).buffer as usize;

    // copy the commitment root to the merkle proof root, HASH(NULL) to the merkle proof leaf
    memcpy(p_tmp, p_commitment_leaf);
    memcpy(p_commitment_leaf, NULL_HASH);

    // check that HASH(NULL) + proof_witnesses produces the current state root
    compute_proof(p_proof, p_computed_root);
    mimc_compress2(p_computed_root, p_commitment_root, p_computed_root);

    if (!memcmp(p_computed_root, p_prestate)) {
        throw new Error("invalid witnesses");
    }

    // check that COMMITMENT + proof_witnesses produces the state root in the proof and update to the new state root

    memcpy(p_commitment_proof + MERKLE_PROOF_LEAF_OFFSET, p_tmp);
    compute_root(p_commitment_proof, tmp);

    save_output(tmp);
}

function withdraw(input_data: usize, p_result_root: usize): void {

    // verify that the ZKP is valid, that the nullifier is a public input

    // take the nullifier value from the ZKP and verify it was HASH(NULL) in the nullifier state root

    // update the state root to reflect a non-NULL nullifier, pay out ether to recipient, (pay fees to a relayer?)
}

// TODO make all numbers in the proof expected to be passed in montgomery form
export function main(): i32 {
    let input_data_len = input_size();
    let input_data_buff = new ArrayBuffer(input_data_len);
    input_data_copy(input_data_buff as usize, 0, input_data_len);

    mimc_init();

    // first byte is selector. 0 => withdraw, 1 => deposit
    let result = new Uint8Array(SIZE_F);

    let selector: u8 = 0;

    if (selector == SELECTOR_DEPOSIT) {
        deposit(input_data_buff as usize + 1, result.buffer as usize);
    } else if (selector == SELECTOR_WITHDRAW) {
        withdraw(input_data_buff as usize + 1, result.buffer as usize);
    }

    save_output(result.buffer as usize);

    return 0;
}
