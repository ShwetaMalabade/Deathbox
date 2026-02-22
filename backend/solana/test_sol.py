# e.g. from your routes.py, service.py, or any backend handler

from sol_main import record_transaction

# Initial registration
sig = record_transaction(
    kind="register",
    package_id="pkg_464edef4",
    hash_hex="b978f718f3a15ff4d45b2fcdbfa07c0cf9d6048389aaaffe14516e6bf7469180",
    solana_tx="71d1190c63338e34f7348519cd60b701bfde8f72547ea22b950979b64daf6992"
)

# Transfer event
sig = record_transaction(
    kind="transfer",
    package_id="pkg_464edef4",
    hash_hex="b978f718f3a15ff4d45b2fcdbfa07c0cf9d6048389aaaffe14516e6bf7469180",
    solana_tx="71d1190c63338e34f7348519cd60b701bfde8f72547ea22b950979b64daf6992",
    note="moved to warehouse B"   # optional
)
