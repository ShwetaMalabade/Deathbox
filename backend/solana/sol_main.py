# sol_main.py — callable API for recording proof transactions on devnet

from solana.sol_utils import record_event_onchain


def record_transaction(kind: str, package_id: str, hash_hex: str, solana_tx: str, note: str = None) -> str:
    """
    Record a proof transaction on Solana devnet.

    Args:
        kind       : "register" or "transfer"
        package_id : e.g. "pkg_464edef4"
        hash_hex   : sha/hash string of your data
        solana_tx  : your app's internal transaction id
        note       : optional extra string to store

    Returns:
        Solana transaction signature (string)
    """
    extra = {"note": note} if note else None

    sig = record_event_onchain(
        kind=kind,
        package_id=package_id,
        hash_hex=hash_hex,
        solana_tx=solana_tx,
        extra=extra,
    )

    print(f"[Solana] {kind.upper()} recorded on devnet")
    print(f"[Solana] Signature : {sig}")
    print(f"[Solana] Explorer  : https://explorer.solana.com/tx/{sig}?cluster=devnet")
    return sig
