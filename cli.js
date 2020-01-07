const circomlib = require('circomlib')
const argv = require('yargs').argv

/** Compute pedersen hash */
const pedersenHash = data => circomlib.babyJub.unpackPoint(circomlib.pedersenHash.hash(data))[0]

if (argv.deposit) {
    let nullifier_hash = pedersenHash(argv.deposit)
    console.log(nullifier_hash)
}

function createDeposit(nullifier, secret) {
	let deposit = { nullifier, secret }
	deposit.preimage = Buffer.concat([deposit.nullifier.leInt2Buff(31), deposit.secret.leInt2Buff(31)])
	deposit.commitment = pedersenHash(deposit.preimage)
	deposit.nullifierHash = pedersenHash(deposit.nullifier.leInt2Buff(31))
	return deposit
}

// return json for the snark proof
function withdraw(note, recipient, root, witnesses, selectors) {
	// generate snark proof of withdrawal
}
