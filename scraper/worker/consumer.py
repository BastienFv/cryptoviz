import json
import pika
import os
from dotenv import load_dotenv

from worker.db import get_conn
from worker.inserter import get_or_create_crypto, insert_crypto_data

load_dotenv()

SOURCE_ID = 1  # CoinGecko

def start_consumer():
    print(f"[DEBUG] RABBITMQ_URL: {os.getenv('RABBITMQ_URL')}")
    print(f"[DEBUG] RMQ_QUEUE: {os.getenv('RMQ_QUEUE')}")
    
    amqp_url = os.getenv("RABBITMQ_URL")
    queue_name = os.getenv("RMQ_QUEUE")
    exchange_name = os.getenv("RMQ_EXCHANGE")
    routing_key = os.getenv("RMQ_ROUTING_KEY")

    try:
        params = pika.URLParameters(amqp_url)
        params.socket_timeout = 5
        connection = pika.BlockingConnection(params)
        print("[SUCCESS] Worker connecté à RabbitMQ!")
    except Exception as e:
        print(f"[ERROR] Impossible de se connecter à RabbitMQ: {e}")
        return

    channel = connection.channel()

    # Sécurité
    channel.exchange_declare(exchange=exchange_name, exchange_type="direct", durable=True)
    channel.queue_declare(queue=queue_name, durable=True)
    channel.queue_bind(queue=queue_name, exchange=exchange_name, routing_key=routing_key)

    print(f" [*] Waiting for messages from queue: {queue_name}")

    def callback(ch, method, properties, body):
        print(" [x] Message reçu !")

        try:
            data = json.loads(body.decode())

            conn = get_conn()
            cursor = conn.cursor()

            crypto_id = get_or_create_crypto(
                cursor,
                SOURCE_ID,
                data["slug"],
                data["symbol"],
                data["name"]
            )

            insert_crypto_data(cursor, crypto_id, SOURCE_ID, data)
            conn.commit()

            cursor.close()
            conn.close()

            print(f" [✔] {data['name']} insérée en BDD")

        except Exception as e:
            print(" [ERROR]", e)

        finally:
            ch.basic_ack(delivery_tag=method.delivery_tag)

    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue=queue_name, on_message_callback=callback)
    channel.start_consuming()
