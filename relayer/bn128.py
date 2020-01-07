modulus = 21888242871839275222246405745257275088548364400416034343698204186575808495617

def bn128_add(a, b):
    return (a + b) % modulus

def bn128_mul(a, b):
    return (a * b) % modulus
