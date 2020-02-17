var assert = require("assert");
var fs = require("fs");
const js_yaml = require("js-yaml");

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

function getImports(env) {
  return {
    env: {
      eth2_blockDataCopy: function(ptr, offset, length) {
        memset(mem, ptr, env.blockData.slice(offset, offset + length));
      },
      eth2_loadPrestateRoot: function(dst) {
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
        res = memget(mem, ptr, 384);
      },
      eth2_blockDataSize: function() {
        return env.blockData.byteLength;
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
    //assert(postStateRoot.length === 384)

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
