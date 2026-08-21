# worker/db.py
import mariadb
import os
from dotenv import load_dotenv

# ⚠️ NE PAS charger .env ici, il est déjà chargé dans main.py
# load_dotenv("/app/.env")  # Supprime cette ligne

def get_conn():
    try:
        conn = mariadb.connect(
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST", "127.0.0.1"),
            port=int(os.getenv("DB_PORT", "3306")),
            database=os.getenv("DB_NAME", "cryptoviz"),
        )
        print("[DEBUG] MariaDB connection successful")
        return conn
    except Exception as e:
        print(f"[ERROR] MariaDB connection failed: {e}")
        raise
