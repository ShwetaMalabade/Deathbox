# sol_utils.py

import json
from typing import Dict, Any, Optional

from solathon import Client, Keypair, PublicKey, Transaction
from solathon.core.instructions import Instruction, AccountMeta

from solana.sol_config import (
    DEVNET_RPC,
    PRIVATE_KEY_BYTES,   # ← use bytes directly, not from_file
    LAMPORTS_PER_SOL,
    PUBLIC_KEY,
    MEMO_PROGRAM_ID,
    MEMO_PREFIX,
)


def get_client() -> Client:
    return Client(DEVNET_RPC)


def get_wallet() -> Keypair:
    return Keypair.from_private_key(PRIVATE_KEY_BYTES)  # ← same as working code


def get_balance_sol(client: Client) -> float:
    lamports = client.get_balance(PUBLIC_KEY)
    return lamports / LAMPORTS_PER_SOL


def build_memo_instruction(wallet_pubkey: PublicKey, memo_text: str) -> Instruction:
    return Instruction(
        keys=[AccountMeta(public_key=wallet_pubkey, is_signer=True, is_writable=False)],
        program_id=PublicKey(MEMO_PROGRAM_ID),
        data=memo_text.encode("utf-8"),
    )


def record_event_onchain(
    kind: str,
    package_id: str,
    hash_hex: str,
    solana_tx: str,
    extra: Optional[Dict[str, Any]] = None,
) -> str:
    if kind not in ("register", "transfer"):
        raise ValueError("kind must be 'register' or 'transfer'")

    client = get_client()
    wallet = get_wallet()

    payload: Dict[str, Any] = {
        "app": MEMO_PREFIX,
        "kind": kind,
        "package_id": package_id,
        "solana_tx": solana_tx,
        "hash": hash_hex,
    }
    if extra:
        payload.update(extra)

    memo_text = json.dumps(payload, separators=(",", ":"), sort_keys=True)
    memo_ix = build_memo_instruction(wallet.public_key, memo_text)

    tx = Transaction(instructions=[memo_ix], signers=[wallet])
    return client.send_transaction(tx)
