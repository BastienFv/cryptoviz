from dotenv import load_dotenv
load_dotenv()


import os
import requests
from logger import log_info, log_error

API_BASE = "https://cryptopanic.com/api/developer/v2/posts/"

def fetch_articles():
    """
    Fetch raw news posts from CryptoPanic.
    """
    api_key = os.getenv("CRYPTOPANIC_API_KEY")

    if not api_key:
        raise Exception("Missing CRYPTOPANIC_API_KEY in environment")

    params = {
        "auth_token": api_key,
        "kind": "news",
        "filter": "news",
    }

    try:
        resp = requests.get(API_BASE, params=params, timeout=15)
        resp.raise_for_status()

        data = resp.json()
        return data.get("results", [])

    except Exception as e:
        log_error(f"CryptoPanic API error: {e}")
        return []
