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
      input_data_copy: function(ptr, offset, length) {
        memset(mem, ptr, env.blockData.slice(offset, offset + length));
      },
      prestate_copy: function(dst) {
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
      save_output: function(ptr) {
        res = memget(mem, ptr, 32);
      },
      input_size: function() {
        return env.blockData.byteLength;
      }
    }
  };
}

function parseYaml(file) {
  var testCase = js_yaml.safeLoad(file);
  var wasm_source = testCase.merkle_tree_source;

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

function main() {
  var yamlPath;
  if (process.argv.length === 3) {
    yamlPath = process.argv[2];
  } else if (process.argv.length === 2) {
    yamlPath = "test.yaml";
  } else {
    throw new Error("invalid args");
  }
  var yamlFile = fs.readFileSync(yamlPath, { encoding: "utf8" });
  var testCases = parseYaml(yamlFile);

  var wasmFile = fs.readFileSync(testCases.testSource);
  var wasmModule = new WebAssembly.Module(wasmFile);

  for (var i = 0; i < testCases.tests.length; i++) {
    var testCase = testCases.tests[i];
    let input = testCase.input;
    var instance = new WebAssembly.Instance(
      wasmModule,
      getImports({ blockData: input, prestate: testCase.prestate })
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
    preStateRoot = res;
    assert(
      testCase.expected.equals(res),
      "expected " +
        testCase.expected.toString("hex") +
        ", received " +
        res.toString("hex")
    );
  }
}

main();
