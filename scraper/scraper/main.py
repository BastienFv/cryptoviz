import time
from api_client import fetch_top_10
from rabbitmq_producer import publish_message
from logger import log_info, log_error
from parser import map_coingecko_item   # <-- IMPORT IMPORTANT
from market_stats import fetch_and_store_market_stats

def main():
    log_info("Starting scraper")

    try:
        cryptos = fetch_top_10()
        log_info(f"Fetched {len(cryptos)} cryptocurrencies")

        for crypto in cryptos:

            # Converti le crypto brut -> format JSON normalisé
            message = map_coingecko_item(crypto)

            publish_message(message)
            log_info(f"Published message for {message['slug']}")

            time.sleep(0.2)  # évite le spam CloudAMQP

        log_info("Scraper finished")
        fetch_and_store_market_stats()
        log_info("Market stats stored")

    except Exception as e:
        log_error(f"Scraper error: {e}")

if __name__ == "__main__":
    main()
