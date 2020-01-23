# Daiquiri

Daiquiri is an Eth2 Execution Environment for a coin-mixer.  The design is adapted from Tornado Cash.

## Usage

Test deposit and withdrawal:

`npm run build:verifier && npm run test`

## How does a mixer like Tornado Cash work?

State is expressed as two merkle tree represented as `withdrawal_root` and `deposit_root`.

To deposit, a user generates two values `secret`, `nullifier` and commits `hash(secret + nullifier)`.  They place the commitment in the deposit tree.

To withdraw, a user creates a ZKSNARK proof that `hash(secret + nullifier)` is in the tree represented by `deposit_root`.  Only `nullifier` is a public input to the circuit.  `nullifier` is added to the withdrawal tree.

Because `hash` cannot be inverted, `nullifier` cannot be derived from `hash(secret + nullifier)` or vice versa.  Thus, the deposit of a commitment cannot be linked to its corresponding withdrawal.

**Note** 
* The use of a relayer is preferred for withdrawals for UX reasons (expand on this)
* The nullifier acts to prevent users being able to cash out of the mixer more than once per commitment.
* The requirement of computing `hash` within a SNARK circuit means that we use a SNARK-friendly hash function (in this case MiMC-...)

## How does this change with Eth2?

Instead of storage, Eth2 represents the entire state with one 32 bit state root.

Luckily, mixers are easily adapted to fit this requirement.  This means that all transactions to the mixer must come with merkle proofs of the addition of a new `nullifier`/`commitment` to the withdrawal/deposit trees.  

Because the deposit/trees are append-only, validation of the addition of a nullifier/deposit is a two step process:
* Checking that the nullifier/deposit was not previously in the tree: replace the merkle proof leaf with `hash(0)` (NULL), compute the root and verify that it is correct against the prestate.
* Checking that the merkle proof (with the added leaf) is correct.

The mixer state root is formed by `hash(withdrawal_root + deposit_root)`
