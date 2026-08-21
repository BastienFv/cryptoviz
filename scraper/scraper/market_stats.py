import os
import requests
from datetime import datetime, timezone
from db.connection import get_conn
from db.queries import INSERT_MARKET_STATS

SOURCE_ID = 1

def _get(url, params=None, timeout=20):
    return requests.get(url, params=params or {}, timeout=timeout, headers={"User-Agent":"cryptoviz-scraper/0.1"})

def fetch_and_store_market_stats():
    base = os.getenv("SOURCE_BASE_URL", "https://api.coingecko.com")
    r = _get(f"{base}/api/v3/global")
    r.raise_for_status()
    j = r.json().get("data", {})

    total_cap = None
    dom_btc = None
    try:
        total_cap = float(j.get("total_market_cap", {}).get("usd"))
    except Exception:
        pass
    try:
        dom_btc = float(j.get("market_cap_percentage", {}).get("btc"))
    except Exception:
        pass

    fear_greed = None
    try:
        f = _get("https://api.alternative.me/fng/", params={"limit": 1})
        if f.ok:
            fd = f.json().get("data", [])
            if fd:
                fear_greed = int(fd[0].get("value"))
    except Exception:
        pass

    captured_date = datetime.now(timezone.utc).date().isoformat()

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(INSERT_MARKET_STATS, {
                "source_id": SOURCE_ID,
                "captured_at": captured_date,
                "total_market_cap_usd": total_cap,
                "btc_dominance_pct": dom_btc,
                "fear_greed": fear_greed
            })
        conn.commit()
    finally:
        conn.close()
