"""
DeathBox — Solana Service (Solana Person)
==========================================
PLACEHOLDER: This file returns fake data right now.
The Solana person replaces write_to_solana() internals with real
Solana devnet code. Person B calls this from /api/seal.

What the real version will do:
1. Connect to Solana devnet
2. Create a transaction with the Memo Program
3. Write the package hash as a memo on-chain
4. Return the transaction signature

For now, it returns a realistic-looking fake tx signature so
Person B can build and test /api/seal without waiting.
"""

import hashlib
import time


async def write_to_solana(package_hash: str) -> str:
    """
    Write a package hash to Solana blockchain.

    Args:
        package_hash: SHA-256 hash of the package data (64-char hex string)

    Returns:
        Solana transaction signature string

    TODO (Solana person): Replace this with real Solana devnet code:
        - Connect to clusterApiUrl('devnet')
        - Create keypair or connect Phantom wallet
        - Build transaction with MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr
        - Memo data: f"DEATHBOX|{package_id}|{package_hash}|{timestamp}"
        - Send and confirm transaction
        - Return the actual tx signature
    """
    # ── PLACEHOLDER — generates a realistic-looking fake tx signature ──
    # The Solana person replaces everything below this line

    fake_seed = f"{package_hash}{time.time()}"
    fake_tx = hashlib.sha256(fake_seed.encode()).hexdigest()[:88]

    print(f"⚠️  Solana PLACEHOLDER — returning fake tx: {fake_tx[:20]}...")
    print(f"    Hash that would be written: {package_hash[:20]}...")
    print(f"    → Solana person: replace this with real devnet code")

    return fake_tx
