# sentiment_worker/sentiment_engine.py
import nltk

# Auto-download du lexique si absent
try:
    from nltk.sentiment.vader import SentimentIntensityAnalyzer
except LookupError:
    nltk.download("vader_lexicon")
    from nltk.sentiment.vader import SentimentIntensityAnalyzer


sia = SentimentIntensityAnalyzer()


def analyze_sentiment(article):
    """
    article = {
        "id": int,
        "title": str,
        "description": str or None
    }
    """

    text = (article["title"] or "") + " " + (article.get("description") or "")

    res = sia.polarity_scores(text)  # dict: {'neg','neu','pos','compound'}

    compound = res["compound"]

    # Label simple
    if compound >= 0.6:
        label = "very_positive"
    elif compound >= 0.2:
        label = "positive"
    elif compound > -0.2:
        label = "neutral"
    elif compound > -0.6:
        label = "negative"
    else:
        label = "very_negative"

    sentiment = {
        "score": round(compound, 3),
        "label": label,
        "confidence": 0.75,  # Valeur fixe (modèle basique)
        "summary": article["title"],
        "topics": [],  # On ajoutera plus tard
        "impact": "neutral",
        "reasoning": f"VADER score {compound}"
    }

    return sentiment
