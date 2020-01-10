import { bn128_frm_zero, bn128_fr_mul, bn128_frm_fromMontgomery, bn128_frm_toMontgomery, bn128_frm_mul, bn128_frm_add, bn128_g1m_toMontgomery, bn128_g2m_toMontgomery, bn128_g1m_neg, bn128_ftm_one, bn128_pairingEq4, bn128_g1m_timesScalar, bn128_g1m_add, bn128_g1m_affine, bn128_g1m_neg} from "./websnark_bn128";

import { SIZE_F, memcpy } from "./util.ts";

export const NULL_HASH: Array<u64> = [
    0x7d3eb7ff691dba40, 0x1a34bf30e70eade2, 0x4a19a476fa41bb31, 0x2027777a0db98566,
];

// TODO this should be set to 220
const num_rounds = 220;

const round_constants: Array<u64> = [
0x27b688d12488c5d4, 0xfb51f0d66065d8a2, 0x7c7c584d4f8f3759, 0x0fbe43c36a80e36d,
0x55673f5751efc1c9, 0xde5c4a262e831395, 0xfc4eeee6618b1b7c, 0x0b1be1e55d1138dc,
0x6be30bab71b86cf8, 0xcdcecd669bf10f75, 0x7c13eb42ffb97663, 0x27c0849dba264307,
0x0f00d11b172b80d2, 0x1d415098554fd828, 0xc68f7dfdd5b79268, 0x2bf76744736132e5,
0xc9e2d748cec58567, 0x737b1ea990e32486, 0x4b2c4629195a5a3c, 0x02aef041c0700b1b,
0xa0764a3f651e9b2f, 0xae8d9ddc64255bae, 0xe2b5593b56115d06, 0x282767ed3103cd92,
0x516ba73eac4f4c34, 0xad0823f6e220567f, 0xaf4769cff22133d7, 0x10f3a13e8bb8523d,
0x07fff998f7e40bdd, 0x97fd1f63a84cd2d0, 0xe3485fb572d1e824, 0x0fef545f7ed94f69,
0xc41daf954c4537ce, 0x98e75763b8595db0, 0xd1136f3709d40c42, 0x15ceee0e1c70f77b,
0xa4e9f03069a099f5, 0xc12c13b38e10225a, 0xca5b1cf888386d1d, 0x0a9baee798a320b0,
0xcee42e2d51b32c76, 0x5989622060911b2b, 0x9abd17b3f98dbe50, 0x2670d407ad0b5a99,
0x154f5fae54eb8b16, 0x008b8c95ef331a4d, 0x85d1fbc1350909f6, 0x161ed19c62ea2602,
0xae00590b88c8855a, 0xcd7e0139852ebbf4, 0xb17dfb6851f05fa4, 0x1a4dc528312f210e,
0x415ecbfb1226875f, 0xd696489c63394bc1, 0xc7329ca5563c4c4f, 0x25147dcc3df52742,
0x11a52bf31006016a, 0x874ffb51415beed1, 0x2b6ad3d58164136f, 0x01a811a20cda427c,
0x65ae4774621b2a63, 0x3da826e528257687, 0x2a068eea1318a0dc, 0x0824de9e43d882ee,
0x5fe7beeb230c554f, 0x712d2045fa64cb8f, 0x53ffaf9f21359e56, 0x10b4f82b62f0fc9a,
0xa1d1d27e4452a0af, 0x3c161837ca59a53f, 0x66e8018b6470372e, 0x2d150f8fda7df0d5,
0x3fd64e83596ff101, 0xe3d4c3659423c48b, 0x9177b4f297f8049c, 0x281e90a515e6409e,
0xc949a0c701bf3e7c, 0x82569c0434ee7ce4, 0xb8a78d762b28cec8, 0x11dd375328f0481f,
0x27ca3c7ee1f25c05, 0x021217080b4d4761, 0xa73c8f2f1274fc39, 0x17de91f8113f9443,
0xcc30b52b9b24bced, 0x2b2ffe442c58cb03, 0x716032e68b757c91, 0x0bf2b7e871ca735f,
0xefd6f607486195c0, 0x1f0e856fff2d71c1, 0x00584afd40b6a4a7, 0x0a3908129452ca7d,
0x4b087e5c3452aa35, 0xef235ec1c2272448, 0x611d8e52c9e70573, 0x253e5bbfe718ac84,
0x2db105e019265fa7, 0x4e95adc619aab896, 0x0a8499cece42bb5e, 0x0a380e47fbd10c83,
0xfebc484add0beb74, 0x1e9d177ff09b7009, 0xb76d3294c1122391, 0x24e53af71ef06bac,
0x84afd2b698f2138f, 0x544a1a98b0524c19, 0x8c6b2785e1a75d29, 0x1a43144a8bbba4cf,
0x1b724d9736d28e4a, 0x01557afe100bcf97, 0xd180eb5917ff5b5a, 0x0562fabab7b28094,
0x8e9bbdfd6351b065, 0x67990a13cad5d3c4, 0xc81292c916998dfd, 0x042ca040b9419be4,
0x1f0152c5625dac4e, 0xa5ebe4a0f857ef98, 0xa054f063a30538d3, 0x005449be1e493e0b,
0xf410300062f64ca9, 0xfd83efc9c8468704, 0x75c1694da628d0ec, 0x29bae21b579d080a,
0x1565fbb8b90fce40, 0x6654338d0308d8ad, 0xb7d4c642601992e0, 0x21950fd25b80edca,
0x46693be30e2f183f, 0x2e0ad3d500edcf7c, 0xc780b5ec5405db51, 0x2b7c83a5c9472ef3,
0xca5e053bd401c34d, 0x75b5e52529052ec3, 0x8d3cd037600a911d, 0x0c354c168e5913be,
0x29bbe1ed47fd4d52, 0x7a820a4889e44b58, 0x29bca38845325b0b, 0x0929db368ef2af2d,
0xbd26697e905066f6, 0x2ea4555bf32ccf1b, 0xabbf2d2acde69846, 0x16531d424b0cbaf9,
0xcdcb6fb3429d76f1, 0x75769b4676b2a0f0, 0x36cb944c82c30fb0, 0x03cd84e6190c3f26,
0x954dd2b27023f484, 0xf8533021da5ed14f, 0x5650e5ca0cdaec55, 0x0def067b7df381dd,
0xd9f0d205355a6189, 0xd25a6fdd51866da5, 0xf710908707557498, 0x0ee9c4621642a272,
0x5802be1cdb5a72ee, 0x6daf60c0c33d8e77, 0xdc7c6de22f78d6a9, 0x18017fcc05938635,
0x04fc5feab7a5ee79, 0x421478a4e3241cb2, 0x597dc970c98c3b17, 0x2cc0823ed1d33029,
0x0fcdd4b63303d2f1, 0x8432f062eea7ce02, 0x15f0b822c2866d85, 0x1679a0c60f408d89,
0x2d947e98bb68697a, 0x6597a67cf395ad62, 0xc0168232c6f54239, 0x0642e8800a48cc04,
0xc3c4d322bc0e3df1, 0x9363c821d6c35d9d, 0x67c530fe3a28f55e, 0x00569a003785b510,
0x3a6a2e0d2bb24fdf, 0x1ebc6409c37b2347, 0xc857d2d387c5b12d, 0x2ca7148d40d1dffb,
0x91e69b5975864418, 0x4e72f7081c41b7e8, 0x456d886f461173b1, 0x07085e102e77f24e,
0x58aba619c34749ce, 0x0de57f3b6a60d5ed, 0x4971eae979027c4e, 0x2605b9b909ded1b0,
0x17f919fec46228cc, 0x76ae867ac7589041, 0x7dbef6454b0c8c1a, 0x10e54f3fa759dd11,
0xdeb810015d50376b, 0x730e3a2e2d62b50b, 0xf6905ed5951a91b3, 0x2ac5905f9450a21e,
0xb8629512057b9678, 0x584eb7295fc645a8, 0xdd05e93f3c0b6de0, 0x196dcb542dc5dc51,
0xbf6778bbea7270e1, 0x33307b15f0d2dd4a, 0x4b417e567bbfc200, 0x06e2724ea4355bea,
0x6bc9e9c05ecc0c29, 0x0c556dec88fcb8b5, 0xa90e31d3263887d4, 0x0e786007d0ce7e28,
0xf1eaf9556075fb68, 0xfbfa15e321c19abc, 0x389b0022663dbfdd, 0x0b814ed99bd00eca,
0x21cab45ab25c0930, 0x0474df0ef8bb5abc, 0x8d22cfdc96b4dc31, 0x04f79535e00c8e91,
0x9b646deda0722bf1, 0xa5ddc940ee4a3765, 0x291d39f12622b187, 0x1a003f39f26d1946,
0x66bf9b7bfdf6501f, 0xb7a195511d19c1a8, 0x37d7c78fe60cb115, 0x0c41a6a8c8847101,
0x1e2f52e887e8ac56, 0xe4156caa9e1a4ce5, 0xf1dffb4b71f7b5ec, 0x1389e0264605b298,
0x0934c716f10aca25, 0xd670672ae3a475f8, 0xd23e357bfcbbaa17, 0x1c6bf6ac0314caea,
0x6d995fb8951a6431, 0x3d554dd498d09c3b, 0x450cc9348d147f4d, 0x0bdbb96fa5c73c55,
0x364850e242b0697b, 0xaf6e152fe52c76cd, 0x4d49341b2c16b888, 0x1d199f2e0212faff,
0xec695b008c8c2d1a, 0x1ee96969440528d3, 0xa1d11a12eadd0658, 0x0206f877af22e702,
0xc2f8b7dd3296e394, 0x434bd8b587db1c10, 0x9ba67071bfc62b6d, 0x2287cef47bc39507,
0x63989004a1894f93, 0xfcbfee454d90dc17, 0x91076750e11ea7e7, 0x13ceeeb301572b49,
0x880937187135fe62, 0x373350b0bb0bcaa0, 0x98384234086d0b05, 0x243cd698bc315346,
0x082b9d2a78a258b3, 0x038d0bf9d2f994de, 0xaff22b01bfbd157c, 0x005f3e9502bcc9cd,
0x6ea47f8cf094c88c, 0x073fb918d7beb813, 0x1d628dbcfea377eb, 0x12692a7d808f44e3,
0x4bf126af35c962e0, 0xa0a275541a7c5be3, 0x47c91d6987fd280f, 0x260e384b1268e3a3,
0x9574fca48b6dadd8, 0x84617c015bfbe367, 0x326dd1fa7cc948f4, 0x16fb013611a71040,
0x97357dd6230bf048, 0x56879fa427b5ba7e, 0x61972952280f298f, 0x27519b325c443a8a,
0xcc4d5c1ebdbfe906, 0x29d49de75812ba98, 0x7acb20fc8bd1c427, 0x248d7432273cc8d3,
0xc4cbf0d22c457f74, 0x00246284fa6f02cc, 0x78c87f83a8058674, 0x296632d868ae6d51,
0x378970c2a15b3aa5, 0xbadd4bcf28649a0d, 0xfd510c07f7bbe337, 0x0fc4c0bea813a223,
0x2052ae1321f667c3, 0xf3d4ee3737be7fb4, 0x6db09a00be77549f, 0x0053f1ea6dd60e7a,
0xd861ef06bbaa4a00, 0x46e1eb422e19361a, 0x5730567432e86085, 0x2a0236ac364a4857,
0x4c197271e9725204, 0xd250c63647623433, 0x668eff255292aeec, 0x299e29684dbbad05,
0xf46234b165ad40bd, 0xf37e5b8c1dea76b3, 0xba507c30740cafb0, 0x1c3c5d45dd862fcb,
0x9b11f43d8aa551b1, 0x11f68981e5a5eef2, 0x03047bf2dc934e13, 0x190db6088d1f1031,
0x99bcc2954501c6bd, 0xb0ad9c35894c2206, 0xa2fc9846f09a2973, 0x153dae43cef763e7,
0x1c8dcde50090e877, 0x1d08b378604edb73, 0x1a0f35a0959bcf9c, 0x135bf03db291930e,
0x5d9553bfb006095b, 0x64469503d61d9eae, 0x4bae72c69f3a2256, 0x0063a5c4c9c12dcf,
0x0f18a2ae6dc9d829, 0x6d682ba0d75c462a, 0xf230246b92577242, 0x1af9136a286264f6,
0x0a9fcc33914f483a, 0xf0f14e77a1c6e6ff, 0xc2d2b6fdc31e2ff7, 0x180753a64f5d6c5a,
0xb2757ceec423bcf2, 0x13f432aa82a642d1, 0x22cffccf387cc2d3, 0x047511ce5f700c76,
0xad828d7c2437465a, 0x3e6e0995acddd414, 0x40210a07aad2a136, 0x303b2e0148b6e2e8,
0x7169be16c51ad475, 0x6caa3230e3f95c41, 0xf165f98973a13911, 0x0ae2c1b55001c365,
0x5d79ef55499554a0, 0xfdae6f8e6bb9cd37, 0x284ea880868d3b1f, 0x040273e4476ca817,
0xcc869bc4baa53172, 0x68ebc43964d2696f, 0x0afb8e5f46c39a73, 0x17e650317d66cdc9,
0x364c6ed1aeaf8c0d, 0x245414f11243f73c, 0x298a1907c42d3345, 0x028cf41e1568f34c,
0xfa90ad497e32c9f0, 0x6525447f81dc39c4, 0x6fbd1def142ccb1f, 0x0b1227b61b387d97,
0xc1d44bc4048ff155, 0x7f409f0b87ada948, 0xb504a70b4a30b214, 0x058d6ba2805c898f,
0x8a54723fdf42c4cc, 0x65e1d750ef214827, 0x05a37dbceb80d47b, 0x00129c7cd00e42ed,
0xc6f4f958cb195885, 0x6768f44d0db94a2b, 0x33e39e53e472be03, 0x172e37fd8e22a67b,
0x35d25143e311f5e9, 0x7053d95b9f39091b, 0x0d61f1da993dcb1d, 0x047b173545551de0,
0x82c081d999f9c32b, 0xbd9f9e9b790c2e03, 0x3582929eda966641, 0x2091e82677269f49,
0x20ae592a2bf63e7c, 0x86c891e261057bdd, 0x2feceecda079851c, 0x2096bacda358c785,
0x7290b0ffd89cdd8a, 0x78354a8fcebb2025, 0x8d77c42299de9888, 0x29894ebd83a0b97b,
0x4f66c13f652db8a0, 0xe45de344dd52a64b, 0x994b6192f8a252cb, 0x086903abb30acb73,
0x5d5e81c5e1ba8962, 0xb0b2f0537f9128f6, 0xe3f6a8abfd9a0484, 0x24f14d18d66c1856,
0xeb50466e86a44a07, 0x3f64334ab15ed2d3, 0x8864c029856dd602, 0x1874b5c285e4210f,
0xffb2a3c0e1cb0f16, 0xd942e4a944d3a4fc, 0xb227113a85d5ebad, 0x063d0b01a883ac19,
0x36e7c8dddbf249ef, 0xa2ebc6aa296ad3ce, 0x395c64451eb818db, 0x269e6bea132772bc,
0x50ccf4e25b79f460, 0x09e5dc86ee7b36e6, 0x2c2e248bde41b2ad, 0x03797301a98cdfe5,
0x34915ae04e26eb1e, 0xcddb3097baefca7d, 0x1708c5fd556bf624, 0x163308ae1413439a,
0xe72e3e628ebd4cbf, 0x324654de795e692f, 0xe26d76194df9ddf9, 0x08cd97bf5077b356,
0x3dfbef782df536b4, 0x093bbe5cef4a0cf9, 0x780b231a9e1f5852, 0x09a6fddec902d117,
0x5576471099eaf546, 0x72b79618912f0cae, 0x8ea2a224ed088f06, 0x0549b629f1d3860b,
0x9fc1999e9c978c62, 0x1eb7fb0e3f6266f9, 0xee027f69d4b400af, 0x00793e6dfe7f4611,
0x54d248f228716efa, 0x91f4514ecbaf948b, 0x9b7028273ed68404, 0x283857e88bbf48dc,
0x5bbae244128e69b5, 0xbd5f0c08f1d15e4a, 0x2f26aab8927b70a8, 0x223da47c2ec49872,
0x81129bb4993d8ba2, 0xd6b834c9af51afa2, 0xe1eaaf69d17530d5, 0x166c6bf34a1e6fe1,
0xe80642344d15c09a, 0x4824d44670fc3f4d, 0xee578eb3e6d26f59, 0x18dd55b4a83a53f2,
0x1d29b00b5c3604b3, 0x2e8b92b499e29cd9, 0x0b69e7ea68ec5009, 0x0e88ca3c50f6e50e,
0x09c57c5d46ee54fe, 0xf2eb1cd6acb60d9d, 0x28e00663978f2050, 0x1901d8f4f2c84491,
0x98e508d1233a7db3, 0xc425f7a319a6fd36, 0xc692e9a2cbde6d04, 0x2e611916dd7984c5,
0x9283e6f70d268bc5, 0x30da0a8beda94a6d, 0xa3d08eb67c510e86, 0x01c0b2cbe4fa9877,
0x13b15a5a623a25f0, 0x4e974799c5ba7cff, 0x07350eed946a2573, 0x0b1d85acd9031a91,
0x56ec26362f239f64, 0x926ea92d12cdaa65, 0x05a2fe655f3d6f94, 0x204497d1d3595529,
0x5e5ca2cbb2a2a5ec, 0x51b6824b7379ceac, 0x9ebd1c27993f9b1d, 0x1ee4be22419c99e6,
0xaf307c1d1a7264b9, 0xc330bc163e602dfe, 0xab8fe0ca4e9230df, 0x243f46e353354256,
0x745280a45e9ecce7, 0x43f39a6009c361c7, 0x1bbc5c55c3c82d92, 0x12b77492849bdefb,
0xc59b9f9f4971cd56, 0xa03432b3e6da67f9, 0xa753c08840275692, 0x2f312eef69a33d9f,
0x3a8ca496e0efbbff, 0x69730a063b793c89, 0xea42cdc72796a984, 0x2eceeb23cdf17bab,
0x13e569ff3abd8a5f, 0x90abf3d59958a90a, 0x9ff219856b27d118, 0x17ca868794a5a2b0,
0x60b937c255df83a6, 0x2e28a73f6a62b417, 0xcd60e5e894dfc338, 0x0ec3c87f00cf5519,
0xd8df7776f4a238b5, 0x0379b669b243e657, 0x1f366611585b8d16, 0x0b0a5017a4a351d9,
0xf09f16870ec8c336, 0xcb2ef4f15265d825, 0x0a15f86e9ae418e9, 0x2899c036db850a58,
0x63ec111831f8a7bd, 0x4b962ce1fee9aee3, 0x012a1b69807c18db, 0x07c085730b2b73e8,
0x8de67018cca91f44, 0x7217cb1f8d346789, 0x2791cba6294baf28, 0x008cc717b9776213,
0xb9f66ae2e76be719, 0x844fbe383c243b32, 0x9d812f24e37ac938, 0x164eda75fda2861f,
0x14b33f5bf31afcbc, 0x284f6571fbe189a4, 0x3b897cdeb055ddfe, 0x2f15c2779a957036,
0xb1b4b9dfb0334b4b, 0x6956fbd1f1abe119, 0xf3e6d9c4c0fa9277, 0x24fc7ca023cb6e65,
0x4ee9e383a3ef598d, 0x063a5ff33e167aa3, 0x7335eaed49658e7e, 0x09e0573e21c5e810,
0x0d95d431b1c59bf0, 0x952d68c19dc6b20f, 0x7b7bab733908e244, 0x132f51760e46faa1,
0xfcc411b7fd55d771, 0x0cf01e4754a9280c, 0x3189dd0096c9ab2b, 0x0242f85dca68c13f,
0xd049071b0a344b84, 0x9edc50fcc7c21db9, 0xa57635298566baf5, 0x042cae37aec897c9,
0x32d34a4a00881870, 0xa5bc30530927c877, 0xe912e906df854e76, 0x095526cb4b2cc423,
0x012a32a2b18a70a7, 0xa6f615803de26f24, 0x5b592e5e4567fcb0, 0x063f1db81f5540a8,
0xc809aa073528a025, 0x09cdcd79985d2965, 0xda681fffe5fa0892, 0x2a626b47b2d26d2c,
0x0807d892481628fd, 0x80a0f4be45189652, 0x89d69eba72fc4c34, 0x17d5b87c3657df3c,
0x78a95023d5b98d23, 0x7c8703ae3c18726e, 0xf11f2ae897a70e55, 0x284e583469ea05fd,
0x5c78b92a2d57def5, 0xead6bf071c830e3c, 0xd00d137a0eee7e06, 0x255daa128f75da34,
0x9ca13ef1d11e0c2d, 0x519ab8ed06c3143b, 0x4f3125f903a33bdd, 0x0052e9a9b5f419b1,
0x0110ac923f3a989c, 0x45d8ecdba20dba51, 0xb1a90e55b3ef8eb2, 0x0582d5b3b958cd5e,
0x7c677a37951c3660, 0x6165551a664cba54, 0x0cf831b967866c92, 0x04df8c0defdc0228,
0x313498ec5d0b1b02, 0x20469c41cff2f587, 0x4fbbb676a088dc9d, 0x2382d616e8c47fdd,
0x8158d2dd68060c91, 0x360e89aa08bd1065, 0x221f92df23f89c4a, 0x0d086948c84c5518,
0xef8b7d84465093fe, 0xda6d9660607ea33d, 0x923e7a30aee3f519, 0x0af02d0e1317d88c,
0x6ff329e0837bd972, 0xc8f50fdd3368c663, 0xf3073e49cad576a6, 0x23b0c3ba6f80cf25,
0x03ec52218f784dc9, 0x3ccd5b515710a3ab, 0xa3a5ecc873b0cef6, 0x00e115c4a98efae6,
0xe9ea61d577a202a7, 0xb4a91b54c37c7e72, 0xa6e26f7dbc0dcfaf, 0x18ec1888a2f457d4,
0x46308e76104c62f6, 0xa4ade867a8a359ac, 0x9061e56f764fdfe8, 0x226a91a571ed1b2f,
0x5cb845d7ce62aa15, 0x4b29ce61e4975956, 0xc8898fe2e8532eb9, 0x1f71e007903cbfe8,
0xe37875824eb49859, 0x329730bde85a4185, 0x37378e7435332174, 0x24e65c718938c2b9,
0xb5b28901684a8eb8, 0xc31de964fa1a5df0, 0x788a142dca2be4a1, 0x081b774b0a70dc72,
0x9d737f8a33d1ffa6, 0x6b790cbd80204cf6, 0xbc547403eb00095d, 0x2f0c13445d90cb0e,
0xea1edff5f0fb0298, 0x5f4b0ba78d72ef13, 0x3234fcf5db9b6b22, 0x23248698612cd8e8,
0x6ac68397510cf0d0, 0x6d7e9a4e8f40edd4, 0x0db94f9017b1baf9, 0x1118c071b4fb39eb,
0xb574b1b945c82ef8, 0x256770608cbc2fab, 0x4731c9ff31b4dc51, 0x00f7f822f933820f,
0xe7ead79bb4f60f79, 0x4e60be2cfd9a4643, 0x7b201d6c5e56a579, 0x01cd399556445e3d,
0x9c92c7e3b3a8312c, 0xd37fc4b39d27bb8d, 0xd6a0d672ff670579, 0x1b58716ce9cada90,
0xf104fb76b8171811, 0xf68fbcfb11b6815a, 0xcd74280ef64d4956, 0x058402b966fb4ab2,
0x5025b7976986b2ad, 0x8518a760f0c7eb3e, 0x1410d7d592c0ca30, 0x2398eafda87885d5,
0x622bae6482c9d728, 0xb71b92da9cd9c778, 0x3ceb2b16f4a19a95, 0x0dd2dfe8f3aa9e4d,
0x6856ff7e8aaf9aff, 0xa6d2923402b91304, 0x27850d95a13942ae, 0x1482ac3e7e4f3216,
0xed22a40ae9398f47, 0xf6fcb4c5fa15c130, 0xccfe954de7ad22cc, 0x17332b4c7aac2a07,
0x0b7b993b7fdd857f, 0xb81382764b7d9f28, 0xf0a001d96f8410c6, 0x132ccb7a7c7903f9,
0xd08bc01609b7b082, 0x5b4aae7dbb2b7bb8, 0x10c0b3200849caca, 0x1521dbdf2f88fd7c,
0x5bad732373526d32, 0x3bff87e01694c589, 0xd6a34b075099d59a, 0x2a0892d6b1ae3cab,
0x64a1177d38b5c13c, 0xba85019aa0af61b2, 0xa337561401f06682, 0x15a16435a2300b27,
0xf9ed259793f392a1, 0x9b108d4136b32fa7, 0x93a22ab6ee15509d, 0x22616f306e763522,
0xc680a6e8dae1851d, 0xd0d32dc23b5efd0f, 0x54908e42903beaf9, 0x2132d93f742f2ac6,
0x9a901a2942ae638e, 0x56bbb28b6a50a114, 0x1fd7be3423b72673, 0x0e6264ac0dc6688a,
0xa6bdf82fd94cf3ad, 0xbee22c5b7c2414f5, 0x44118023dead77cd, 0x17dead3bfa1968c7,
0x00c4d57497e1d7f4, 0x772130123de8144a, 0x0100f4a552a9d02b, 0x2bef0f8b22a1cfb9,
0xfbf521384d152a0e, 0xa214be09a0f861a1, 0xf344531c0e4b9b1b, 0x2e249d189c5ab035,
0x444f7a255d6b4dfd, 0xe1dca77426ee678a, 0x42e6d629d607e97e, 0x0b468ebcf7fc9de9,
0x2ad0cba02338d9a6, 0xf6e6d285e65b0dcc, 0x5720051ff644e617, 0x13681ba8a95a21e6,
0x3a672b43491ad644, 0x4f1e7e89227dc270, 0x92855f63a0c9e737, 0x0bb7f176c4c62cab,
0xa409a76836768a78, 0xc2a49bc16a845262, 0xff39c8f47497e596, 0x02aa427b8648ae82,
0x86522277eb3ebcc3, 0x7737dff7847fee1b, 0xea3acef661b2fa79, 0x0c40f19ecd5513a5,
0x1bef3a9004fe6295, 0x923d2bd63b8db9a5, 0x07945129389362b0, 0x1861ae1e114291d1,
0x124f258f08cdebf1, 0x852397436035daef, 0x70ab0224bc29c24c, 0x2a6ba2a368b91dd6,
0x89de3d88ee7627f9, 0x52c9bd25f91ebfa5, 0x4ed5851c9575c227, 0x25b068c942724c42,
0x4bb32b410e01e1a6, 0x707d38f7db68199c, 0x404cca45f1823a62, 0x2c0767c7996f9a36,
0x9e54de8f0f518540, 0x25b52d0cc49daf3b, 0x616c4a461dce9e62, 0x067a20b1df30438e,
0x16bd8797bb4b70c9, 0x5d2fd0f0eee1d693, 0x3785e8bc5f787252, 0x215deaf3c2fe9f8a,
0x5d9242f27d0fcc74, 0x586e4cb458dd9be7, 0xe7ddbcf3f573e116, 0x2fb50b2d3af74321,
0xa16ea2502f1bad5f, 0x449f3b2fe580816a, 0xe98ce87f78923799, 0x02c871f0ddf5dfc9,
0xae196604956280a3, 0x544eb394e71fed7d, 0x54e6a9588d9e9770, 0x0871d0eb7536b5ad,
0xbd9cb5e25cb3042d, 0xce8e08b8b56f8851, 0x3aa2b0fa49224a3d, 0x13218626665c420d,
0xb1bfcfb91873e30e, 0xa6d5ace02773f6b0, 0xdc61b6c1207b73b3, 0x0e9fc2cb907861c7,
0xd4c604b0d22d1c46, 0x32170ebe2a12121a, 0x2ebdffbb42831bea, 0x2a79e5febcf2f8b4,
0xf952f59cd5f56ac9, 0x4fa76bbc4feb2a7b, 0x94fc2df098148758, 0x2943a0e1e2336d76,
0x3940c00bdb863709, 0xed0b5af51017da14, 0xed79073ee091a0e8, 0x196bc98252f63169,
0xc13aa6aaa8fad6be, 0x0f1cfcf0f8fc51af, 0x0e743bca0d6ab7a4, 0x17e885a4e4971352,
0x1947aa319dc56d43, 0x55ebe762faed8da1, 0x514b9b293d0ad156, 0x26d61bd45f606ca6,
0x0f0e7cd92b331cdc, 0xd650885b7886cba7, 0x431af4d59c6a7709, 0x1efcda9d986cddcf,
0xac6240eb7f60418e, 0xca98bde87953b3f3, 0x2a22c32cce354515, 0x123925acd4f1aa1e,
0xcddf83ce44c7e41c, 0x25de051592e76a5c, 0xaa89359aa8cda1a7, 0x14704dd362d250ed,
0x696ecb44448dd0a4, 0x438713731fcb8b97, 0x107d5ac9e86d5109, 0x1b0273b47db1989e,
0x9b16a8457409861a, 0x3f97d7a72aa96388, 0xbc36f0e814d29fef, 0x17a993a6af068d72,
0xa2787c69fe5a07b3, 0x4093f1e1d5548d90, 0x26576975dc6d29e6, 0x0e535cb0c3f1cdb0,
0x6d63c0ab3c072b19, 0xf57e6d5a5642d6b5, 0x5bce489a4603ec90, 0x216c3a201f899c06,
0x09799d04d97bc47c, 0x77ae410473d21ee1, 0xeb9f87575ad47718, 0x0f208cbc3b076c66,
0xedd057a6df967877, 0x6064024b701e1c8d, 0xd97a5d24ef18089d, 0x1c2685c8bb95d9cb,
0xeec47209f9fa5957, 0xccf126335f9ca6b3, 0x3d9b15388528a67e, 0x0f55ca8ae78360fa,
0x1865cfaa8797769e, 0x66d180645efa0d83, 0x1d8fb37de17ccf3b, 0x263e1195090d00be,
0x6b14a862aa85029b, 0xe32bed600dbecd16, 0x9e5b7bf56f5ebb01, 0x24cacf436717ac53,
0x0a878d489b97a2a9, 0xa125918e0d2011e0, 0x808457eef387b09f, 0x105c861f78d37579,
0x396c58fb9f89e620, 0x3a0c5e18b104bf47, 0xbc3b0a5d653f22c7, 0x050696b356b09def,
0xc5c4f1a4ae37b998, 0xcc3c61dda109bb64, 0x6288d9d5c844f4df, 0x2185b14275ecd4c3,
0x06100c8992372262, 0x1063e4409b82cda6, 0x9c797b8199d412f7, 0x0c715b745408b0ba,
0xe35ce6edef6cc83c, 0x20bf031546b26237, 0x7a24fb592301daae, 0x23900264b13be89a,
0xce40754b3df10521, 0x3526c53a74973ecf, 0x9cef009c51155ae9, 0x1f7476211105b303,
0xd23b3f3151a5a6e2, 0x447ac4afb1543014, 0xfc69b61cec7f8e86, 0x284aad6697126c6a,
0x38cb3d9f02a5a493, 0xda89ddb79af59586, 0x5b3650a1c0b4debb, 0x009b9d0a9720fffc,
0xa9c22f22b2b07489, 0xc2af91862231912c, 0xe79bc5445ab38f3c, 0x186e8b3288ff778e,
0xd6b781f439c20c0b, 0x5d00fc101129f08f, 0x137981fece56e977, 0x04af9e46dbc42b94
];

function mimc_cipher(xL_in: usize, xR_in: usize, k_in: usize, xL_out: usize, xR_out: usize): void {
    let tmp = (new Uint8Array(SIZE_F)).buffer as usize;
    let xL = (new Uint8Array(SIZE_F)).buffer as usize;
    let xR = (new Uint8Array(SIZE_F)).buffer as usize;
    bn128_frm_zero(xL);
    bn128_frm_zero(xR);

    let t = (new Uint8Array(SIZE_F)).buffer as usize;
    let t2 = (new Uint8Array(SIZE_F)).buffer as usize;
    let t4 = (new Uint8Array(SIZE_F)).buffer as usize;
    let num_round_constants = (round_constants.length / 4 );

    let zero = (new Uint8Array(SIZE_F)).buffer as usize;
    bn128_frm_zero(zero);

    for (let i = 0; i < num_rounds; i++) {

        let c: usize = 0;
        if (i == num_rounds - 1) {
            c = zero;
        } else {
            c = ( round_constants.buffer as usize + SIZE_F * ( (i - 1) % num_round_constants)) as usize;
        }

        if ( i == 0 ) {
          // t = k + kL_in;
          bn128_frm_add(k_in, xL_in, t);
        } else {
          // t = k + k[i-1] + c;
          bn128_frm_add(c, xL, t);
          bn128_frm_add(t, k_in, t);
        }

        // t2 = t * t
        bn128_frm_mul(t,t,t2);

        // t4 = t2 * t2;
        bn128_frm_mul(t2,t2,t4);

        if ( i < num_rounds - 1 ) {
          //tmp = xL
          memcpy(tmp, xL);

          bn128_frm_mul(t4, t, xL);

          if (i == 0) {
              bn128_frm_add(xL, xR_in, xL);
              memcpy(xR, xL_in);
          } else {
              bn128_frm_add(xL, xR, xL);
              memcpy(xR, tmp);
          }
        } else {
          // xL_out = xL;
          memcpy(xL_out, xL);
          
          // xR_out = xR + t4 * t
          bn128_frm_mul(t4, t, xR_out);
          bn128_frm_add(xR_out, xR, xR_out);
        }
    }
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

    //outputs[0] = xL_out
    //memcpy(outputs, xL_out);

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
    let num_round_constants = (round_constants.length / 4 );

    // TODO express the round constants in montgomery form instead of converting them here
    for (let i = 0; i < num_round_constants; i++) {
        bn128_frm_toMontgomery(round_constants.buffer as usize + i * SIZE_F, round_constants.buffer as usize + i * SIZE_F);
    }

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
    memcpy(xL_in, left);

    // xR_in = 0
    bn128_frm_zero(xR_in);

    mimc_cipher(xL_in, xR_in, k, xL_out, xR_out);

    // xL_in = xL_out + inputs[i]
    bn128_frm_add(xL_out, right, xL_in);

    // xR_in = xR_out
    memcpy(xR_in, xR_out);

    mimc_cipher(xL_in, xR_in, k, xL_out, xR_out);

    memcpy(result, xL_out);
}
