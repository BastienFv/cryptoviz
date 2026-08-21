from datetime import datetime, timezone
from logger import log_info

# TOP CRYPTOS QUE TU SUIVS
TOP10_SLUGS = {
    "bitcoin",
    "ethereum",
    "tether",
    "ripple",
    "binancecoin",
    "solana",
    "usd-coin",
    "tron",
    "staked-ether",
    "dogecoin",
}

def extract_crypto_from_title(title: str):
    """
    Retourne une liste de slugs détectés dans le titre/description.
    """
    title_l = title.lower()

    matched = []
    for slug in TOP10_SLUGS:
        if slug in title_l or slug.replace("-", " ") in title_l:
            matched.append(slug)

    return matched


def parse_raw_article(a):
    """
    Transforme un article brut CryptoPanic en format DB-friendly.
    """
    slug_list = extract_crypto_from_title(a["title"])

    return {
        "external_id": str(a["id"]),
        "url": f"https://cryptopanic.com/news/{a['slug']}",
        "title": a["title"],
        "description": a.get("description"),
        "source": "cryptopanic",
        "domain": None,
        "published_at": a.get("published_at"),
        "votes_positive": 0,
        "votes_negative": 0,
        "cryptos": slug_list,
    }
