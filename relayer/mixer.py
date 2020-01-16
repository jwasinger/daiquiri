import binascii

from mimc import MiMC
from snarkjs_wrapper import generate_deposit, generate_withdrawal
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
        #deposit = self.hasher.null()
        nullifier = 2
        secret = 3
        deposit = generate_deposit(secret, nullifier)# 14053575698504845674493400034513490149458859037183542549723210938865283594656

        commitment = int(deposit['commitment'], 16)

        # TODO assert !self.deposit_tree.contains(deposit)

        if not self.deposit_tree.insert(commitment):
            raise Exception("duplicate deposit, regenerate and try again")
            # TODO

        proof = self.deposit_tree.get_proof(commitment)

        if not proof.verify():
            raise Exception("invalid proof generated... this indicates a bug")

        # root + witnesses { nullifier_root, deposit witnesses... } + deposit
        # serialized = num_to_hex(self.get_mixer_root()) + num_to_hex(self.withdrawal_tree.get_root()) + self.deposit_tree.get_proof(commitment).serialize()
        # print("serialized deposit proof:\n" + serialized)

        return deposit

    def withdraw(self, deposit):
        deposit_proof = mixer.deposit_tree.get_proof(int(deposit['commitment'], 16))
        withdrawal = generate_withdrawal(deposit, deposit_proof)

        nullifier = int(deposit['nullifierHash'], 16)
        self.nullifiers.append(nullifier)

        # TODO serialize the proof

        # return a serialized withdrawal command

    def root(self):
        return self.hasher.hash(self.commitments.root(), self.nullifiers.root())


if __name__ == "__main__":
    secret = ""
    nullifier = ""

    mixer = Mixer()
    deposit = mixer.deposit()

    mixer.withdraw(deposit)

    # create stateless proofs for one deposit/withdraw pair, place them in separate test cases for benchmarking purposes

    # TODO test for duplicate keys
