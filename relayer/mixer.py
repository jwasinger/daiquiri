from mimc import MiMC

def create_deposit(nullifier: int, secret: int) -> (int, int):
    pass

def create_withdraw():
    pass
    
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


if __name__ == "__main__":
    secret = ""
    nullifier = ""

    # create stateless proofs for one deposit/withdraw pair, place them in separate test cases for benchmarking purposes
