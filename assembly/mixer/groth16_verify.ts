import { bn128_g1m_toMontgomery, bn128_g2m_toMontgomery, bn128_g1m_neg, bn128_ftm_one, bn128_pairingEq4, bn128_g1m_timesScalar, bn128_g1m_add, bn128_g1m_affine, bn128_g1m_neg} from "./websnark_bn128";

@external("env", "debug_printMemHex")
export declare function debug_mem(pos: i32, len: i32): void;

export function groth16_verify(p_input_data: usize): i32 {
  const SIZE_F = 32;
  let pFq12One = new ArrayBuffer(SIZE_F*12);
  bn128_ftm_one(pFq12One as usize);

  // Verifying Key
  let p_vk_alfa1 = p_input_data;
  let p_vk_beta2 = p_vk_alfa1+ 96;
  let p_vk_gamma2 = p_vk_beta2 + 192;
  let p_vk_delta2 = p_vk_gamma2 + 192; 

  // Proof elements
  let p_a= p_vk_delta2 + 192;
  let p_b = p_a + 96;
  let p_c = p_b + 192;

  let num_ic = load<u32>(p_c + 96);

  // input constraints (f1(?) elements)
  let p_ic_start = p_c + 100;

  const SIZE_F1 = SIZE_F * 3

  // inputs (fr(?) elements)
  let num_input = num_ic - 1;
  let p_input_start = p_ic_start + num_ic * SIZE_F1;

  let p_ic = p_ic_start;

  for (let i = 0 as usize; i < num_input; i++ ) {
    // ic_aux <== IC[i+1]
    let p_ic_aux = p_ic + ((i + 1) * SIZE_F1);

    let p_ic_r = p_input_start + (i * SIZE_F);

    /* TODO add this back in after asc compiler bug is fixed
    if (int_gte(p_ic_r, pr)) {
      return 1;
    }
    */

    bn128_g1m_timesScalar(p_ic_aux, p_ic_r, SIZE_F, p_ic_aux);
    bn128_g1m_add(p_ic_aux, p_ic, p_ic);
  }

  bn128_g1m_affine(p_ic, p_ic);
  bn128_g1m_neg(p_ic, p_ic);
  bn128_g1m_neg(p_c, p_c);
  bn128_g1m_neg(p_vk_alfa1, p_vk_alfa1);

  if (bn128_pairingEq4(p_a, p_b, p_ic, p_vk_gamma2, p_c, p_vk_delta2, p_vk_alfa1, p_vk_beta2, pFq12One as usize)) {
      return 0;
  } else {
      return 1;
  }
}
