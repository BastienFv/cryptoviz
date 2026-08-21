UPSERT_CRYPTO = """
INSERT INTO cryptocurrencies (source_id, slug, symbol, name, first_seen_at, created_at, updated_at)
VALUES (%(source_id)s, %(slug)s, %(symbol)s, %(name)s, %(first_seen_at)s, NOW(), NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name), symbol=VALUES(symbol), updated_at=NOW();
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

INSERT_MARKET_STATS = """
INSERT INTO market_stats (
    source_id, captured_at, total_market_cap_usd, btc_dominance_pct, fear_greed, created_at
) VALUES (
    %(source_id)s, %(captured_at)s, %(total_market_cap_usd)s, %(btc_dominance_pct)s, %(fear_greed)s, NOW()
)
ON DUPLICATE KEY UPDATE
    total_market_cap_usd = VALUES(total_market_cap_usd),
    btc_dominance_pct   = VALUES(btc_dominance_pct),
    fear_greed          = VALUES(fear_greed);
"""


INSERT_SCRAPER_LOG_START = """
INSERT INTO scraper_log (source_id, started_at, status, items_found, items_inserted, errors, notes)
VALUES (%(source_id)s, %(started_at)s, 'running', 0, 0, 0, %(notes)s);
"""

UPDATE_SCRAPER_LOG_END = """
UPDATE scraper_log
SET finished_at=%(finished_at)s, status=%(status)s, items_found=%(items_found)s, items_inserted=%(items_inserted)s, errors=%(errors)s, notes=%(notes)s
WHERE id=%(id)s;
"""

SELECT_CRYPTO_ID = """
SELECT id FROM cryptocurrencies WHERE source_id=%(source_id)s AND slug=%(slug)s;
"""
