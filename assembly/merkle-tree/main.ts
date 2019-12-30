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

@external("env", "save_output")
export declare function save_output(offset: i32): void;

function deposit(input_data: usize, p_result_root: usize): void {
    // input data is the merkle proof that the commitment (previously HASH(NULL)) produces a new state root
    // construct the proof with the 

    // check that HASH(NULL) + proof_witnesses produces the current state root

    // check that COMMITMENT + proof_witnesses produces the state root in the proof and update to the new state root
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
