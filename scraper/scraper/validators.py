def clamp_num(x, lo=None, hi=None):
    if x is None:
        return None
    try:
        v = float(x)
    except Exception:
        return None
    if lo is not None and v < lo:
        return None
    if hi is not None and v > hi:
        return None
    return v

def validate_item(item):
    name = (item.get("name") or "").strip()
    symbol = (item.get("symbol") or "").strip().upper()
    slug = (item.get("slug") or "").strip()
    if not name or not symbol or not slug:
        return None

    price = clamp_num(item.get("price_usd"), lo=0, hi=1e7)
    cap = clamp_num(item.get("market_cap_usd"), lo=0, hi=1e15)
    vol = clamp_num(item.get("volume_24h_usd"), lo=0, hi=1e15)
    pct24 = clamp_num(item.get("pct_change_24h"), lo=-1000, hi=1000)
    pct7 = clamp_num(item.get("pct_change_7d"), lo=-1000, hi=1000)
    sup_circ = clamp_num(item.get("supply_circulating"), lo=0, hi=1e15)
    sup_max = clamp_num(item.get("supply_max"), lo=0, hi=1e15)

    captured_at = item.get("captured_at")  

    return {
        "name": name,
        "symbol": symbol,
        "slug": slug,
        "captured_at": captured_at,
        "price_usd": price,
        "market_cap_usd": cap,
        "volume_24h_usd": vol,
        "pct_change_24h": pct24,
        "pct_change_7d": pct7,
        "supply_circulating": sup_circ,
        "supply_max": sup_max,
    }
