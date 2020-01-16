const circomlib = require('circomlib')
const snarkjs = require('snarkjs')
const crypto = require('crypto')
const argv = require('yargs').argv

const buildBn128 = require("websnark/src/bn128");
const websnarkUtils = require("websnark/src/utils");
const bigInt = snarkjs.bigInt;

/** Compute pedersen hash */
const pedersenHash = data => circomlib.babyJub.unpackPoint(circomlib.pedersenHash.hash(data))[0]
const rbigint = nbytes => snarkjs.bigInt.leBuff2int(crypto.randomBytes(nbytes))

require('yargs')
    .command('deposit', 'generate deposit', (yargs) => {
        /*
        yargs.positional('nullifier', {

        })
        .positional('secret', {

        })
        */
    }, (argv) => {
        //console.log("fuck")
        /*
        console.log(argv.nullifier)
        console.log(argv.secret)
        */

        deposit = createDeposit(bigInt(argv.nullifier), bigInt(argv.secret))

        console.log(JSON.stringify(deposit));
    })
    .command('withdraw', 'generate withdraw [nullifier] [secret] [nullifier_hash] [recipient] [relayer] [root] [witnesses] [selectors]', (yargs) => {
        /*
        yargs.positional('nullifier')
            .positional('secret')
            .positional('nullifier_hash')
            .positional('recipient')
            .positional('root')
            .positional('witnesses')
            .positional('selectors')
            */
    }, (argv) => {
        let deposit = { secret: argv.secret, nullifier: argv.nullifier, nullifier_hash: argv.nullifier_hash };
        let recipient = argv.recipient;
        let root = argv.root;
        let selectors = argv.selectors.split(',').map(x => x.toString());
        let witnesses = argv.witnesses.split(',').map(x => x.toString());
        let relayer = argv.relayer;
        let fee = argv.fee;
        let commitment = argv.commitment;

        // console.log(createWithdrawal(deposit, recipient, root, witnesseB, selectors));
        withdraw(deposit, recipient, root, witnesses, selectors, relayer, fee, commitment);
    }).argv

/*
if (argv.deposit) {
    let nullifier = rbigint(31);
    let secret = rbigint(31);
    let deposit = createDeposit(nullifier, secret);

    console.log(deposit)
} else if (argv.withdraw) {

}*/

function createDeposit(nullifier, secret) {
    // TODO restrict nullifier/secret to fit within the field?

	let preimage = Buffer.concat([nullifier.leInt2Buff(31), secret.leInt2Buff(31)]).toString('hex')
	let commitment = pedersenHash(preimage).toString(16)
	let nullifierHash = pedersenHash(nullifier.leInt2Buff(31)).toString(16)

    secret = parseInt(secret)
    nullifier = parseInt(nullifier)
	return {preimage, commitment, nullifierHash, secret, nullifier } 
}

// return json for the snark proof
async function withdraw(deposit, recipient, root, merkle_witnesses, selectors, relayer, fee, commitment) {
	// generate snark proof of withdrawal
  let circuit = new snarkjs.Circuit(require("./build/circuit/withdraw.json"));
  let proving_key = require("./build/circuit/withdraw_proving_key.json");

  // let groth16 = await buildGroth16();
  let bn128 = await buildBn128();

  //TODO make nullifierHash a public input to the circuit instead of nullifier
  const input = {
    // Public snark inputs
    root: root,
    //nullifierHash: deposit.nullifierHash,
    recipient: bigInt(recipient),
    relayer: bigInt(relayer),
    fee: bigInt(fee),
    nullifier: deposit.nullifier,
    // refund: bigInt(refund), what is this used for?

    // Private snark inputs
    secret: deposit.secret,
    pathElements: merkle_witnesses,
    pathIndices: selectors,
    commitment
  }

  let witnesses = circuit.calculateWitness(input, {
      logOutput: true,
  })

  /*
  console.log('Generating SNARK proof')
  console.time('Proof time')
  const proofData = await bn128.groth16GenProof(, input, circuit, proving_key)
  console.timeEnd('Proof time')
  */

  const proof = await snarkjs.genProof(proving_key, witnesses);

  /*
  const args = [
    toHex(input.root),
    toHex(input.nullifierHash),
    toHex(input.recipient, 20),
    toHex(input.relayer, 20),
    toHex(input.fee),
    toHex(input.refund)
  ]
  */

  return { proof, args }
}
