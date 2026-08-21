# sentiment_worker/main.py
import json
import os
from dotenv import load_dotenv
import pika
from sentiment_engine import analyze_sentiment
from db import insert_sentiment

load_dotenv()

QUEUE = os.getenv("NEWS_QUEUE")
RMQ_URL = os.getenv("RABBITMQ_URL")

print(f"[INFO] Starting sentiment worker — queue={QUEUE}")

def callback(ch, method, properties, body):
    try:
        raw_message = body.decode()
        article = json.loads(raw_message)
        
        # Récupérer external_id (pas 'id')
        external_id = article.get("external_id")
        
        if not external_id:
            print(f"[ERROR] Missing 'external_id' in article. Keys: {list(article.keys())}")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
            return
        
        print(f"[INFO] Processing article external_id={external_id}")
        
        # Analyser le sentiment
        sentiment = analyze_sentiment(article)
        print(f"[DEBUG] Sentiment: {sentiment['label']} (score={sentiment['score']})")
        
        # Insérer en DB (avec external_id)
        success = insert_sentiment(external_id, sentiment)
        
        if success:
            ch.basic_ack(delivery_tag=method.delivery_tag)
            print(f"[SUCCESS] ✅ Sentiment processed for article {external_id}")
        else:
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
            print(f"[ERROR] Failed to save sentiment for article {external_id}")
        
    except json.JSONDecodeError as e:
        print(f"[ERROR] Invalid JSON: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
        
    except Exception as e:
        print(f"[ERROR] Unexpected error: {type(e).__name__}: {e}")
        import traceback
        print(f"[ERROR] Traceback:\n{traceback.format_exc()}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

def main():
    print(f"[INFO] Connecting to RabbitMQ...")
    
    params = pika.URLParameters(RMQ_URL)
    params.socket_timeout = 10
    connection = pika.BlockingConnection(params)
    channel = connection.channel()
    channel.queue_declare(queue=QUEUE, durable=True)
    
    print(f"[INFO] Connected! Waiting for messages on queue '{QUEUE}'...")
    channel.basic_consume(queue=QUEUE, on_message_callback=callback)
    channel.start_consuming()

if __name__ == "__main__":
    main()