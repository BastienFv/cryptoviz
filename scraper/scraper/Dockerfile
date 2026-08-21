FROM python:3.12-slim

WORKDIR /app

# Install MariaDB client deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    libmariadb-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy global requirements (root of project)
COPY requirements.txt /app/

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the WHOLE project
COPY . /app/

# Create logs folder
RUN mkdir -p /app/logs

ENV PYTHONPATH=/app

# Launch the CORRECT scraper entrypoint
CMD ["python", "-m", "scraper.main"]
