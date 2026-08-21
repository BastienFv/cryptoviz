import mariadb
import os
from dotenv import load_dotenv

load_dotenv()

def get_conn():
    return mariadb.connect(
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", "3306")),
        database=os.getenv("DB_NAME", "cryptoviz"),
    )

def create_tables():
    tables = {

        
        "sources": """
        CREATE TABLE IF NOT EXISTS sources (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL UNIQUE,
            base_url VARCHAR(255) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """,

        
        "cryptocurrencies": """
        CREATE TABLE IF NOT EXISTS cryptocurrencies (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            source_id BIGINT UNSIGNED NOT NULL,
            slug VARCHAR(191) NOT NULL,
            symbol VARCHAR(32) NOT NULL,
            name VARCHAR(191) NOT NULL,
            first_seen_at TIMESTAMP NULL DEFAULT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_source_slug (source_id, slug),
            INDEX idx_symbol (symbol)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """,

        
        "crypto_data": """
        CREATE TABLE IF NOT EXISTS crypto_data (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            crypto_id BIGINT UNSIGNED NOT NULL,
            source_id BIGINT UNSIGNED NOT NULL,
            captured_at TIMESTAMP NOT NULL,
            price_usd DECIMAL(20,10) NULL,
            pct_change_24h DECIMAL(9,4) NULL,
            pct_change_7d DECIMAL(9,4) NULL,
            market_cap_usd DECIMAL(28,2) NULL,
            volume_24h_usd DECIMAL(28,2) NULL,
            supply_circulating DECIMAL(38,8) NULL,
            supply_max DECIMAL(38,8) NULL,
            ingested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_crypto_time (crypto_id, captured_at),
            INDEX idx_source_time (source_id, captured_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """,

        
        "market_stats": """
        CREATE TABLE IF NOT EXISTS market_stats (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            source_id BIGINT UNSIGNED NOT NULL,
            captured_at DATE NOT NULL,
            total_market_cap_usd DECIMAL(28,2) NULL,
            btc_dominance_pct DECIMAL(5,2) NULL,
            fear_greed TINYINT UNSIGNED NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_source_date (source_id, captured_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """,

        
        "scraper_log": """
        CREATE TABLE IF NOT EXISTS scraper_log (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            source_id BIGINT UNSIGNED NOT NULL,
            started_at TIMESTAMP NOT NULL,
            finished_at TIMESTAMP NULL DEFAULT NULL,
            status ENUM('running', 'success', 'failed', 'partial') NOT NULL DEFAULT 'running',
            items_found INT UNSIGNED DEFAULT 0,
            items_inserted INT UNSIGNED DEFAULT 0,
            errors INT UNSIGNED DEFAULT 0,
            notes TEXT NULL,
            PRIMARY KEY (id),
            INDEX idx_source_time (source_id, started_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """,

        
        "news_articles": """
        CREATE TABLE IF NOT EXISTS news_articles (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            external_id VARCHAR(255) NOT NULL,
            url TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NULL,
            source VARCHAR(100) NOT NULL,
            domain VARCHAR(100) NULL,
            published_at DATETIME NULL,
            votes_positive INT UNSIGNED DEFAULT 0,
            votes_negative INT UNSIGNED DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_news_external_id (external_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """,

        
        "news_article_currencies": """
        CREATE TABLE IF NOT EXISTS news_article_currencies (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            article_id BIGINT UNSIGNED NOT NULL,
            crypto_id BIGINT UNSIGNED NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY uq_article_crypto (article_id, crypto_id),
            CONSTRAINT fk_article_currency_article
                FOREIGN KEY (article_id) REFERENCES news_articles(id)
                ON DELETE CASCADE,
            CONSTRAINT fk_article_currency_crypto
                FOREIGN KEY (crypto_id) REFERENCES cryptocurrencies(id)
                ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """,

        
        "sentiment_analysis": """
        CREATE TABLE IF NOT EXISTS sentiment_analysis (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            article_id BIGINT UNSIGNED NOT NULL,
            sentiment_score DECIMAL(4,3) NOT NULL,
            sentiment_label ENUM(
                'very_negative', 'negative', 'neutral', 'positive', 'very_positive'
            ) NOT NULL,
            confidence DECIMAL(4,3) NOT NULL,
            summary TEXT NOT NULL,
            key_topics JSON NULL,
            impact_prediction ENUM('bullish','bearish','neutral') NOT NULL,
            reasoning TEXT NULL,
            analyzed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_sentiment_article (article_id),
            CONSTRAINT fk_sentiment_article
                FOREIGN KEY (article_id) REFERENCES news_articles(id)
                ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """,

       
        "sentiment_aggregates": """
        CREATE TABLE IF NOT EXISTS sentiment_aggregates (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            crypto_id BIGINT UNSIGNED NULL,
            timeframe ENUM('24h') NOT NULL,
            avg_sentiment DECIMAL(4,3) NULL,
            article_count INT UNSIGNED DEFAULT 0,
            positive_count INT UNSIGNED DEFAULT 0,
            negative_count INT UNSIGNED DEFAULT 0,
            sentiment_change DECIMAL(4,3) NULL,
            trending_topics JSON NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_crypto_timeframe (crypto_id, timeframe),
            CONSTRAINT fk_aggregate_crypto
                FOREIGN KEY (crypto_id) REFERENCES cryptocurrencies(id)
                ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """
    }

    # === EXECUTION DES REQUÊTES ===
    conn = get_conn()
    cur = conn.cursor()

    for name, sql in tables.items():
        print(f"Creating table: {name} ...", end="")
        cur.execute(sql)
        print(" OK")

    conn.commit()
    cur.close()
    conn.close()

    print("All tables created successfully.")

if __name__ == "__main__":
    create_tables()
