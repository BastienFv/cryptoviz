from datetime import datetime, timezone

def map_coingecko_item(x):
    # Transforme last_updated (ISO 8601 avec Z) → datetime sans timezone
    raw_ts = x.get("last_updated")

    # Exemple : "2025-11-14T10:33:04Z"
    if raw_ts:
        captured_at = datetime.fromisoformat(raw_ts.replace("Z", "+00:00")).replace(tzinfo=None)
    else:
        # fallback si jamais l'API ne renvoie pas de timestamp
        captured_at = datetime.now().replace(microsecond=0)

    return {
        "slug": x.get("id"),
        "symbol": x.get("symbol"),
        "name": x.get("name"),
        "captured_at": captured_at,
        "price_usd": x.get("current_price"),
        "market_cap_usd": x.get("market_cap"),
        "volume_24h_usd": x.get("total_volume"),
        "pct_change_24h": x.get("price_change_percentage_24h"),
        "pct_change_7d": x.get("price_change_percentage_7d_in_currency"),
        "supply_circulating": x.get("circulating_supply"),
        "supply_max": x.get("max_supply"),
    }
