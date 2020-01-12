import binascii

from mimc import MiMC
from snarkjs_wrapper import generate_deposit
from merkle_tree import MerkleTree

def num_to_hex(g1):
  result = bytearray.fromhex(hex(int(g1))[2:].zfill(64))
  result.reverse()
  return binascii.hexlify(result).decode()

class Mixer:
    def __init__(self):
        self.commitments = []
        self.nullifiers = []
        self.hasher = MiMC()

        self.deposit_tree = MerkleTree(20, self.hasher) 
        self.withdrawal_tree = MerkleTree(20, self.hasher)

    def get_mixer_root(self):
        return self.hasher.hash(self.deposit_tree.get_root(), self.withdrawal_tree.get_root())

    def deposit(self):
        # TODO leaf should be a hash, not an index
        # deposit = int(generate_deposit()['commitment'], 16)
        deposit = 14053575698504845674493400034513490149458859037183542549723210938865283594656

        # TODO assert !self.deposit_tree.contains(deposit)

        if not self.deposit_tree.insert(deposit):
            raise Exception("duplicate deposit, regenerate and try again")
            # TODO

        proof = self.deposit_tree.get_proof(deposit)

        import pdb; pdb.set_trace()
        if not proof.verify():
            raise Exception("invalid proof generated... this indicates a bug")

        # root + witnesses { nullifier_root, deposit witnesses... } + deposit
        return num_to_hex(self.get_mixer_root()) + num_to_hex(self.withdrawal_tree.get_root()) + self.deposit_tree.get_proof(deposit).serialize()

    def withdraw(self, nullifier):
        self.nullifiers.append(nullifier)

        # return a serialized withdrawal command

    def root(self):
        return self.hasher.hash(self.commitments.root(), self.nullifiers.root())


if __name__ == "__main__":
    secret = ""
    nullifier = ""

    mixer = Mixer()
    print(mixer.deposit())

    # create stateless proofs for one deposit/withdraw pair, place them in separate test cases for benchmarking purposes

    # TODO test for duplicate keys
