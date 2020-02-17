var assert = require("assert");
var fs = require("fs");
const js_yaml = require("js-yaml");
const BN = require('bn.js')
const { TWO_POW256 } = require('ethereumjs-util')

let res = null;
let mem = null;

setMemory = function(m) {
  mem = m;
};

var memset = function(mem, offset, data) {
  var asBytes = new Uint8Array(mem.buffer, offset, data.length);
  asBytes.set(data);
};
var memget = function(mem, offset, length) {
  return Buffer.from(new Uint8Array(mem.buffer, offset, length));
};

// 0x30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47
var bn128_field_modulus = new BN('30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47', 16);
var bn128_r_inv = new BN('9ede7d651eca6ac987d20782e4866389', 16);
var bn128_r_squared = new BN('06d89f71cab8351f47ab1eff0a417ff6b5e71911d44501fbf32cfc5b538afa89', 16)

const MASK_256 = new BN('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 16);

var field_modulus = bn128_field_modulus;
var r_inv = bn128_r_inv;
var r_squared = bn128_r_squared;

function addmod(a, b) {
  var res = a.add(b);
  if (res.cmp(field_modulus) >= 0) {
    res.isub(field_modulus);
  }
  return res
}

function submod(a, b) {
  var res = a.sub(b);
  if (res.cmpn(0) < 0) {
    res.iadd(field_modulus);
  }
  return res
}

function mulmodmont(a, b) {
  var t = a.mul(b);
  var k0 = t.mul(r_inv).maskn(128);
  var res2 = k0.mul(field_modulus).add(t).shrn(128);
  var k1 = res2.mul(r_inv).maskn(128);
  var result = k1.mul(field_modulus).add(res2).shrn(128);
  if (result.gt(field_modulus)) {
    result = result.sub(field_modulus)
  }
  return result
}

function getImports(env) {
  return {
    env: {
      eth2_blockDataCopy: function(ptr, offset, length) {
        memset(mem, ptr, env.blockData.slice(offset, offset + length));
      },
      eth2_loadPreStateRoot: function(dst) {
          memset(mem, dst, env.prestate);
      },
      debug_printMemHex: function(ptr, length) {
        console.log(
          "debug_printMemHex: ",
          ptr,
          length,
          memget(mem, ptr, length).toString("hex")
        );
      },
      eth2_savePostStateRoot: function(ptr) {
        res = memget(mem, ptr, 32);
      },
      eth2_blockDataSize: function() {
        return env.blockData.byteLength;
      },
      bignum_add256: (aOffset, bOffset, cOffset) => {
        const a = new BN(memget(mem, aOffset, 32))
        const b = new BN(memget(mem, bOffset, 32))
        const c = a.add(b).mod(TWO_POW256).toArrayLike(Buffer, 'be', 32)
        memset(mem, cOffset, c)
      },
      bignum_mul256: (aOffset, bOffset, cOffset) => {
        const a = new BN(memget(mem, aOffset, 32))
        const b = new BN(memget(mem, bOffset, 32))
        const c = a.mul(b).mod(TWO_POW256).toArrayLike(Buffer, 'be', 32)
        memset(mem, cOffset, c)
      },
      bignum_sub256: (aOffset, bOffset, cOffset) => {
        const a = new BN(memget(mem, aOffset, 32))
        const b = new BN(memget(mem, bOffset, 32))
        const c = a.sub(b).toTwos(256).toArrayLike(Buffer, 'be', 32)
        memset(mem, cOffset, c)
      },
      bignum_div256: (aOffset, bOffset, cOffset) => {
        const a = new BN(memget(mem, aOffset, 32))
        const b = new BN(memget(mem, bOffset, 32))
        if (b.isZero()) throw new Error('division by zero')
        const c = a.div(b).toArrayLike(Buffer, 'be', 32)
        memset(mem, cOffset, c)
      },
      bignum_mulMod: (aOffset, bOffset, cOffset, rOffset) => {
        const a = new BN(memget(mem, aOffset, 32))
        const b = new BN(memget(mem, bOffset, 32))
        const c = new BN(memget(mem, cOffset, 32))
        if (c.isZero()) throw new Error('modulus is zero')
        const r = a.mul(b).mod(c).toArrayLike(Buffer, 'be', 32)
        memset(mem, rOffset, r)
      },
      // modular multiplication of two numbers in montgomery form (i.e. montgomery multiplication)
      bignum_f1m_mul: (aOffset, bOffset, rOffset) => {
        const a = new BN(memget(mem, aOffset, 32), 'le')
        const b = new BN(memget(mem, bOffset, 32), 'le')

        var result = mulmodmont(a, b);

        //console.log('bignum_f1m_mul a:', a.toString())
        //console.log('bignum_f1m_mul b:', b.toString())
        //console.log('bignum_f1m_mul result:', result.toString())

        var result_le = result.toArrayLike(Buffer, 'le', 32);

        memset(mem, rOffset, result_le)
      },
      bignum_f1m_square: (inOffset, outOffset) => {
        const in_param = new BN(memget(mem, inOffset, 32), 'le');
        var result = mulmodmont(in_param, in_param);

        var result_le = result.toArrayLike(Buffer, 'le', 32)
        memset(mem, outOffset, result_le)
      },
      bignum_f1m_add: (aOffset, bOffset, outOffset) => {
        const a = new BN(memget(mem, aOffset, 32), 'le');
        const b = new BN(memget(mem, bOffset, 32), 'le');
        var result = addmod(a, b);

        var result_le = result.toArrayLike(Buffer, 'le', 32)

        memset(mem, outOffset, result_le)
      },
      bignum_f1m_sub: (aOffset, bOffset, outOffset) => {
        const a = new BN(memget(mem, aOffset, 32), 'le');
        const b = new BN(memget(mem, bOffset, 32), 'le');
        var result = submod(a, b);

        var result_le = result.toArrayLike(Buffer, 'le', 32)
        memset(mem, outOffset, result_le)
      },
      bignum_f1m_toMontgomery: (inOffset, outOffset) => {
        const in_param = new BN(memget(mem, inOffset, 32), 'le');

        var result = mulmodmont(in_param, r_squared);
        var result_le = result.toArrayLike(Buffer, 'le', 32)

        memset(mem, outOffset, result_le)
      },
      bignum_f1m_fromMontgomery: (inOffset, outOffset) => {
        const in_param = new BN(memget(mem, inOffset, 32), 'le');

        var one = new BN('1', 16);
        var result = mulmodmont(in_param, one);
        var result_le = result.toArrayLike(Buffer, 'le', 32)

        memset(mem, outOffset, result_le)
      },
      bignum_int_add: (aOffset, bOffset, outOffset) => {
        const a = new BN(memget(mem, aOffset, 32), 'le');
        const b = new BN(memget(mem, bOffset, 32), 'le');
        //const result = a.add(b).maskn(256);

        // websnark int_add returns a carry bit if the operation overflowed
        const resultFull = a.add(b);
        let carry = 0;
        if (resultFull.gt(MASK_256)) {
          carry = 1;
        }
        //const result = resultFull.maskn(256);
        const result = resultFull.mod(TWO_POW256); // how ethereumjs-vm does it
        const result_le = result.toArrayLike(Buffer, 'le', 32)
        memset(mem, outOffset, result_le)

        return carry
      },
      bignum_int_sub: (aOffset, bOffset, outOffset) => {
        const a = new BN(memget(mem, aOffset, 32), 'le')
        const b = new BN(memget(mem, bOffset, 32), 'le')

        // websnark int_sub returns a carry bit
        const resultFull = a.sub(b)
        let carry = 0
        if (resultFull.isNeg()) {
          carry = 1
        }
        const result = resultFull.toTwos(256);

        const result_le = result.toArrayLike(Buffer, 'le', 32)
        memset(mem, outOffset, result_le)
        
        return carry
      },
      bignum_int_mul: (aOffset, bOffset, outOffset) => {
        const a = new BN(memget(mem, aOffset, 32), 'le');
        const b = new BN(memget(mem, bOffset, 32), 'le');
        //const result = a.mul(b).maskn(256);
        const result = a.mul(b).mod(TWO_POW256);

        const result_le = result.toArrayLike(Buffer, 'le', 32)
        memset(mem, outOffset, result_le)
      },
      bignum_int_div: (aOffset, bOffset, cOffset, rOffset) => {
        // c is the quotient
        // r is the remainder
        const a = new BN(memget(mem, aOffset, 32), 'le');
        const b = new BN(memget(mem, bOffset, 32), 'le');
        // @ts-ignore
        const result = a.divmod(b);
        const result_quotient_le = result.div.toArrayLike(Buffer, 'le', 32)
        const result_remainder_le = result.mod.toArrayLike(Buffer, 'le', 32)

        memset(mem, cOffset, result_quotient_le)
        memset(mem, rOffset, result_remainder_le)
      }
    }
  };
}

/*
function parseYaml(file) {
  var test_cases = js_yaml.safeLoad(file);
  var wasm_source = test_cases 

  var testCases = [];
  let tests = Object.values(testCase.tests);

  // for (var i = 0; i < testCase.tests.length; i++) {
  for (var i = 0; i < tests.length; i++) {
    var expectedResult = Buffer.from(tests[i].expected, "hex");
    let input = Buffer.from(tests[i].input, "hex");
    let prestate = Buffer.from(tests[i].prestate, 'hex');

    testCases.push({
      input: input,
      expected: expectedResult,
      prestate
    });
  }

  return {
    tests: testCases,
    testSource: wasm_source 
  };
}
*/
function parseYaml (file) {
  let file_contents = fs.readFileSync(file)
  const testCase = js_yaml.safeLoad(file_contents)
  const scripts = testCase.beacon_state.execution_scripts
  const shardBlocks = testCase.shard_blocks
  const testCases = []
  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i]
    const preStateRoot = Buffer.from(testCase.shard_pre_state.exec_env_states[i], 'hex')
    const postStateRoot = Buffer.from(testCase.shard_post_state.exec_env_states[i], 'hex')
    assert(preStateRoot.length === 32)
    assert(postStateRoot.length === 32)

    const blocks = []
    for (let b of shardBlocks) {
      if (parseInt(b.env, 10) === i) {
        blocks.push(Buffer.from(b.data, 'hex'))
      }
    }

    testCases.push({
      script,
      preStateRoot,
      postStateRoot,
      blocks
    })
  }


  return testCases
}

function main() {
  var yamlPath;
  if (process.argv.length === 3) {
    yamlPath = process.argv[2];
  } else if (process.argv.length === 2) {
    yamlPath = "test.yaml";
  } else {
    throw new Error("invalid args");
  }

  let testCases = parseYaml(yamlPath)

  for (var i = 0; i < testCases.length; i++) {
    var testCase = testCases[i];
    var wasmFile = fs.readFileSync(testCase.script);
    var wasmModule = new WebAssembly.Module(wasmFile);
    let prestate = testCase.preStateRoot;
    let poststate = testCase.postStateRoot;

    for (var j = 0; j < testCase.blocks.length; j++) {
        let block_data = testCase.blocks[j];
        var instance = new WebAssembly.Instance(
          wasmModule,
          getImports({ blockData: block_data, prestate: prestate })
        );

        setMemory(instance.exports.memory);
        var t = process.hrtime();

        instance.exports.main();
        t = process.hrtime(t);
        console.log(
          "benchmark took %d seconds and %d nanoseconds (%dms)",
          t[0],
          t[1],
          t[1] / 1000000
        );
    }
    assert(
      testCase.postStateRoot.equals(res),
      "expected " +
        testCase.postStateRoot.toString("hex") +
        ", received " +
        res.toString("hex")
    );
  }
}

main();
