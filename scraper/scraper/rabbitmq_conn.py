import pika
import ssl
import os
from dotenv import load_dotenv

load_dotenv()

def get_rmq_connection():
    url = os.getenv("RABBITMQ_URL")  # ex: amqps://user:pass@host/vhost

    params = pika.URLParameters(url)
    params.ssl_options = pika.SSLOptions(ssl.create_default_context())

    return pika.BlockingConnection(params)
