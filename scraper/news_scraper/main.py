# news_scraper/main.py
from dotenv import load_dotenv
load_dotenv()

from cryptopanic_api import fetch_articles
from parser import parse_raw_article
from rabbitmq_producer import publish_news
from db import insert_article  # 🆕 Import DB
from logger import log_info, log_error

def main():
    log_info("Starting news scraper...")

    raw_articles = fetch_articles()
    log_info(f"Fetched {len(raw_articles)} raw articles")

    published_count = 0

    for raw in raw_articles:
        parsed = parse_raw_article(raw)

        if not parsed["cryptos"]:
            continue  # ne garde que les articles sur ton TOP10

        # 🔧 ORDRE IMPORTANT : D'abord insérer en DB
        article_id = insert_article(parsed)
        
        if article_id is None:
            log_error(f"Failed to insert article {parsed['external_id']}, skipping...")
            continue
        
        # 🔧 Ensuite publier dans RabbitMQ
        publish_news(parsed)
        published_count += 1

    log_info(f"Published {published_count} filtered news articles")

if __name__ == "__main__":
    main()