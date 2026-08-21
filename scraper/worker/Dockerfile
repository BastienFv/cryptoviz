FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends libmariadb-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/

RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

# Force Python à ne pas buffer les logs
ENV PYTHONUNBUFFERED=1

CMD ["python", "-m", "worker.main"]