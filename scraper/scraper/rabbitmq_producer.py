import json
import os
import pika
from rabbitmq_conn import get_rmq_connection
from dotenv import load_dotenv

load_dotenv()

EXCHANGE = os.getenv("RMQ_EXCHANGE")
ROUTING_KEY = os.getenv("RMQ_ROUTING_KEY")

def publish_message(message: dict):
    conn = get_rmq_connection()
    channel = conn.channel()

    channel.basic_publish(
        exchange=EXCHANGE,
        routing_key=ROUTING_KEY,
        body=json.dumps(message, default=str),
        properties=pika.BasicProperties(
            content_type="application/json",
            delivery_mode=2  # persist message
        )
    )

    conn.close()
