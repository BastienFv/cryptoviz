import logging
import os

def get_logger():
    """
    Initialise et renvoie un logger unique.
    """
    level = os.getenv("LOG_LEVEL", "INFO").upper()
    log_to_file = os.getenv("LOG_TO_FILE", "false").lower() == "true"
    log_file = os.getenv("LOG_FILE_PATH", "logs/scraper.log")

    logger = logging.getLogger("scraper")

    if logger.handlers:
        # Déjà initialisé → renvoie le même
        return logger

    logger.setLevel(level)
    formatter = logging.Formatter("[%(asctime)s][%(levelname)s] %(message)s")

    if log_to_file:
        handler = logging.FileHandler(log_file)
    else:
        handler = logging.StreamHandler()

    handler.setFormatter(formatter)
    logger.addHandler(handler)

    return logger


# === Fonctions utilitaires attendues par le scraper ===

def log_info(msg: str):
    logger = get_logger()
    logger.info(msg)


def log_error(msg: str):
    logger = get_logger()
    logger.error(msg)
