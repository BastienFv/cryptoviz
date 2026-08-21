# news_scraper/db.py
import mariadb
import os
from datetime import datetime
from dotenv import load_dotenv
from logger import log_info, log_error

load_dotenv()

def get_conn():
    try:
        conn = mariadb.connect(
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST", "127.0.0.1"),
            port=int(os.getenv("DB_PORT", "3306")),
            database=os.getenv("DB_NAME", "cryptoviz"),
        )
        return conn
    except Exception as e:
        log_error(f"MariaDB connection failed: {e}")
        raise

def parse_datetime(date_string):
    """
    Convertit le format ISO 8601 (2025-11-19T17:46:35Z) 
    au format MariaDB (2025-11-19 17:46:35)
    """
    if not date_string:
        return None
    
    try:
        # Parser le format ISO 8601
        dt = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        # Retourner au format MariaDB
        return dt.strftime('%Y-%m-%d %H:%M:%S')
    except Exception as e:
        log_error(f"Failed to parse datetime '{date_string}': {e}")
        return None

def insert_article(article):
    """
    Insère un article dans news_articles.
    Retourne l'ID interne (auto-increment) de l'article.
    """
    conn = get_conn()
    cur = conn.cursor()
    
    # Convertir la date au bon format
    published_at = parse_datetime(article.get("published_at"))
    
    sql = """
    INSERT INTO news_articles (
        external_id,
        url,
        title,
        description,
        source,
        domain,
        published_at,
        votes_positive,
        votes_negative
    ) VALUES (?,?,?,?,?,?,?,?,?)
    ON DUPLICATE KEY UPDATE
        url = VALUES(url),
        title = VALUES(title),
        description = VALUES(description),
        published_at = VALUES(published_at),
        votes_positive = VALUES(votes_positive),
        votes_negative = VALUES(votes_negative)
    """
    
    try:
        cur.execute(sql, (
            article["external_id"],
            article["url"],
            article["title"],
            article["description"],
            article["source"],
            article["domain"],
            published_at,  # Format converti
            article["votes_positive"],
            article["votes_negative"]
        ))
        conn.commit()
        
        # Récupérer l'ID interne
        article_id = cur.lastrowid
        if article_id == 0:  # Si UPDATE, récupérer l'ID existant
            cur.execute("SELECT id FROM news_articles WHERE external_id = ?", (article["external_id"],))
            result = cur.fetchone()
            article_id = result[0] if result else None
        
        log_info(f"[DB] Inserted/Updated article {article['external_id']} (internal_id={article_id})")
        return article_id
        
    except Exception as e:
        log_error(f"Failed to insert article {article['external_id']}: {e}")
        conn.rollback()
        return None
    finally:
        cur.close()
        conn.close()