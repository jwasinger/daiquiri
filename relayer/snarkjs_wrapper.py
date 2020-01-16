import subprocess
import json
import os

default_recipient = "c0ffee254729296a45a3885639AC7E10F9d54979"
default_relayer =   "fC43749149823761Fa753eFe4c664cdc86C0D63c"
default_fee = 1

def generate_deposit(secret, nullifier):
    js_path = os.path.dirname(os.path.realpath(__file__)) + "/../cli.js"
    deposit_args = ['node', '--experimental-worker', js_path, 'deposit', '--secret', str(secret), '--nullifier', str(nullifier)]
    print(" ".join(deposit_args))
    import pdb; pdb.set_trace()
    return json.loads(subprocess.check_output(deposit_args).decode())

def get_withdrawal_args(deposit, deposit_proof):
    import pdb; pdb.set_trace()
    witnesses = ",".join(map(lambda x: str(x), deposit_proof.witnesses))
    selectors = ",".join(map(lambda x: str(x), deposit_proof.selectors))
    result = [
        "--nullifier="+str(deposit['nullifier']), # TODO use nulliferHash instead of nullifier as public input
        "--secret="+str(deposit['secret']),
        "--commitment="+str(int(deposit['commitment'], 16)),
        "--recipient="+str(int(default_recipient.lower(), 16)),
        "--relayer="+str(int(default_relayer.lower(), 16)),
        "--fee="+str(default_fee),
        "--root="+str(deposit_proof.root),
        "--witnesses="+witnesses,
        "--selectors="+selectors
    ]

    return result

def generate_withdrawal(deposit, deposit_proof):
    js_path = os.path.dirname(os.path.realpath(__file__)) + "/../cli.js"
    withdrawal_args = get_withdrawal_args(deposit, deposit_proof)
    args = ['node', '--experimental-worker', js_path, 'withdraw', *withdrawal_args]

    print(" ".join(args))

    return json.loads(subprocess.check_output(args).decode())
