import json
import pika
import os
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    return pika.BlockingConnection(
        pika.URLParameters(os.getenv("RABBITMQ_URL"))
    )
