import random
import unittest

from mimc import MiMC

def make_node(index, value):
    return { 'index': index, 'value': value }

class MerkleProof:
    def __init__(self, root, leaf, index, witnesses, hasher, selectors):
        self.root = root
        self.leaf = leaf
        self.index = index
        self.witnesses = witnesses
        self.hasher = hasher
        self.selectors = selectors

    def serialize(self) -> str:
        pass

    def verify(self) -> bool:
        index = self.index
        computed_root = None
        
        # TODO assert len(selectors) == len(witnesses)

        if self.selectors[0] == 0:
            computed_root = self.hasher.hash(self.leaf, self.witnesses[0])
        else:
            computed_root = self.hasher.hash(self.witnesses[0], self.leaf)

        for i in range(1, len(self.selectors)):
            selector = self.selectors[i]
            witness = self.witnesses[i]

            if selector % 2 == 0:
                computed_root = self.hasher.hash(computed_root, witness)
            else:
                computed_root = self.hasher.hash(witness, computed_root)

        if computed_root != self.root:
            return False

        return True

class MerkleTree:
    def __init__(self, indices: [int], values: [int], depth: int, hasher):
        self.depth = depth
        self.largest_index = int(2 ** (depth + 1) ) - 2
        self.hasher = hasher
        self.row_starts = [0, 1]

        for i in range(1, self.depth):
            self.row_starts.append(self.row_starts[i] + 2**i)

        self.merkleize(indices, values)

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

    def get_parent_idx(self, tree_idx):
        return int(tree_idx / 2)

    def hash_level(self, idxs, lvl):
        idxs = [{'index': index, 'value': value} for index, value in idxs.items()]
        siblings = list(self.pair_siblings(idxs))
        result = {}

        for left, right in siblings:
            parent_idx = self.get_parent_idx(left['index'])
            parent_value = self.hasher.hash(left['value'], right['value'])
            result[parent_idx] = parent_value

        return result


    def pair_siblings(self, nodes):
        nodes = sorted(nodes, key = lambda x: x['index'])
        i = 0
        while i < len(nodes):
            if self.get_row_idx(nodes[i]['index']) % 2 == 0:
                if i+1 < len(nodes) and nodes[i+1]['index'] == nodes[i]['index'] + 1:
                    yield(nodes[i], nodes[i + 1])
                    i += 2
                else:
                    yield (nodes[i], make_node(i + 1, self.hasher.null()))
                    i += 1
            else:
                yield (make_node(i - 1, self.hasher.null()), nodes[i] )
                i += 1

    def merkleize(self, indices: [int], values: [int]):
        # lookup map for the hash at a given index (indexing in an array described
        # above)
        tree_levels = [{} for i in range(self.depth + 1)]
        tree = {}

        if len(indices) == 0:
            return { 0: self.hasher.null() }

        for i in range(len(indices)):
            tree_idx = i + int(2**(self.depth + 1) / 2) - 1 # add offset to start of bottom level
            tree_levels[self.depth][tree_idx] = values[i]

        for lvl in reversed(range(0, self.depth)):
            tree_levels[lvl] = self.hash_level(tree_levels[lvl + 1], lvl + 1)

        for lvl in tree_levels:
            for idx, value in lvl.items():
                tree[idx] = value

        self.tree = tree

    def compute_proof(self, row_index: int) -> MerkleProof:
        root = self.tree[0]
        witnesses = []
        selectors = []
        index = self.get_tree_index(row_index)
        leaf = self.tree[index]

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

            index = self.get_parent_idx(index)

        return MerkleProof(root, leaf, index, witnesses, self.hasher, selectors)

class TestMerkleTree(unittest.TestCase):
    def test_basic(self):
        hasher = MiMC()
        tree = MerkleTree([0, 1], [1, 2], 20, hasher)

        proof_0 = tree.compute_proof(0)
        self.assertTrue(proof_0.verify())

if __name__ == "__main__":
    unittest.main()
