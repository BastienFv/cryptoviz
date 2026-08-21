import sys
import os

# **Affiche les logs AVANT load_dotenv**
print("[DEBUG] Worker starting...")
print(f"[DEBUG] Current dir: {os.getcwd()}")
print(f"[DEBUG] .env exists: {os.path.exists('.env')}")
print(f"[DEBUG] /app/.env exists: {os.path.exists('/app/.env')}")

# **Liste les fichiers du dossier courant**
print(f"[DEBUG] Files in current dir: {os.listdir('.')}")

from dotenv import load_dotenv
load_dotenv()  

# **Affiche les variables d'env chargées**
print(f"[DEBUG] RABBITMQ_URL: {os.getenv('RABBITMQ_URL', 'NOT SET')}")
print(f"[DEBUG] RMQ_QUEUE: {os.getenv('RMQ_QUEUE', 'NOT SET')}")
print(f"[DEBUG] DB_HOST: {os.getenv('DB_HOST', 'NOT SET')}")

try:
    print("[DEBUG] Importing consumer...")
    from worker.consumer import start_consumer
    print("[DEBUG] Import successful!")
    
    print("Worker lancé ! En attente de messages...")
    start_consumer()
    
except Exception as e:
    import traceback
    print(f"[ERROR] {e}")
    traceback.print_exc()
    sys.exit(1)
