import { bn128_frm_zero, bn128_fr_mul, bn128_frm_fromMontgomery, bn128_frm_toMontgomery, bn128_frm_mul, bn128_frm_add, bn128_g1m_toMontgomery, bn128_g2m_toMontgomery, bn128_g1m_neg, bn128_ftm_one, bn128_pairingEq4, bn128_g1m_timesScalar, bn128_g1m_add, bn128_g1m_affine, bn128_g1m_neg} from "./websnark_bn128";

import { SIZE_F, memcpy } from "./util.ts";

//@external("env", "memcpy")
//export declare function memcpy(dst: i32, src: i32): void;

export const NULL_HASH: Array<u64> = [
    0x249685ed4899af6c, 0x821b340f76e741e2, 0x343a35b6eba15db4, 0x2fe54c60d3acabf3,
];

// TODO this should be set to 220
const num_rounds = 220;

const tmp = (new Uint8Array(SIZE_F)).buffer as usize;
const xL = (new Uint8Array(SIZE_F)).buffer as usize;
const xLresultTable = (new Uint8Array(SIZE_F*(num_rounds+2))).buffer as usize;
const xR = (new Uint8Array(SIZE_F)).buffer as usize;
const zero = (new Uint8Array(SIZE_F)).buffer as usize;
const t = (new Uint8Array(SIZE_F)).buffer as usize;
const t2 = (new Uint8Array(SIZE_F)).buffer as usize;
const t4 = (new Uint8Array(SIZE_F)).buffer as usize;

bn128_frm_zero(xL);
bn128_frm_zero(xR);
bn128_frm_zero(zero);

const round_constants: Array<u64> = [
0x965ac8dfe4478c84, 0xe7bdd790e2e696e0, 0xe5836bff1f4ee44a, 0x053e27bc8307157c,
0x4876b92b82ed2b58, 0x79d381c02f25e76a, 0xcc300398b121b06b, 0x2bca90bb9ac89253,
0x5c96ba766407c309, 0x57818b6ba200a9a8, 0xf5072b6600a8566e, 0x0cb30314d7437db9,
0x4c0a0b8900fbbfca, 0x854f39e1204d124a, 0xadf3ae348f3965af, 0x2d623578b4d7a6e7,
0x52a3efe1384869b6, 0x15f5474e5fce1dc3, 0x3f71f5013b43c6f8, 0x08031df14eb93355,
0xe596d42b748f4b03, 0x1afacc6e17400383, 0x842a60b81616647d, 0x1e9dce3fb4aff03f,
0x2293d1cc03a4271b, 0xac8be24e461c924e, 0x531112d29e92bfb4, 0x11fa45b080f45d7f,
0xf56c490b5e0a0c7d, 0x3fbd62afd8a3638c, 0x2617403f6e1d83ef, 0x2aa1e0af756a2c7f,
0x8723029776002c94, 0xb20cd5e488987498, 0xf6d59d2187f997c7, 0x29f9c30db4efe9ae,
0xb14832f519ecea5d, 0xbbac626fd00f1b1a, 0xa077ecd514273720, 0x089e5ed5f00e9416,
0x045832a1025b44c4, 0x063d96e0489f0aac, 0xd1fd0ae1242eb7a0, 0x2061b9d590051271,
0x29071ea9c68ef1f5, 0x56de42f6cf5417e9, 0x28a1ae776ec646ef, 0x22c7e244015e5d82,
0x5c4a7b221511a59a, 0xd5f0d5a8e3229e1a, 0xff4fbf78f2426a10, 0x28752f24383e6552,
0xb22f2a57a75e9555, 0x2e14bca8cb21aadb, 0x57dc9e9831b62d5c, 0x2d7b7158676de0fa,
0xeedcae02ae854861, 0xd6c1e1785a8ff80a, 0x3ca6da94567baa9f, 0x2fbec01b89d5ee67,
0x80be56cdb814b528, 0x3785e6f9dd05fa41, 0x9bba5f86541809bc, 0x24340a824e789429,
0xc327f547a8427908, 0x6e0d542694f1b502, 0xb151b673f84f96f6, 0x20a9f2b2bf65be63,
0xf4c2a91e2679704a, 0x1d1941e4180ae43e, 0xfda101936747cc5a, 0x0dd093f02f8f821e,
0x4b5143419be0289d, 0x02169bcdcdbbcfcc, 0x65fe470e903d8275, 0x2d368b95313a7bf4,
0xda018b4d5f294da1, 0x3834c08940cd98b2, 0x882f2cf20ce323c8, 0x1a3ae77b146542ad,
0x3c5c7db30350fdb0, 0xae44560dde117156, 0xa8b4e9554d1979fd, 0x1da2e000b10f5c0b,
0x1140045666557769, 0xfceb58b54e582536, 0x59e33095713a6660, 0x0b4163475b224665,
0x134c91ac2a2b60ea, 0xb36ad58790339df8, 0x3a38553656461cd4, 0x07765f0779596038,
0x3a4d673d21500e40, 0xbad08a00efe5936d, 0x35ea545f25929e02, 0x0c0b55d60d4dbaf2,
0x7cc1039c87daacd8, 0x9aad78db4da396e7, 0xfab4b66e82c2e356, 0x097d79018c1dc36c,
0xdaaf2e07106c5eba, 0xfa6eced924162a83, 0xb866ae62753baac5, 0x14d8b9a7a723600d,
0x4b970eccfbc9994a, 0x3cf6b1dc25dac455, 0xbe833a289f9d50ca, 0x087afa054632beae,
0xf842bdb35cfc73f5, 0x2aa38d9132159818, 0xd1cdf97d8010a782, 0x19ec5304410e782f,
0xb7dcbcf64c951cdf, 0xdbaa8d91c864817c, 0x563203021e01c030, 0x23ab6efb6432d128,
0x803cea82aa292fd5, 0x59b7ba69a8fa72dd, 0x227ca712999409e9, 0x0a3b013912357908,
0xa2979d9ab88105c3, 0xd4a491a37735272f, 0x48e52b99882aafdb, 0x0e6c446393f50d50,
0x296fb4af362f209d, 0x3d7440ae34b220ea, 0x1348f92cd1d36ec5, 0x18e31c18c7dc4ebb,
0xa854e759da6bc6fe, 0x9ecc3f286a5e47d1, 0x91f315c99f7e1d63, 0x0093487853f27b55,
0xcf6577c4263a3053, 0x07ba4e8b19a96773, 0x4823c3464f2b95b4, 0x037283079a4920e9,
0xfca2bc05838f65ef, 0xd0619b81a0098db2, 0x9affa45f9b116cba, 0x2ff7c783621b2687,
0x8dcd278b2ef1f67d, 0xb660e8138aa1a76e, 0x92da646542f28754, 0x2e893c2cc0d6fbd9,
0xfac9d4bc65135608, 0xcab8ab571688c95c, 0x46edcf83ca7b2739, 0x04975241dd60a06e,
0x4f9cc3689758ce77, 0xbf40ba1ef4f2752a, 0x334f6511a048a834, 0x0f44eb3f2d028fa9,
0xfc2649fd978e5335, 0x252b60b6a09be9fb, 0x1ac04606d0487b92, 0x032ad97ced0a6e75,
0xafa36ebd1c897e85, 0x852a22648bb90e25, 0x3a54294d35ce42ba, 0x21142e942e1eb278,
0x635397d7337fe4db, 0xb6335ade5887923f, 0xc90be62508ff245f, 0x0f7635528879fc0a,
0x8a4ee2bc272c4012, 0xc3f75874e5dc3485, 0xa1093ec624e15279, 0x0c04ffd0285073c9,
0x8984e522c1a693f4, 0xc97e33f366920a81, 0x591d28bd67f1c562, 0x123cfa121ad57eee,
0xe8d9fd32586c82f0, 0xfe595ae132924064, 0x300ca429b3599fdf, 0x0c662f964f420fc7,
0x5664de04f84bc182, 0xdc24042292dd0e90, 0x05a62d49c72ba72e, 0x0c3a5c23cb6f75ec,
0x03f2c54d846768ae, 0x2edf896d51ca3ed0, 0x2f745dccd7afd403, 0x0e6146337488141e,
0x0ba164bb345bc7c2, 0x8c79554da106cb5b, 0x35e49b1925748ad6, 0x0d1bde49c9a6863f,
0xdb55ced527c17d93, 0x88af9dda8ee41e32, 0x603c6cd2d59c3912, 0x25e84dda05697ffd,
0x231118161e1d4d4a, 0x9773984a9a111ead, 0x05a6c6d0a510a26e, 0x033b471ebcfff0d4,
0xe92133668689c7f6, 0xf87356ac6496843b, 0x61b86350d02544a8, 0x169964a2a16408c1,
0x11ce96e685dd1b89, 0x54f5de58635256d2, 0x26ea687dbee2ddfb, 0x2013a52d36d1aae3,
0x15d840daf9c86d1f, 0x57ddddcfc8ff5f73, 0x8dd492e5eb1ea9c1, 0x2bbe5d10f1532baf,
0x35f0e1ad79e10572, 0xbe1755f568adee3b, 0x0157b196fc2ec608, 0x186ce41133fc24da,
0x50d1a9cf5b729c20, 0xde5696a5766fd33a, 0xf08e23500223779a, 0x27db82878e82ebf6,
0x566ccee4791d4761, 0x9008d506a956e7bf, 0x01aa85feb33a475e, 0x1bf13e3c5f70afef,
0xc153064bf5b6e178, 0xd7b866101a25d002, 0xf5e7df197663ce96, 0x0be4a53e02142c80,
0x134870470b5fd92d, 0x0b63ed4a81fab24e, 0x0af27135a920940e, 0x02eaaf8e54934498,
0xeefe5909b3381026, 0x948ea6285586cbde, 0x9554c5b7178af828, 0x0de02b168c691288,
0x7c3d55c57f6327a0, 0x4f72f0e631823cb9, 0x5988b17440ebc729, 0x2421d938a61e9196,
0x403469f8a6fd3ddf, 0x31da7ecc0f1e2fc6, 0x1f54d2151d8b7b83, 0x2fff43a74dca24a4,
0x159ab2d4410f19cb, 0xfe487d3ff9907082, 0x24d3bedc57c126bb, 0x0d31c0dba8f41b21,
0xc29dd5715e23769b, 0x01f236c5148867b7, 0x3e8991188f983b56, 0x26b31489bf46d403,
0x66bc1225d55a8cc4, 0xc5c12da31ae40831, 0x99d6ba5388bb1450, 0x28b3a22d29ce4cd1,
0x07cde9294f3ae136, 0x379f27cb8f36963d, 0x62c878f2f7516ab7, 0x2d2b9a1a752da92c,
0x32ecbe123f9b6d04, 0x949d2d5e7bb3d955, 0x4dd35476518f56b1, 0x24f766e5b6dcf24e,
0x32173ad52e18ea89, 0x2507c29852df6d2b, 0xfe03d8ae0c3af434, 0x04ce939ca6dc4db5,
0xd94dbc6851476822, 0x970b3bddac44ba3b, 0xc71d5b1c202fa397, 0x13c04e7f19a60fca,
0xac453aee12d54b48, 0x9b252827f7df10f9, 0xa2876d90eef132d6, 0x2d3d2f7be77dea04,
0xc396ad85ffab8fcf, 0xe08871c4d7d3812b, 0x8a56fd270f0cafe6, 0x05c1edda2145bf41,
0x12aa4dbf2f5c0380, 0x266f1dc4aae3f163, 0xedb111c8e98700dc, 0x03f6b45ee32eabc8,
0x4d46b31d8549944d, 0x31fb16f86a6db35f, 0xefb760c86edf3d43, 0x0ee73d6cc51f1d78,
0xefdc0e94221c950e, 0x6193a5782d50a1bc, 0xbda8b8fc3f299db4, 0x12ba4aa01e5dc606,
0xf9debb42d571eeca, 0xd60b6f67683edfec, 0xd2c3c7f6fbee6dde, 0x05cc2ac369706023,
0xc6c7b00fb3500d96, 0xf055b7309a578ed4, 0xb14a5b8d90e97556, 0x2d8291b2ea11c9ba,
0xbab025965de2301f, 0x793f5dd8169f5d7c, 0xbe9f1385ee9c77a8, 0x1bf90513ea3a2bae,
0xb6c0010631cf9aaa, 0xe904b3b31502783e, 0xdc4d267f60ff72c9, 0x0a15c551fc0d7070,
0x3f0ffb9425ef2810, 0x836d664d66186db0, 0xc4a86d6868da4c8d, 0x01f8740ed80d145b,
0x178429c6b9d0b9d7, 0xf7244527e6c1ad22, 0x7d5552eddaa3f9b9, 0x136d69d0d4558f87,
0xa5cd57bdb83c3e6d, 0xdb8d5ab08205276b, 0xc0eafe1882eeb199, 0x14a2853688ccbd47,
0x4cb7de077fc324f5, 0x8356d50345c6ee6d, 0x460e20e63512806e, 0x004cbce93d6eae95,
0x7561a8ba26355ad4, 0x2d55d368ac8cebc2, 0x96045af03af22d98, 0x06c7055fde873005,
0x0b30030ad2b2efc0, 0x15a66bca9724f89e, 0xf597a67c2594eb96, 0x202a08aca52cd969,
0x1e718096d7dd6fa8, 0xdf44afae6e28c67b, 0x9bf979c32b431c1e, 0x2e372caf8bdea6a2,
0x0adb3c386d008487, 0xb14812f77cebef82, 0x576b5c5a21e3caf8, 0x09bb96c836be9fcd,
0xa484ecb9d89a8c85, 0x798aab523f63ba2f, 0x83b3525320849f9e, 0x10bc7259d7e3b3c0,
0xff40d416a8550899, 0xcc1a8852e6c44b6a, 0x125e963508fb3488, 0x133a8abe39871ae5,
0x8e78655c5afa4755, 0xed853559f5ad1fa8, 0x51ed7eaf10a596ec, 0x2a8354d4f2484765,
0xfb2560e6d25dfcab, 0xe947f9d95e99c71c, 0x49a8c8c4afe309d9, 0x25821745d38bc2d8,
0x5a7381b4c4c1e505, 0xf144732eb0a2b6c2, 0x3006468ed0061d5e, 0x2397a6a2d491b47f,
0x8228c1e5c125040f, 0x51a2035048ae3c8d, 0x57d68d1b8d48eff8, 0x08e4aafcfd1ac6e8,
0xc44a0a92d6c8796c, 0x02abf64dac5b17d8, 0x9515d7aa54e4fcb2, 0x2bd7f2f7662dac75,
0x1850b627da5b0862, 0x49d4a1eda8a5252f, 0x7e3b6d3209922072, 0x1a2af99312067570,
0xe833088ff5ccdd65, 0xe8d295f19bc8184d, 0x598c12f964a4ae5e, 0x0376629199627b11,
0xf15f80932f811de8, 0x32b721f7819071bf, 0x1cb3b9a5a0ba1bd6, 0x1784e3c3a6c0166a,
0x24fe7555547fe1c7, 0xcab6df2146a94ea2, 0x963c55e0ab3fe282, 0x2b019b8e9e77726d,
0xd54b0874cc8d5b70, 0xf811eda0448713a6, 0xa0c19036c093131a, 0x0e877352aaa642f5,
0xff24de37055dfb15, 0x1fd250e7eed6b1d1, 0x859f76915b7ae252, 0x18c0f634c873acf9,
0xe833582be77026ff, 0xf3a15eadf6ae4bc1, 0x4d56669d4138810a, 0x1ad2ebbb74d46aae,
0x630597f7074671bc, 0x43105d7219c3fb2a, 0xe8ebb17156272caa, 0x2d03beb1da522b8c,
0xe9a33d869d970f38, 0x1b95b65163384577, 0x662f2dc188db2cf2, 0x26d305fa1cb2e2ca,
0x6acd92a2272a6dad, 0x936e9a8318b52886, 0x0df0af315cd2893e, 0x096bb23032eac37b,
0xfa2ebf50f7bcd276, 0x21c556193791a91a, 0xe933d52633765f81, 0x2d933fc2140bd34d,
0x4270ccaa6b288b66, 0xcdb0c75aa7ddfef7, 0x6a7a22ebc6950736, 0x239e36992133e204,
0x1e6ffe9c1a7ffb84, 0xb5ad685fc9349c41, 0x3dd4aaf4a69a6c17, 0x067763d04e338af9,
0x5e719f647690dc00, 0x8e946f38b703f47c, 0x83509339b84d7f27, 0x26d785c6c58684fc,
0x26f5d4a6c0027bc5, 0x1da63dfbca8da331, 0xea6dacec7cb2d1f3, 0x27d16c08f2f8272d,
0xf935af775f8d01e0, 0xefda940dc32b506f, 0x3a8bad9683c4bb01, 0x162bf90e4cbd605b,
0x06f0613f159b659f, 0x0147a1f18111317e, 0x5b4490b596f4b388, 0x2d716b61964c64d5,
0xcef44b03d28ade1e, 0xd044a9206d768709, 0xabb5e411501b7ce9, 0x23426276f87e0d64,
0xe6feffe4bef70255, 0x0b6331f42193df8f, 0xc4e8146677925f60, 0x0fe43649b6d5f7b8,
0x3ca6421e210c59f4, 0x760dc776be6c5ec0, 0x04fa4b5e4be56e77, 0x1eb13c8d5fdca216,
0xbcc55591f14b3c90, 0xa8c03a5a1b97c0f2, 0xc0f89ba1bffc46f9, 0x017e783383d1012b,
0x215b76b852cf399c, 0x9d61f74d08b6db75, 0xec622b60fd19dd7a, 0x06aee032420b4383,
0x481261174db110c2, 0xb91d621b0f10180c, 0x827948ad04ea16a0, 0x2ea58066e2cf3772,
0xec1e7f213b951fb6, 0x6d61e6cd72d7b2bb, 0x51b20a7d2dfb96ed, 0x07ad415cb2925e13,
0xff6328b79decd43f, 0x36a8a93edd267386, 0x198120e848c12ec6, 0x10baf3e22dd4c544,
0x699f8a886fdd07f1, 0x466d42aa78970dbc, 0x538925cdc8268f11, 0x2a6e0c9e6d30c43c,
0xb7a75a40232fe379, 0x7a95ba9b979e9b35, 0x93b16411b4067387, 0x0c2647a281d2fbee,
0x7e4b9a4404595cb4, 0x5a4f084c1eb3a21e, 0x173a0bb3e25bc61b, 0x2dde352f82dcb0f5,
0xb6b77bd6f1705970, 0xaf1c029785ba1eda, 0x93e92e7ca921539d, 0x086f26f7bce8820c,
0x8d823d6beaf95c43, 0x5ef00302e9c63bc7, 0x63145ee4fa8d3f99, 0x1121b4d91751036c,
0xe9aee2c7814b3199, 0xb537ac1d2611ec0e, 0x1bbe517a12cffde9, 0x2948555b5efc93d6,
0x47c52e9a34f2d0dc, 0x47c49a33e8d9d971, 0x40f442d6d333dcd6, 0x15944561c2cce024,
0x292a6781bf745674, 0x4c04ed03915bcd84, 0x833e7bf0a8fa37c9, 0x09ea436fb3126595,
0x2a111503125b42db, 0xab5c77f682a76c33, 0x2e0b8c9bcdb9456c, 0x0a4d99ea2ab07fa5,
0xd71cdbf4f0bca762, 0xbb4939238324ea49, 0x8e36f7603cd44b3b, 0x21e080f57e386da9,
0xf6eeff590543622e, 0x86cce9192db44dc5, 0x7475722dc537e2ff, 0x1a459bb817267f1b,
0xe02ec3b88603fce6, 0xbd4bf549bf563ee8, 0x4753b5d4a6092d13, 0x036a43bf2a1baaee,
0x64c12efe1d3a8ca4, 0xaac5c16b274eddb1, 0xe50e14d3c828c8d8, 0x0082e026829419bd,
0xe6a201cad364e5ab, 0x918f07af08cb6207, 0xc52f818914ece6b9, 0x18c46acd8b758e19,
0xb1e367bd46aa4700, 0x387182380b097e0b, 0x409207eb70c88b27, 0x29385f03979d4f42,
0x4f44df3eaba34679, 0x380e26d2ae99dc64, 0x519234d6f80c3b9f, 0x26c80e47192922c2,
0xf444b9c4d01c9066, 0x8c0b5897e9f84f60, 0x75d8cba4a0426065, 0x04f7554f4ec93e23,
0x4b945387e7f9c761, 0x2cfe9e4b947e44ca, 0x5f490de322652f2c, 0x139da6e6d57bfd57,
0xd4748c412c16a4ec, 0xf210d34edef7e34d, 0xf1b1eed8fe0cf556, 0x2b29fa0667f7a240,
0xe97201c9d7d1bcde, 0x8efe57b47aa05e8a, 0x86d5afb8443266e9, 0x1f0fd088d19147cd,
0xeb2b12cf8a3cbe6d, 0xada8b488374248d0, 0xdfe4326556e32da4, 0x2cc20a56358f3f26,
0xe55b9354cc0120a3, 0x9159e5944ce6b65f, 0x13ca9178b52f2933, 0x17992a122b8e4047,
0xa5260d06e0e5b22d, 0xf0b95f6a0f3de1fe, 0x30ccd780a429b473, 0x258da17c7980cbdf,
0x86003372274b83cb, 0xcecc5412dc0d41c7, 0x624b2bd1797d4076, 0x1015b7a220170b57,
0xa8841a83b02a72fb, 0xb086036c85051f40, 0x1a118d04498d520f, 0x2fb70a2c4543c3ea,
0xb174986f67913a6b, 0x5e94c38780b9bef3, 0xdd17afa8c864416e, 0x286cc46b8f2d9b6e,
0x91196922e2c28c73, 0xe8be3d4e4aef9799, 0x5307f15eed2c6dbd, 0x28d630f4a57c11ec,
0x98f9cea6a3d4c55f, 0xf600508c18f2db87, 0x801016ce04a9a467, 0x122bd1b90bccdad3,
0x81885699f46b8193, 0xdcf671e1bed3b02e, 0x79390292170136fc, 0x2ac529acaece3584,
0xf2a87b084721fa82, 0x1422d50a29ec1846, 0xd0964e46f8cd2f5c, 0x0eea9b61a21f8fe2,
0x05dd106710fb9286, 0x15aa9d7d2c0e949a, 0x75e019f3914b35bd, 0x02c7a96d6b03bb5f,
0x61d6478d0223f5af, 0xad8070325675ea38, 0x230efd1fe85b6515, 0x0db7ba13cebb252a,
0x3b693504e0ae400e, 0x371d8d326876d482, 0x97d001779c04bf41, 0x22a89d24d19397ad,
0xafadc12bfcea2123, 0x2d82a7d433994a74, 0x5e7256e4fbd9237c, 0x0c0b3584e81504b0,
0x9dc36a6d262bd411, 0x1809a8166efc179d, 0x4688945002f9f678, 0x1015e12be85132dd,
0x7126aed11203cf55, 0x744f5d74a7e48064, 0xb208690f9a9a66dd, 0x12f830cce6982639,
0x2884653e408706af, 0x03d81b3641a627dd, 0x730a7a0377252d2e, 0x0e75dbb3bf876d56,
0xc3383f5eaccedf90, 0xb78826995fccbee3, 0xcf15f0da403c3735, 0x14d86143e6514cfa,
0x686012440cc294fd, 0x46b37410f5511d76, 0x5a5a87837ebb2df6, 0x0ad2a865b04b6ea5,
0x05ab90543f7ae7a6, 0xb0669c9d41dc96e2, 0x2988078befee0ec9, 0x1061f470678e82b9,
0x08369d640ba64b70, 0xfd813c56ee0bbb76, 0x952c94157a13c384, 0x22ce78a79f23c0fd,
0xaedb5435ebd53a31, 0xe3ad17155700036e, 0x9d1d17d463871ea6, 0x28adca358fb7ae1a,
0x096e2a267007b7ea, 0x3a6fc10d6657611c, 0x35d01ca33837e35a, 0x043726b7bc8cfa85,
0x8e0499db551c03d3, 0x51e0de9c726b3635, 0xca00966828441e78, 0x08634fa6d8f09ce5,
0xfff0e43ab04abda7, 0x58ab1291d78e121b, 0xb944b6fb6e7bd244, 0x20eb7bcd0fd0544c,
0x0dfc00ce5fb01636, 0x94433821777406e8, 0xdde8b1d4ad2196cd, 0x12d1cede233b07dc,
0xda4d77b70bf95f52, 0x78cd16a3c3d5a1f4, 0x79913c4b122dd6c5, 0x041a4a53c9ea3b26,
0xdea1eb19afd322ff, 0xc01224db223bf241, 0xb8c37173c70e908e, 0x206bb6538f29f5a7,
0x01b0068e49caa3a2, 0x6e9dc08abf989e2a, 0x1e4f973be52fda9c, 0x2abcc3f893810d35,
0x81d183fe9b2cba98, 0xd6c9e52ca8605b22, 0xec784769205cb946, 0x0f65129ada2d5f49,
0xd6bdda7a673ea276, 0x738f6aa9b43f663e, 0xb8d6993f9ddb2ab0, 0x27d01e6d82510161,
0xb5a849b9d34c1df8, 0xc727d186bb97901d, 0x344e5bc14fd202d5, 0x21cf7747bcd701de,
0x0735affe5bf14012, 0x59e197aede5b5ce6, 0xa0387182634eea8f, 0x24e62ee220d2b34e,
0x63b2e703a078042f, 0x9549dd320e6bbb7b, 0xa772b86f0726b49d, 0x130500fe2fa739ed,
0xd2649e6ff95a01bb, 0x59451fabdb7e94e0, 0xb12b27d7382c8405, 0x080e487ea5101e47,
0xe29f3abcf63fcda9, 0x8e13a8a234a8b9e6, 0x608b26869c6dd5b1, 0x05d788ee55cf8cf1,
0xa7ed95414956e8a7, 0x5ea98d9cfaf12b9f, 0x0ae6f7557687cb0a, 0x219cecf5e2c20ccd,
0x3d36b51bb8a4aa85, 0x8ff5943226127d58, 0xbce70b2da328c084, 0x041c294e9d61a0db,
0x5875248128d45042, 0xe00bdd9acb70cfab, 0xa62748581dae3d2f, 0x22f52f18a78718bc,
0x81841d243f4da81a, 0xf9974ab874e92ec5, 0x771bf866a10f8f60, 0x24986f01c65d94d0,
0x4824ce38f9d508d2, 0xf35741eaff3bd57d, 0x89207f0151eaa95d, 0x1e58572fc6a0860d,
0xc859dbbd699af660, 0xaa2e4bfb6d76ccb7, 0xe51923c209b78d2b, 0x2d9131fdfcd1fd71,
0x96460b070984d780, 0xd9388a9593f26b44, 0x264b627df2afec89, 0x210a4ca27e64d04b,
0xf2998117f7ecd09a, 0x48ad26caa9ca76cd, 0x3dff57b82c42e9cb, 0x1db0a2c85010cc8a,
0xa5bf6f7518930def, 0x79b425ccb3cc6452, 0x30bb6a8dc345e4c1, 0x2f2688b80ccfabb8,
0xaeff02b1c6490c40, 0xe4f122bae1e7c669, 0xc1799e347023f5d9, 0x25841d66960c4e53,
0x4d779dc9152853ee, 0xbf2a64051f5c13e1, 0x956c12f3a1dde264, 0x08abe6983a80ea28,
0xdfac18ca95164b53, 0x872167ac80b23992, 0xb12a24b617ba9f25, 0x007d3da4bc5c0dd2,
0xc51bb967ecf388fe, 0x420f0b3c871d51b1, 0x89c520fdcb563b05, 0x156873246a76682e,
0x5e2e16ea213bf71f, 0xfa9108a216a1c0e2, 0x9aae88429a6b3b1c, 0x28f0ea8a82630f56,
0xce54d283994854ce, 0x1c1b26330ccf0a69, 0xa01e532a5b71a067, 0x0e28a4fc7c2bd839,
0x54547ff1278c93a1, 0x96fd17660a16ccc1, 0x459d487c329350a6, 0x2bf4e45c3e6f318b,
0xdbe76c4d9245dece, 0xd2afbc6ac5291542, 0xbaaaf630c01a5253, 0x1b6ab48fafe8fcd0,
0xcedeee1c3cc2e045, 0x591cfbd622859078, 0x348a77a5ab615af8, 0x13fd02ad6b8b3f12,
0x674394fb457d2344, 0xb458c45c0db99224, 0xd18787e083bec4ad, 0x2672f704c4b607e1,
0xe20f3a2ccc99b6ba, 0x3f9bcc3e57490f04, 0x5291a7a982f53137, 0x107a53c45e19bcff,
0x5d78dcd35b7babd4, 0xabf1d817dd25f065, 0x280324373a1bb827, 0x1a04b3857955e3ca,
0xbbf3881f6ac16990, 0x220fdb71817a9da9, 0x5d0703c7e4818c98, 0x0c36b559f64cba6a,
0x834094065b149350, 0x345cf8c48092d2ed, 0xeb5c15d892eaa686, 0x25aae90755f3a4a5,
0x69b5ae8c82660342, 0x716a2c1eaa365397, 0x7eac1772682cee1f, 0x2e93b8dfb632865e,
0x20ba991a9238dffb, 0xf285e1e17406c9f8, 0x0dc80059f50fccdc, 0x2c3d2effbb457714,
0xd9a8750d2ce310f5, 0x2224b344d45cc35a, 0x8119bdaa0113e4f1, 0x28d08f5064280e83,
0xadc391fefcbd7769, 0xe18302406e6b5aa6, 0x5e705022c80247b4, 0x1415329f0498ee94,
0xd855686eccc98ca8, 0xf8c31fc019a785d0, 0xbc112280cf797638, 0x24fd8b29ed3b4f5b,
0x51f89eecc416bd33, 0x1f39a20ac369dbc9, 0x9c5abd628e23654c, 0x27ec2739870fb66c,
0x3c3b6176f51c5761, 0x7757f8a2f832573f, 0xe0d62e2fcf644215, 0x2afb0f24ee6e04c3,
0x8a659177b1b76405, 0xecb4852fef8c0055, 0x32553592c735f9c9, 0x275bc85bb103d888,
0xb4f87ed362cf1bd4, 0xb4597f912dec95bc, 0x5dd3daef5b67a771, 0x0742afa8cf593fdb,
0x03c83f37b1abef19, 0x34fa98b943c8c980, 0x71908cac51965acf, 0x2ede84d5eabfb221,
0x1f0ae806aab64578, 0x3b237c663066d6d1, 0xfe227d444d102af3, 0x0612da87ad62c928,
0xc1b0a5f186225e48, 0x58cf44effbef61f5, 0xde4cc889fb4d7ce5, 0x172b1bfa1bdae39f,
0x58d6d5b3c3379839, 0x0586c2ffa1872357, 0x883ba9c9cfa2d4b7, 0x0e5a05dfa3cc4522,
0xb96ed53c83943057, 0xa6658acac745e497, 0x08b06904974b5751, 0x235db6a944bfad8d,
0x00ee1c9fa962ce66, 0x1df7c2a459872bb7, 0x2cb1e67b730c9955, 0x1a7a04f9b6ef8ecd,
0xfa0e418d3980d8bf, 0x5717d60752ea4fa5, 0x8ae5fc268377242a, 0x05c8bd8b29d49f88,
0x3f208ef6b5b9f044, 0xcfa3e7a4601c6549, 0x4ae3a6cef17c42e1, 0x128bdf354bf863c8,
0x98166cc1b926fd2d, 0xe88305e430777afd, 0xf605b101ea58011b, 0x0a7b34763aefe8ac,
0x7c0d8b16f1b91a6c, 0xde6cc14855988603, 0x24a9496574bc585f, 0x2d55da597f53711a,
0xf8101716c76bd8b9, 0x04cdc31f6a751b52, 0x520425beb73aafbe, 0x1efe7d901eeac214,
0xa2d9881dda6a9954, 0x5d185981d28b3c51, 0x70dcb109330d4bab, 0x1800ec01eb6c0189,
0x1454028f3acb0509, 0x2a20ca646ebb1fc7, 0x54075e55c6e609fc, 0x0335af83ac502719,
0x93a2a347211aa972, 0xc6e712a7fd8cd51c, 0x27ff2d980ef2caad, 0x21b68a2314cf32ee,
0xe37f43dedac5c694, 0xa2a8681b28d3c3db, 0xff2896a490d258f2, 0x0b667bd1977f23b4,

0x249685ed4899af6c, 0x821b340f76e741e2, 0x343a35b6eba15db4, 0x2fe54c60d3acabf3,
];

const num_round_constants = (round_constants.length / 4 );

function mimc_cipher(xL_in: usize, xR_in: usize, k_in: usize, xL_out: usize, xR_out: usize): void {

     /****  do first round, i=0 ***/
    let c: usize = 0;
    c = ( round_constants.buffer as usize + SIZE_F * ( (0 - 1) % num_round_constants)) as usize;
    //if ( i == 0 ) {
      // t = k + kL_in;
      //bn128_frm_add(k_in, xL_in, t);
    //}
    bn128_frm_add(k_in, xL_in, t);

    // t2 = t * t
    bn128_frm_mul(t,t,t2);
    // t4 = t2 * t2;
    bn128_frm_mul(t2,t2,t4);

    //tmp = xL
    //memcpy(tmp, xL);

    // xL is zeros, being overwritten here
    //bn128_frm_mul(t4, t, xL);
    bn128_frm_mul(t4, t, (xLresultTable + SIZE_F*0));
    

    //if (i == 0) {
    //    bn128_frm_add(xL, xR_in, xL);
    //    memcpy(xR, xL_in);
    //}
    //bn128_frm_add(xL, xR_in, xL);
    bn128_frm_add((xLresultTable + SIZE_F*0), xR_in, (xLresultTable + SIZE_F*0));
    //memcpy(xR, xL_in);


    /**** do second round, i=1 ***/
    c = ( round_constants.buffer as usize + SIZE_F * ( (1 - 1) % num_round_constants)) as usize;
    // t = k + k[i-1] + c;
    //bn128_frm_add(c, xL, t);
    bn128_frm_add(c, (xLresultTable + SIZE_F*0), t);
    bn128_frm_add(t, k_in, t);

    // t2 = t * t
    bn128_frm_mul(t,t,t2);

    // t4 = t2 * t2;
    bn128_frm_mul(t2,t2,t4);

    //tmp = xL
    //memcpy(tmp, xL);
    // xR = xL
    //memcpy(xR, (xLresultTable + SIZE_F*0));

    //bn128_frm_mul(t4, t, xL);
    bn128_frm_mul(t4, t, (xLresultTable + SIZE_F*1));

    //bn128_frm_add(xL, xL_in, xL);
    bn128_frm_add((xLresultTable + SIZE_F*1), xL_in, (xLresultTable + SIZE_F*1));
    //memcpy(xR, tmp);


    /**** do third round, i=2 and up to num_rounds - 2 */

    for (let i = 2; i < num_rounds - 2; i++) {

        c = ( round_constants.buffer as usize + SIZE_F * ( (i - 1) % num_round_constants)) as usize;

        // t = k + k[i-1] + c;
        //bn128_frm_add(c, xL, t);
        bn128_frm_add(c, (xLresultTable + SIZE_F*(i-1)), t);
        bn128_frm_add(t, k_in, t);

        // t2 = t * t
        bn128_frm_mul(t,t,t2);

        // t4 = t2 * t2;
        bn128_frm_mul(t2,t2,t4);

        //tmp = xL
        //memcpy(tmp, (xLresultTable + SIZE_F*(i-1)));

        bn128_frm_mul(t4, t, (xLresultTable + SIZE_F*i));

        bn128_frm_add((xLresultTable + SIZE_F*i), (xLresultTable + SIZE_F*(i-2)), (xLresultTable + SIZE_F*i));
        //memcpy(xL, (xLresultTable + SIZE_F*i));
        //memcpy(xR, tmp);
    }


    /**** do i=num_rounds-2 ***/
    let i = num_rounds - 2;
    c = ( round_constants.buffer as usize + SIZE_F * ( (i - 1) % num_round_constants)) as usize;

    // t = k + k[i-1] + c;
    //bn128_frm_add(c, xL, t);
    bn128_frm_add(c, (xLresultTable + SIZE_F*(i-1)), t);
    bn128_frm_add(t, k_in, t);

    // t2 = t * t
    bn128_frm_mul(t,t,t2);

    // t4 = t2 * t2;
    bn128_frm_mul(t2,t2,t4);

    //tmp = xL
    //memcpy(tmp, xL);

    bn128_frm_mul(t4, t, (xLresultTable + SIZE_F*i));

    //bn128_frm_add((xLresultTable + SIZE_F*i), (xLresultTable + SIZE_F*(i-2)), (xLresultTable + SIZE_F*i));
    //bn128_frm_add((xLresultTable + SIZE_F*i), (xLresultTable + SIZE_F*(i-2)), (xLresultTable + SIZE_F*i));
    bn128_frm_add((xLresultTable + SIZE_F*i), (xLresultTable + SIZE_F*(i-2)), xL_out);
    //memcpy(xR, tmp);


    /**** do i=num_rounds-1 ***/
    i = num_rounds - 1;
    c = zero;

    // t = k + k[i-1] + c;
    //bn128_frm_add(c, xL, t);
    bn128_frm_add(c, xL_out, t);
    bn128_frm_add(t, k_in, t);

    // t2 = t * t
    bn128_frm_mul(t,t,t2);

    // t4 = t2 * t2;
    bn128_frm_mul(t2,t2,t4);

    //memcpy(xL_out, (xLresultTable + SIZE_F*(i-1)));

    // xR_out = xR + t4 * t
    bn128_frm_mul(t4, t, xR_out);
    bn128_frm_add(xR_out, (xLresultTable + SIZE_F*(i-2)), xR_out);

}

// everything argument other than num_inputs, num_outputs is a pointer
function mimc_compress(inputs: usize, num_inputs: usize, k: usize, outputs: usize, num_outputs: usize): void {
    let xL_in = (new Uint8Array(SIZE_F)).buffer as usize;
    let xR_in = (new Uint8Array(SIZE_F)).buffer as usize;
    let xL_out = (new Uint8Array(SIZE_F)).buffer as usize;
    let xR_out = (new Uint8Array(SIZE_F)).buffer as usize;

    // xL_in = inputs[0]
    memcpy(xL_in, inputs);

    // xR_in = 0
    bn128_frm_zero(xR_in);

    mimc_cipher(xL_in, xR_in, k, xL_out, xR_out);

    for (let i: usize = 1; i < num_inputs; i++) {
        // xL_in = xL_out + inputs[i]
        bn128_frm_add(xL_out, inputs + SIZE_F * i, xL_in);

        // xR_in = xR_out
        memcpy(xR_in, xR_out);

        mimc_cipher(xL_in, xR_in, k, xL_out, xR_out);
    }

    // TODO document the fact that this function returns in non-montgomery form
    bn128_frm_fromMontgomery(xL_out, outputs);

    // TODO output size larger than 1 un-tested
    for (let i: usize = 0; i < num_outputs - 1; i++) {
        mimc_cipher(xL_in, xR_in, k, xL_out, xR_out);

        // outputs[i + 1] = xL_out;
        memcpy(outputs + ( (i + 1) * SIZE_F), xL_out);
    }
}

// converts the round constants to montgomery.  TODO hardcode them in montgomery form
export function mimc_init(): void {
    bn128_frm_toMontgomery(NULL_HASH.buffer as usize, NULL_HASH.buffer as usize);
}

export function mimc_compress2(left: usize, right: usize, result: usize): void {
    let xL_in = (new Uint8Array(SIZE_F)).buffer as usize;
    let xR_in = (new Uint8Array(SIZE_F)).buffer as usize;
    let xL_out = (new Uint8Array(SIZE_F)).buffer as usize;
    let xR_out = (new Uint8Array(SIZE_F)).buffer as usize;

    let k = (new Uint8Array(SIZE_F)).buffer as usize;
    bn128_frm_zero(k);

    // xL_in = inputs[0]
    //memcpy(xL_in, left);

    // xR_in = 0
    bn128_frm_zero(xR_in);

    //mimc_cipher(xL_in, xR_in, k, xL_out, xR_out);
    mimc_cipher(left, xR_in, k, xL_out, xR_out);

    // xL_in = xL_out + inputs[i]
    bn128_frm_add(xL_out, right, xL_in);

    // xR_in = xR_out
    //memcpy(xR_in, xR_out);

    //mimc_cipher(xL_in, xR_in, k, xL_out, xR_out);
    //memcpy(result, xL_out);

    mimc_cipher(xL_in, xR_out, k, result, xR_out);
}
