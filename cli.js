const circomlib = require('circomlib')
const snarkjs = require('snarkjs')
const crypto = require('crypto')
const argv = require('yargs').argv

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

        console.log(JSON.stringify(createDeposit(argv.nullifier, argv.secret)));
    })
    .command('withdraw', 'generate withdraw [nullifier] [secret] [nullifier_hash] [recipient] [root] [witnesses] [selectors]', (yargs) => {
        yargs.positional('nullifier')
            .positional('secret')
            .positional('nullifier_hash')
            .positional('recipient')
            .positional('root')
            .positional('witnesses')
            .positional('selectors')
    }, (argv) => {
        let deposit = { secret: argv.secret, nullifier: argv.nullifier, nullifier_hash: argv.nullifier_hash };
        let recipient = argv.recipient;
        let root = argv.root;
        let witnesses = argv.witnesses.split(',');
        let selectors = argv.selectors.split(',');
        console.log(createWithdrawal(deposit, recipient, root, witnesses, selectors));
        withdraw(deposit, recipient, root, witnesses, selectors).then((v) => {
            console.log(v)
        })
    }).argv

/*
if (argv.deposit) {
    let nullifier = rbigint(31);
    let secret = rbigint(31);
    let deposit = createDeposit(nullifier, secret);

    console.log(deposit)
} else if (argv.withdraw) {

}*/

function createDeposit() {
    let nullifier = rbigint(31);
    let secret = rbigint(31);

	let preimage = Buffer.concat([nullifier.leInt2Buff(31), secret.leInt2Buff(31)]).toString('hex')
	let commitment = pedersenHash(preimage).toString(16)
	let nullifierHash = pedersenHash(nullifier.leInt2Buff(31)).toString(16)
	return {preimage, commitment, nullifierHash } 
}

// return json for the snark proof
async function withdraw(deposit, recipient, root, witnesses, selectors) {
	// generate snark proof of withdrawal
  const input = {
    // Public snark inputs
    root: root,
    nullifierHash: deposit.nullifierHash,
    recipient: bigInt(recipient),
    relayer: bigInt(relayer),
    fee: bigInt(fee),
    refund: bigInt(refund),

    // Private snark inputs
    nullifier: deposit.nullifier,
    secret: deposit.secret,
    pathElements: path_elements,
    pathIndices: path_index,
  }

  console.log('Generating SNARK proof')
  console.time('Proof time')
  const proofData = await websnarkUtils.genWitnessAndProve(groth16, input, circuit, proving_key)
  debugger
  console.timeEnd('Proof time')

  const args = [
    toHex(input.root),
    toHex(input.nullifierHash),
    toHex(input.recipient, 20),
    toHex(input.relayer, 20),
    toHex(input.fee),
    toHex(input.refund)
  ]

  return { proof, args }
}
