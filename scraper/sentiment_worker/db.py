# sentiment_worker/db.py
import mariadb
import os
import json

def get_conn():
    try:
        conn = mariadb.connect(
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=int(os.getenv("DB_PORT")),
            database=os.getenv("DB_NAME"),
        )
        print("[DB] MariaDB connected")
        return conn
    except Exception as e:
        print(f"[DB ERROR] {e}")
        raise

def get_article_internal_id(external_id):
    """
    Récupère l'ID interne depuis news_articles à partir de external_id
    """
    conn = get_conn()
    cur = conn.cursor()
    
    sql = "SELECT id FROM news_articles WHERE external_id = ?"
    cur.execute(sql, (external_id,))
    result = cur.fetchone()
    
    cur.close()
    conn.close()
    
    if result:
        return result[0]
    else:
        raise ValueError(f"Article with external_id={external_id} not found in database")

def insert_sentiment(external_id, sentiment):
    """
    external_id: l'ID de CryptoPanic (ex: "27208118")
    sentiment = {
        "score": float,
        "label": string,
        "confidence": float,
        "summary": string,
        "topics": list,
        "impact": string,
        "reasoning": string
    }
    """
    # Récupérer l'ID interne
    try:
        article_id = get_article_internal_id(external_id)
    except ValueError as e:
        print(f"[DB ERROR] {e}")
        return False
    
    conn = get_conn()
    cur = conn.cursor()

    sql = """
        INSERT INTO sentiment_analysis (
            article_id,
            sentiment_score,
            sentiment_label,
            confidence,
            summary,
            key_topics,
            impact_prediction,
            reasoning
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            sentiment_score = VALUES(sentiment_score),
            sentiment_label = VALUES(sentiment_label),
            confidence = VALUES(confidence),
            summary = VALUES(summary),
            key_topics = VALUES(key_topics),
            impact_prediction = VALUES(impact_prediction),
            reasoning = VALUES(reasoning)
    """

    try:
        cur.execute(sql, (
            article_id,  # ID interne (BIGINT)
            sentiment["score"],
            sentiment["label"],
            sentiment["confidence"],
            sentiment["summary"],
            json.dumps(sentiment["topics"]),  # Convertir en JSON string
            sentiment["impact"],
            sentiment["reasoning"]
        ))

        conn.commit()
        print(f"[DB] Sentiment saved for article_id={article_id} (external_id={external_id})")
        return True
    except Exception as e:
        print(f"[DB ERROR] Failed to insert sentiment: {e}")
        conn.rollback()
        return False
    finally:
        cur.close()
        conn.close()