import os
import pika
import json
from logger import log_info, log_error

def get_connection():
    url = os.getenv("RABBITMQ_URL")
    return pika.BlockingConnection(pika.URLParameters(url))

def publish_news(article):
    """
    Publie un article (déjà filtré) dans la queue.
    """
    queue = os.getenv("NEWS_QUEUE", "news_queue")

    try:
        conn = get_connection()
        channel = conn.channel()
        channel.queue_declare(queue=queue, durable=True)

        channel.basic_publish(
            exchange="",
            routing_key=queue,
            body=json.dumps(article),
            properties=pika.BasicProperties(delivery_mode=2)
        )

        log_info(f"Published article {article['external_id']} to queue")

        conn.close()

    except Exception as e:
        log_error(f"RabbitMQ publish error: {e}")
