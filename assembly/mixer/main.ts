// import { bn128_frm_zero, bn128_fr_mul, bn128_frm_fromMontgomery, bn128_frm_toMontgomery, bn128_frm_mul, bn128_frm_add, bn128_g1m_toMontgomery, bn128_g1m_double, bn128_g2m_toMontgomery, bn128_g1m_neg, bn128_ftm_one, bn128_pairingEq4, bn128_g1m_timesScalar, bn128_g1m_add, bn128_g1m_affine, bn128_g1m_neg} from "./websnark_bn128";

import { bn128_ftm_mul, bn128_f1m_square, bn128_g1m_double, bn128_frm_fromMontgomery, bn128_frm_toMontgomery } from "./websnark_bn128";

import { groth16_verify } from "./groth16_verify";

@external("env", "debug_printMemHex")
export declare function debug_mem(pos: i32, len: i32): void;

@external("env", "eth2_blockDataSize")
export declare function input_size(): i32;

@external("env", "eth2_blockDataCopy")
export declare function input_data_copy(outputOffset: i32, srcOffset: i32, length: i32): void;

@external("env", "eth2_savePostStateRoot")
export declare function save_output(offset: i32): void;

const SIZE_F = 32;

export function main(): i32 {
    let input_data_len = input_size();
    let input_data_buff = new ArrayBuffer(input_data_len);

    let output = (new Uint8Array(SIZE_F * 12)).buffer as usize;

    input_data_copy(input_data_buff as usize, 0, input_data_len);

    let p1 = (input_data_buff as usize);
    let p2 = (input_data_buff as usize) + SIZE_F * 12;

    debug_mem(p1, SIZE_F * 12);
    debug_mem(p2, SIZE_F * 12);

    bn128_ftm_mul(p1, p2, output);

    save_output(output as usize);

    debug_mem(output, SIZE_F * 12);

    return 0;
}
