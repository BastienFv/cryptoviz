import os
import time
import random
import requests

# === ENV VARS ===
BASE = os.getenv("SOURCE_BASE_URL", "https://api.coingecko.com")
VS = os.getenv("FETCH_VS_CURRENCY", "usd")
TIMEOUT = int(os.getenv("REQUEST_TIMEOUT_SEC", "20"))
QPS = float(os.getenv("RATE_LIMIT_QPS", "3"))
RETRY_MAX = int(os.getenv("RETRY_MAX", "3"))
BACKOFF_MS = int(os.getenv("RETRY_BACKOFF_BASE_MS", "500"))
JITTER_MS = int(os.getenv("RETRY_BACKOFF_JITTER_MS", "250"))
PRICE_CHANGE = os.getenv("FETCH_PRICE_CHANGE_WINDOWS", "24h,7d")


# ========= Rate limit helper =========
def _sleep_rate_limit():
    if QPS > 0:
        time.sleep(1.0 / QPS)


# ========= OLD function (used for large pagination, we keep it) =========
def fetch_markets_page(page: int, per_page: int = 250):
    url = f"{BASE}/api/v3/coins/markets"
    params = {
        "vs_currency": VS,
        "order": "market_cap_desc",
        "per_page": per_page,
        "page": page,
        "sparkline": "false",
        "price_change_percentage": PRICE_CHANGE
    }

    attempt = 0
    while True:
        _sleep_rate_limit()
        try:
            r = requests.get(url, params=params, timeout=TIMEOUT,
                             headers={"User-Agent": "cryptoviz-scraper/0.1"})
            r.raise_for_status()
            return r.json()

        except Exception:
            attempt += 1
            if attempt > RETRY_MAX:
                return None

            delay = (BACKOFF_MS + random.randint(0, JITTER_MS)) / 1000
            time.sleep(delay)


# ========= NEW FUNCTION ==========  
#     Top 10 ONLY (for RabbitMQ producer)
# ==================================
def fetch_top_10():
    url = f"{BASE}/api/v3/coins/markets"
    params = {
        "vs_currency": VS,
        "order": "market_cap_desc",
        "per_page": 10,
        "page": 1,
        "sparkline": "false",
        "price_change_percentage": PRICE_CHANGE,
    }

    attempt = 0
    while True:
        _sleep_rate_limit()
        try:
            r = requests.get(url, params=params, timeout=TIMEOUT,
                             headers={"User-Agent": "cryptoviz-scraper/0.1"})
            r.raise_for_status()
            return r.json()

        except Exception:
            attempt += 1
            if attempt > RETRY_MAX:
                raise RuntimeError("FAILED to fetch top 10 cryptos from CoinGecko")

            delay = (BACKOFF_MS + random.randint(0, JITTER_MS)) / 1000
            time.sleep(delay)
