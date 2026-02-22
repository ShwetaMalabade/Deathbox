"""
DeathBox — Solana Service
==========================
Records package hashes on Solana devnet using the Memo Program.
Called from /api/seal to produce an immutable on-chain proof.
"""

import uuid
from solana.sol_utils import record_event_onchain, get_client, get_balance_sol
from solana.sol_config import PUBLIC_KEY


async def write_to_solana(package_hash: str) -> str:
    """
    Write a package hash to Solana devnet via Memo Program.

    Args:
        package_hash: SHA-256 hash of the package data (64-char hex string)

    Returns:
        Solana transaction signature string
    """
    internal_tx_id = f"seal_{uuid.uuid4().hex[:12]}"
    package_id = f"pkg_{uuid.uuid4().hex[:8]}"

    try:
        sig = record_event_onchain(
            kind="register",
            package_id=package_id,
            hash_hex=package_hash,
            solana_tx=internal_tx_id,
        )

        print(f"[Solana] REGISTER recorded on devnet")
        print(f"[Solana] Signature : {sig}")
        print(f"[Solana] Explorer  : https://explorer.solana.com/tx/{sig}?cluster=devnet")
        return sig

    except Exception as e:
        print(f"[Solana] ERROR writing to devnet: {e}")
        raise RuntimeError(f"Solana write failed: {e}") from e


async def record_transfer_to_solana(package_id: str, package_hash: str) -> str:
    """
    Record a TRANSFER event on Solana devnet when a package is released
    (dead man's switch expired or demo force-release).
    """
    internal_tx_id = f"xfer_{uuid.uuid4().hex[:12]}"

    try:
        sig = record_event_onchain(
            kind="transfer",
            package_id=package_id,
            hash_hex=package_hash,
            solana_tx=internal_tx_id,
        )

        print(f"[Solana] TRANSFER recorded on devnet")
        print(f"[Solana] Signature : {sig}")
        print(f"[Solana] Explorer  : https://explorer.solana.com/tx/{sig}?cluster=devnet")
        return sig

    except Exception as e:
        print(f"[Solana] ERROR recording transfer: {e}")
        raise RuntimeError(f"Solana transfer write failed: {e}") from e


async def get_solana_balance() -> dict:
    """Check the devnet wallet balance (useful for health checks)."""
    try:
        client = get_client()
        balance = get_balance_sol(client)
        return {"public_key": PUBLIC_KEY, "balance_sol": balance, "network": "devnet"}
    except Exception as e:
        return {"error": str(e), "network": "devnet"}
