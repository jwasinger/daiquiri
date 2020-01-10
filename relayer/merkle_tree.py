import random
import unittest
import math
import binascii

from mimc import MiMC

def count_to_8_bytes(count):
  return binascii.hexlify(count.to_bytes(8, 'little')).decode()

def num_to_hex(g1):
  result = bytearray.fromhex(hex(int(g1))[2:].zfill(64))
  result.reverse()
  return binascii.hexlify(result).decode()

def byte_to_hex(g1):
  result = bytearray.fromhex(hex(int(g1))[2:].zfill(2))
  result.reverse()
  return binascii.hexlify(result).decode()

def make_node(index, value):
    return { 'index': index, 'value': value }

def get_parent_idx(tree_idx):
    return int(math.ceil(float(tree_idx) / 2.0)) - 1

class MerkleProof:
    def __init__(self, root, leaf, index, witnesses, hasher, selectors):
        self.root = root
        self.leaf = leaf
        self.index = index
        self.witnesses = witnesses
        self.hasher = hasher
        self.selectors = selectors

    def serialize(self) -> str:
        root = num_to_hex(self.root)
        index = count_to_8_bytes(self.index)
        num_witnesses = count_to_8_bytes(20)

        serialized_selectors = ""
        for selector in self.selectors:
            serialized_selectors += byte_to_hex(selector)

        witnesses = ""
        for witness in reversed(self.witnesses):
            witnesses += num_to_hex(witness)

        leaf = num_to_hex(self.leaf)

        selectors = list(map(lambda x: byte_to_hex(x), self.selectors))

        return root + index + num_witnesses + "".join(selectors) + witnesses + leaf

    def verify(self) -> bool:
        index = self.index
        computed_root = None
        
        if self.selectors[0] == 0:
            computed_root = self.hasher.hash(self.leaf, self.witnesses[0])
        else:
            computed_root = self.hasher.hash(self.witnesses[0], self.leaf)

        for i in range(1, len(self.selectors)):
            selector = self.selectors[i]
            witness = self.witnesses[i]

            if selector == 0:
                computed_root = self.hasher.hash(computed_root, witness)
            else:
                computed_root = self.hasher.hash(witness, computed_root)

        if computed_root != self.root:
            return False

        return True

class MerkleTree:
    def __init__(self, depth: int, hasher):
        self.depth = depth
        self.largest_index = int(2 ** (depth + 1) ) - 2
        self.hasher = hasher
        self.row_starts = [0, 1]

        # TODO remove leaf nodes from tree, rename tree to intermediate nodes
        self.leaves = {} # map of index in the bottom row to value
        self.tree = {}

        for i in range(1, self.depth):
            self.row_starts.append(self.row_starts[i] + 2**i)

        # minor hack to set the initial NULL root
        self.leaves = {0 : self.hasher.null() }
        self.merkleize()
        self.leaves = {}

    def get_root(self) -> int:
        return self.tree[0]

    def contains(self, value: int) -> bool:
        leaf_index = value % 2**self.depth
        if leaf_index in self.leaves.values():
            return True

    def insert(self, value: int) -> bool:
        leaf_index = value % 2**self.depth

        if leaf_index in self.leaves.keys():
            return False

        self.leaves[leaf_index] = value

        # TODO: only re-computed the necessary nodes every time we add a new value
        self.merkleize()

        return True

    def insert_multi(self, leaves: [int]):
        pass

    def get_tree_index(self, row_idx, lvl=None):
        if lvl == None:
            # TODO is there a better way to do this?
            lvl = self.depth

        return row_idx + self.row_starts[lvl]
    
    def get_row_idx(self, tree_idx):
        if tree_idx > self.largest_index:
            raise Exception("index too large for tree size")

        for index in range(len(self.row_starts)):
            if tree_idx < self.row_starts[index]:
                if index > 0:
                    return tree_idx - self.row_starts[index - 1]
                else:
                    return 0

        return tree_idx - self.row_starts[-1]


    def hash_level(self, idxs, lvl):
        idxs = [{'index': index, 'value': value} for index, value in idxs.items()]
        siblings = list(self.pair_siblings(idxs))
        result = {}

        for left, right in siblings:
            parent_idx = get_parent_idx(left['index'])
            parent_value = self.hasher.hash(left['value'], right['value'])
            result[parent_idx] = parent_value

        return result


    def pair_siblings(self, nodes):
        nodes = sorted(nodes, key = lambda x: x['index'])
        i = 0
        while i < len(nodes):
            row_idx = self.get_row_idx(nodes[i]['index'])
            if row_idx % 2 == 0:
                if i+1 < len(nodes) and nodes[i+1]['index'] == nodes[i]['index'] + 1:
                    yield(nodes[i], nodes[i + 1])
                    i += 2
                else:
                    yield (nodes[i], make_node(row_idx + 1, self.hasher.null()))
                    i += 1
            else:
                yield (make_node(nodes[i]['index']- 1, self.hasher.null()), nodes[i] )
                i += 1

    def merkleize(self):
        # lookup map for the hash at a given index (indexing in an array described
        # above)
        tree_levels = [{} for i in range(self.depth + 1)]
        tree = {}

        if self.leaves == {}:
            return

        for index in self.leaves:
            tree_idx = index + self.row_starts[-1]
            tree_levels[self.depth][tree_idx] = self.leaves[index]

        for lvl in reversed(range(0, self.depth)):
            tree_levels[lvl] = self.hash_level(tree_levels[lvl + 1], lvl + 1)

        for lvl in tree_levels:
            for idx, value in lvl.items():
                tree[idx] = value

        self.tree = tree

    def get_proof(self, value: int) -> MerkleProof:
        row_index = value % 2**self.depth

        if not row_index in self.leaves.keys():
            raise Exception("can't get proof for value not in the tree")

        root = self.tree[0]
        witnesses = []
        selectors = []

        index = self.get_tree_index(row_index)
        leaf = self.leaves[row_index]

        for lvl in reversed(range(self.depth)):
            row_index = self.get_row_idx(index)

            if row_index % 2 == 0:
                if index + 1 in self.tree:
                    witnesses.append(self.tree[index + 1])
                else:
                    witnesses.append(self.hasher.null())

                selectors.append(0)
            else:
                if index - 1 in self.tree:
                    witnesses.append(self.tree[index - 1])
                else:
                    witnesses.append(self.hasher.null())

                selectors.append(1)

            index = get_parent_idx(index)

        return MerkleProof(root, leaf, index, witnesses, self.hasher, selectors)

class TestMerkleTree(unittest.TestCase):
    def test_basic(self):
        hasher = MiMC()
        tree = MerkleTree(20, hasher)

        for i in range(2**5):
            tree.insert(i)

        proof_0 = tree.get_proof(0)
        proof_1 = tree.get_proof(1)
        proof_3 = tree.get_proof(3)

        self.assertTrue(proof_0.verify())
        self.assertTrue(proof_1.verify())
        self.assertTrue(proof_3.verify())

    def test_empty(self):
        hasher = MiMC()
        tree = MerkleTree(20, hasher)

        # TODO test that an empty tree has correct root
        # TODO test insertion of duplicate/colliding values in the tree


if __name__ == "__main__":
    unittest.main()
