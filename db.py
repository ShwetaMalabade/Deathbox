"""
DeathBox — Database Module
==========================
One table. Three functions. That's all we need.

Table: packages
- Stores the sealed afterlife packages
- Tracks check-in timestamps for the dead man's switch
- Stores Solana tx hash for verification
"""

import sqlite3
import json
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent / "deathbox.db"


def _get_connection():
    """Get a database connection with row_factory for dict-like access."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """
    Create the packages table if it doesn't exist.
    Call this once when the server starts.
    """
    conn = _get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS packages (
            id              TEXT PRIMARY KEY,
            package_data    TEXT NOT NULL,
            recipient_name  TEXT NOT NULL,
            recipient_email TEXT NOT NULL,
            checkin_days    INTEGER DEFAULT 30,
            last_checkin    TEXT NOT NULL,
            created_at      TEXT NOT NULL,
            solana_tx       TEXT,
            package_hash    TEXT
        )
    """)
    conn.commit()
    conn.close()
    print("✅ Database initialized")


def create_package(
    package_id: str,
    package_data_json: str,
    recipient_name: str,
    recipient_email: str,
    checkin_days: int,
    solana_tx: str,
    package_hash: str
):
    """
    Save a new sealed package to the database.

    Args:
        package_id: Unique ID like "pkg_a3f8c1d2"
        package_data_json: The full financial data as a JSON string
        recipient_name: Who receives the package (e.g., "Sarah")
        recipient_email: Where to send the access link
        checkin_days: Days between required check-ins (default 30)
        solana_tx: Solana transaction signature
        package_hash: SHA-256 hash of the package data
    """
    now = datetime.utcnow().isoformat()
    conn = _get_connection()
    conn.execute(
        """
        INSERT INTO packages (id, package_data, recipient_name, recipient_email,
                              checkin_days, last_checkin, created_at, solana_tx, package_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (package_id, package_data_json, recipient_name, recipient_email,
         checkin_days, now, now, solana_tx, package_hash)
    )
    conn.commit()
    conn.close()
    print(f"✅ Package {package_id} saved to database")


def get_package(package_id: str) -> dict | None:
    """
    Retrieve a package by its ID.

    Returns:
        dict with all fields, or None if not found.
        package_data is returned as a parsed dict (not raw JSON string).
    """
    conn = _get_connection()
    row = conn.execute("SELECT * FROM packages WHERE id = ?", (package_id,)).fetchone()
    conn.close()

    if row is None:
        return None

    # Convert sqlite3.Row to a regular dict
    result = dict(row)

    # Parse the JSON string back into a dict so callers can use it directly
    result["package_data"] = json.loads(result["package_data"])

    return result


def update_checkin(package_id: str) -> bool:
    """
    Reset the dead man's switch timer.
    Updates last_checkin to the current time.

    Returns:
        True if the package was found and updated, False otherwise.
    """
    now = datetime.utcnow().isoformat()
    conn = _get_connection()
    cursor = conn.execute(
        "UPDATE packages SET last_checkin = ? WHERE id = ?",
        (now, package_id)
    )
    conn.commit()
    updated = cursor.rowcount > 0
    conn.close()

    if updated:
        print(f"✅ Check-in updated for {package_id}")
    else:
        print(f"❌ Package {package_id} not found")

    return updated


# Initialize the database when this module is imported
init_db()
