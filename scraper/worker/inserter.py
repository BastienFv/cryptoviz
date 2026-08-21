# worker/inserter.py

from worker.db import get_conn
import mariadb

SELECT_CRYPTO_ID = """
SELECT id FROM cryptocurrencies 
WHERE source_id = %(source_id)s AND slug = %(slug)s;
"""

UPSERT_CRYPTO = """
INSERT INTO cryptocurrencies (
    source_id, slug, symbol, name, first_seen_at, created_at, updated_at
) VALUES (
    %(source_id)s, %(slug)s, %(symbol)s, %(name)s, %(first_seen_at)s, NOW(), NOW()
)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    symbol = VALUES(symbol),
    updated_at = NOW();
"""

INSERT_CRYPTO_DATA = """
INSERT INTO crypto_data (
    crypto_id, source_id, captured_at,
    price_usd, pct_change_24h, pct_change_7d,
    market_cap_usd, volume_24h_usd,
    supply_circulating, supply_max, ingested_at
) VALUES (
    %(crypto_id)s, %(source_id)s, %(captured_at)s,
    %(price_usd)s, %(pct_change_24h)s, %(pct_change_7d)s,
    %(market_cap_usd)s, %(volume_24h_usd)s,
    %(supply_circulating)s, %(supply_max)s, NOW()
);
"""


def get_or_create_crypto(cursor, source_id, slug, symbol, name):
    """Retourne l'ID crypto. Si elle n'existe pas → UPSERT."""
    
    # 1. Chercher si la crypto existe
    cursor.execute(SELECT_CRYPTO_ID, {
        "source_id": source_id,
        "slug": slug
    })
    row = cursor.fetchone()

    if row:
        return row[0]  # crypto_id existant

    # 2. Sinon on fait l'UPSERT (creation)
    cursor.execute(UPSERT_CRYPTO, {
        "source_id": source_id,
        "slug": slug,
        "symbol": symbol,
        "name": name,
        "first_seen_at": None
    })

    return cursor.lastrowid  # id auto-incrémenté


def insert_crypto_data(cursor, crypto_id, source_id, data):
    """Insère les données crypto_data dans la BDD."""

    cursor.execute(INSERT_CRYPTO_DATA, {
        "crypto_id": crypto_id,
        "source_id": source_id,
        "captured_at": data["captured_at"],
        "price_usd": data["price_usd"],
        "pct_change_24h": data["pct_change_24h"],
        "pct_change_7d": data["pct_change_7d"],
        "market_cap_usd": data["market_cap_usd"],
        "volume_24h_usd": data["volume_24h_usd"],
        "supply_circulating": data["supply_circulating"],
        "supply_max": data["supply_max"]
    })
