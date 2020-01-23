import json
import binascii
import yaml

public_input = None
vk = None
proof = None

def count_to_8_bytes(count):
  return binascii.hexlify(count.to_bytes(8, 'little')).decode()

def num_to_hex(g1):
  result = bytearray.fromhex(hex(int(g1))[2:].zfill(64))
  result.reverse()
  return binascii.hexlify(result).decode()

if __name__ == "__main__":
    proof = None
    test = None

    with open("circuit_input.json") as f:
      proof = json.load(f)

    with open("tests.yml") as f:
      test = yaml.load(f)

    root = num_to_hex(int(proof['root']))

    num_witnesses = count_to_8_bytes(len(proof['pathElements']))
    witnesses = []
    indices = []

    for witness in proof['pathElements']:
        witnesses.append(num_to_hex(int(witness)))

    index = 0
    lvl = 1

    for selector in proof['pathIndices']:
        # indices.append(count_to_8_bytes(pathIndex))
        index += selector * lvl
        lvl *= 2

    witnesses = ''.join(witnesses)
    leaf = num_to_hex(int(proof['leaf']))
    index = count_to_8_bytes(index)

    test['tests']['basic']['input'] = root+index+num_witnesses+witnesses+leaf
    test['tests']['basic']['expected'] = '0'*64

    with open('tests.yml', 'w') as f:
      yaml.dump(test, f)

    print("serialized input:")
    print(root+index+num_witnesses+witnesses+leaf)
