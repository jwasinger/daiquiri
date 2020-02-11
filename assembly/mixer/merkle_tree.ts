import { mimc_compress2, NULL_HASH } from "./mimc.ts";

import { bn128_frm_zero, bn128_fr_mul, bn128_frm_fromMontgomery, bn128_frm_toMontgomery, bn128_frm_mul, bn128_frm_add, bn128_g1m_toMontgomery, bn128_g2m_toMontgomery, bn128_g1m_neg, bn128_ftm_one, bn128_pairingEq4, bn128_g1m_timesScalar, bn128_g1m_add, bn128_g1m_affine, bn128_g1m_neg} from "./websnark_bn128";

import { SIZE_F, memcmp } from "./util.ts";

@external("env", "debug_printMemHex")
export declare function debug_mem(pos: i32, len: i32): void;

// bn128 point size
export const ROOT_OFFSET = 0;

export function verify_merkle_proof(p_proof: usize): u32 {
    let p_computed_root = (new Uint8Array(SIZE_F)).buffer as usize;
    let p_proof_root = p_proof + ROOT_OFFSET;

    compute_root(p_proof, p_computed_root);

    return memcmp(p_computed_root, p_proof_root);
}

// convert all the field elements in the proof to montgomery form
export function merkle_proof_init(p_proof: usize): usize {
    let root = ( p_proof as usize ); 
    bn128_frm_toMontgomery(root, root);

    let num_witnesses = load<u64>(p_proof + SIZE_F) as u64;

    let p_selectors: usize = root + 40;
    let selector = load<u8>(p_selectors);

    let witnesses: usize = p_selectors + num_witnesses as usize;

    for (let i: usize = 0; i < num_witnesses; i++) {
        bn128_frm_toMontgomery(witnesses + i * SIZE_F, witnesses + i * SIZE_F);
    }

    let tmp1: usize = (new Uint8Array(SIZE_F)).buffer as usize;
    let tmp2: usize = (new Uint8Array(SIZE_F)).buffer as usize;

    let leaf: usize = witnesses + ( num_witnesses as usize * SIZE_F );
    bn128_frm_toMontgomery(leaf, leaf);

    return leaf + SIZE_F;
}

export function get_proof_size(p_proof: usize): usize {
    // TODO
}

// computes the merkle root and modifies the proof root
export function compute_proof(p_proof: usize): void {
    let p_proof_root = p_proof + ROOT_OFFSET;
    compute_root(p_proof, p_proof_root);
}

export function compute_root(p_proof: usize, p_out_root: usize): usize {
    let root = ( p_proof as usize ); 

    // TODO: index/num_witnesses are serialized as u64 and casted to usize which could cause overflow.
    let num_witnesses = load<u64>(p_proof + 32) as u64;

    let p_selectors: usize = root + 40;
    let selector = load<u8>(p_selectors);

    let witnesses: usize = p_selectors + num_witnesses as usize;

    let leaf: usize = witnesses + ( num_witnesses as usize * SIZE_F );

    if (selector == 0) {
        mimc_compress2(leaf, witnesses, p_out_root);
    } else {
        mimc_compress2(witnesses, leaf, p_out_root);
    }

    p_selectors++;
    selector = load<u8>(p_selectors);

    for (let i: usize = 1; i < num_witnesses; i++) {
        if (selector == 0) {
            mimc_compress2(p_out_root, witnesses + i * SIZE_F, p_out_root);
        } else {
            mimc_compress2(witnesses + i * SIZE_F, p_out_root, p_out_root);
        }

        p_selectors++;
        selector = load<u8>(p_selectors);
    }

    return witnesses + SIZE_F * num_witnesses as usize;
}
