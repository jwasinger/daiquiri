from mimc import MiMC

class Mixer:
    def __init__(self):
        self.commitments = []
        self.nullifiers = []
        self.hasher = MiMC()

    def deposit(self, commitment):
        self.commitments.append(commitment)

        # return a serialized commit command

    def withdraw(self, nullifier):
        self.nullifiers.append(nullifier)

        # return a serialized withdrawal command

    def root(self):
        return self.hasher.hash(self.commitments.root(), self.nullifiers.root())
