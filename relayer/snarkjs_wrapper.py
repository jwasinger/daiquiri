import subprocess
import json
import os

def generate_deposit():
    js_path = os.path.dirname(os.path.realpath(__file__)) + "/../cli.js"
    return json.loads(subprocess.check_output(['node', js_path, 'deposit']).decode())
