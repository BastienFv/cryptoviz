# CryptoViz

Plateforme de visualisation et d'analyse de données crypto-monnaies en temps réel avec analyse de sentiment basée sur l'actualité.

**🌐 Site en ligne :** http://165.22.196.162/

## Vue d'ensemble

CryptoViz est un système distribué composé de trois microservices qui collectent, analysent et affichent des données sur les crypto-monnaies. Le projet combine des données de marché en temps réel avec une analyse de sentiment alimentée par l'actualité pour offrir une vision complète du marché crypto.

## Architecture du système

Le projet est divisé en trois parties principales :

```
┌─────────────────────┐
│   Frontend React    │ ← Interface utilisateur
└──────────┬──────────┘
           │ HTTP/SSE
           ▼
┌─────────────────────┐
│   Backend Go API    │ ← Serveur API REST
└──────────┬──────────┘
           │ SQL
           ▼
┌─────────────────────┐
│  MariaDB Database   │ ← Stockage centralisé
└─────────▲───────────┘
          │
┌─────────┴───────────────────────────┐
│   Scrapers Python (microservices)   │
│                                     │
│  scraper → RabbitMQ → worker        │
│  news_scraper → RabbitMQ → sentiment│
└─────────────────────────────────────┘
```

---

## 1. cryptoviz-backend

### Description
API REST développée en Go qui sert d'interface entre la base de données et le frontend. Elle expose des endpoints pour récupérer les données de marché et permet le streaming en temps réel via Server-Sent Events (SSE).

### Fonctionnalités
- Endpoints REST pour les données crypto, statistiques de marché, articles et analyses
- Streaming en temps réel (SSE) pour mise à jour automatique
- Support CORS pour connexion cross-origin
- Gestion de la pagination et des limites de requêtes

### Routes disponibles

**Endpoints classiques :**
- `GET /api/health` - Vérification de l'état du serveur
- `GET /api/crypto-data?limit=100&offset=0` - Données des crypto-monnaies
- `GET /api/market-stats?limit=100&offset=0` - Statistiques globales du marché
- `GET /api/articles?limit=100&offset=0` - Articles d'actualité
- `GET /api/sentiment-analysis?limit=100&offset=0` - Analyses de sentiment

**Endpoints streaming (SSE) :**
- `GET /api/stream/crypto-data` - Flux temps réel des données crypto (rafraîchi toutes les 5s)
- `GET /api/stream/all` - Flux temps réel de toutes les données (rafraîchi toutes les 3s)

### Stack technique
- **Langage :** Go
- **Router :** chi v5
- **Base de données :** sqlx avec driver MySQL
- **Middleware :** CORS
- **Port :** 8080 (par défaut)

### Structure
```
cryptoviz-backend/
├── api/main.go          # Point d'entrée
├── router/router.go     # Routes et handlers HTTP
├── services/services.go # Logique métier et requêtes DB
└── models/models.go     # Structures de données
```

---

## 2. cryptoviz-frontend

### Description
Application web monopage développée avec React 19 et Vite. Interface responsive qui affiche les données de marché sous forme de tableaux, graphiques et visualisations interactives.

### Fonctionnalités principales
- Dashboard avec données en temps réel (mise à jour automatique)
- Trois sections : Marché, Actualités, Sentiment
- Visualisations multiples :
  - Graphiques à bulles (taille = market cap, couleur = variation 24h)
  - Graphiques d'aires pour prix et volumes
  - Tableaux triables avec pagination
  - Top gainers/losers
  - Métriques de liquidité et rareté
- Internationalisation (français/anglais)
- Mode dark/light
- Interface responsive (mobile, tablet, desktop)

### Connexion temps réel
Le frontend utilise Server-Sent Events (SSE) pour recevoir les mises à jour du backend toutes les 3 secondes sans polling.

### Stack technique
- **Framework :** React 19
- **Build tool :** Vite
- **UI Library :** Material-UI (MUI)
- **Graphiques :** Recharts, D3.js
- **HTTP Client :** Axios
- **i18n :** react-i18next
- **Styling :** TailwindCSS 4

### Structure
```
cryptoviz-frontend/
├── src/
│   ├── App.jsx              # Composant principal
│   ├── components/          # Composants UI
│   ├── services/api.js      # Client API et SSE
│   └── i18n/                # Traductions
└── package.json
```

---

## 3. cryptoviz-scrap

### Description
Ensemble de microservices Python responsables de la collecte, du traitement et de l'analyse des données. Utilise RabbitMQ comme système de queue pour découpler les producteurs (scrapers) des consommateurs (workers).

### Architecture des microservices

Le système de scraping est composé de 4 processus indépendants :

#### A. Scraper principal (`scraper/`)

**Rôle :** Collecte des données de marché depuis CoinGecko

**Fonctionnement :**
1. Interroge l'API CoinGecko pour récupérer le top 10 des crypto-monnaies
2. Normalise les données (prix, volumes, market cap, supply, variations)
3. Publie les messages dans la queue RabbitMQ `crypto_queue`
4. Collecte également les statistiques globales du marché (market cap total, dominance BTC, Fear & Greed Index)

**Fichiers clés :**
- `api_client.py` - Requêtes vers CoinGecko API
- `parser.py` - Normalisation des données JSON
- `rabbitmq_producer.py` - Publication dans RabbitMQ
- `market_stats.py` - Collecte et stockage des stats globales
- `main.py` - Orchestration

#### B. Worker de base de données (`worker/`)

**Rôle :** Consommation des messages et insertion en base de données

**Fonctionnement :**
1. Consomme les messages de la queue `crypto_queue`
2. Insère ou met à jour les enregistrements dans les tables `cryptocurrencies` et `crypto_data`
3. Gère les upserts pour éviter les doublons
4. Acknowledge les messages après traitement

**Fichiers clés :**
- `consumer.py` - Consumer RabbitMQ
- `inserter.py` - Logique d'insertion en base
- `db.py` - Connexion et requêtes MariaDB
- `main.py` - Lancement du consumer

#### C. Scraper d'actualités (`news_scraper/`)

**Rôle :** Collecte des articles d'actualité crypto

**Fonctionnement :**
1. Interroge l'API CryptoPanic pour récupérer les derniers articles
2. Filtre les articles liés aux cryptos du TOP 10
3. Insère les articles dans la table `news_articles`
4. Crée les relations crypto ↔ article dans `news_article_currencies`
5. Publie les articles dans la queue `news_queue` pour analyse de sentiment

**Fichiers clés :**
- `cryptopanic_api.py` - Requêtes vers CryptoPanic API
- `parser.py` - Parsing et filtrage des articles
- `db.py` - Insertion des articles et relations
- `rabbitmq_producer.py` - Publication pour analyse
- `main.py` - Point d'entrée

#### D. Worker d'analyse de sentiment (`sentiment_worker/`)

**Rôle :** Analyse de sentiment basée sur l'IA

**Fonctionnement :**
1. Consomme les messages de la queue `news_queue`
2. Analyse le contenu de l'article avec un moteur d'IA
3. Génère :
   - Score de sentiment (-1 à +1)
   - Label (very_negative, negative, neutral, positive, very_positive)
   - Niveau de confiance
   - Résumé de l'article
   - Topics clés extraits
   - Prédiction d'impact (bullish/bearish/neutral)
4. Insère les résultats dans `sentiment_analysis`

**Fichiers clés :**
- `rabbitmq_consumer.py` - Consumer RabbitMQ
- `sentiment_engine.py` - Moteur d'analyse IA
- `db.py` - Stockage des analyses
- `main.py` - Lancement du worker

#### E. Gestion de la base de données (`db/`)

**Rôle :** Initialisation et structure de la base de données

**Tables créées :**
- `sources` - Sources de données (CoinGecko, CryptoPanic, etc.)
- `cryptocurrencies` - Référentiel des crypto-monnaies
- `crypto_data` - Données de marché historisées (prix, volumes, etc.)
- `market_stats` - Statistiques globales du marché par jour
- `news_articles` - Articles d'actualité
- `news_article_currencies` - Table de liaison articles ↔ cryptos
- `sentiment_analysis` - Résultats d'analyse de sentiment
- `sentiment_aggregates` - Agrégations de sentiment par crypto
- `scraper_log` - Logs d'exécution des scrapers

**Fichier principal :**
- `init_db.py` - Script de création des tables

---

## Flux de données

### 1. Collecte des données de marché

```
CoinGecko API
    ↓
scraper (Python)
    ↓
RabbitMQ (crypto_queue)
    ↓
worker (Python)
    ↓
MariaDB (crypto_data)
    ↓
Backend API (Go)
    ↓
Frontend (React)
```

### 2. Collecte et analyse des actualités

```
CryptoPanic API
    ↓
news_scraper (Python)
    ↓
MariaDB (news_articles) + RabbitMQ (news_queue)
    ↓
sentiment_worker (Python)
    ↓
MariaDB (sentiment_analysis)
    ↓
Backend API (Go)
    ↓
Frontend (React)
```

---

## Pourquoi RabbitMQ ?

RabbitMQ sert de système de queue de messages pour découpler les composants et garantir la fiabilité :

- **Découplage :** Les scrapers et workers peuvent fonctionner indépendamment
- **Résilience :** Si un worker tombe, les messages sont conservés dans la queue
- **Scalabilité :** Possibilité d'ajouter plusieurs workers en parallèle
- **Garantie de livraison :** Messages persistants avec acknowledgement

**Queues utilisées :**
- `crypto_queue` - Données de marché
- `news_queue` - Articles pour analyse de sentiment

---

## Dépendances principales

### Backend (Go)
- `github.com/go-chi/chi/v5` - Router HTTP
- `github.com/jmoiron/sqlx` - Extension SQL
- `github.com/go-sql-driver/mysql` - Driver MySQL
- `github.com/go-chi/cors` - Middleware CORS

### Frontend (React)
- `react@19.1.1`, `react-dom@19.1.1`
- `axios` - Client HTTP
- `@mui/material`, `@mui/icons-material` - Composants UI
- `recharts`, `d3` - Bibliothèques de graphiques
- `i18next`, `react-i18next` - Internationalisation
- `tailwindcss` - Framework CSS

### Scrapers (Python)
- `mariadb` - Connecteur MariaDB
- `requests` - Client HTTP
- `pika` - Client RabbitMQ
- `pandas` - Manipulation de données
- `python-dotenv` - Gestion des variables d'environnement

---

## Prérequis système

- MariaDB/MySQL (version 10.x ou supérieure)
- RabbitMQ (version 3.x ou supérieure)
- Go 1.20+
- Node.js 18+
- Python 3.9+

---

## Configuration

Chaque microservice nécessite un fichier `.env` avec les variables appropriées :

**Backend (.env) :**
```
DB_DSN=user:password@tcp(host:3306)/cryptoviz?parseTime=true
PORT=8080
```

**Scrapers (.env) :**
```
DB_USER=root
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cryptoviz
RABBITMQ_URL=amqp://user:password@localhost:5672/
RMQ_QUEUE=crypto_queue
NEWS_QUEUE=news_queue
```

---

## Démarrage du projet

1. Initialiser la base de données :
   ```bash
   cd cryptoviz-scrap
   python db/init_db.py
   ```

2. Lancer les scrapers :
   ```bash
   python scraper/main.py &
   python worker/main.py &
   python news_scraper/main.py &
   python sentiment_worker/main.py &
   ```

3. Lancer le backend :
   ```bash
   cd cryptoviz-backend
   go run api/main.go
   ```

4. Lancer le frontend :
   ```bash
   cd cryptoviz-frontend
   npm install
   npm run dev
   ```

L'application sera accessible sur `http://localhost:5173` (ou le port Vite par défaut).

---

## Architecture de déploiement VPS

Le projet est déployé sur un VPS DigitalOcean (Ubuntu) à l'adresse **165.22.196.162**.

### Infrastructure du serveur

```
┌────────────────────────────────────────────────────────────┐
│                    VPS Ubuntu (165.22.196.162)             │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  NGINX (Port 80)                                    │  │
│  │  - Sert le frontend statique (/root/Projects/frontend)│
│  │  - Reverse proxy vers backend API (/api → :8080)   │  │
│  └──────────────────┬──────────────────────────────────┘  │
│                     │                                      │
│  ┌─────────────────▼──────────────────────────────────┐  │
│  │  Backend Go (systemd service)                      │  │
│  │  - Port: 8080                                       │  │
│  │  - Binaire: /root/Projects/backend/cryptoviz-backend│ │
│  │  - Auto-restart avec systemd                       │  │
│  │  - Logs: /var/log/cryptoviz-backend.log           │  │
│  └──────────────────┬──────────────────────────────────┘  │
│                     │                                      │
│  ┌─────────────────▼──────────────────────────────────┐  │
│  │  MariaDB (service natif)                           │  │
│  │  - Port: 3306 (local)                              │  │
│  │  - Base: cryptoviz                                 │  │
│  │  - Service: mariadb.service                        │  │
│  └─────────────────▲──────────────────────────────────┘  │
│                    │                                       │
│  ┌─────────────────┴──────────────────────────────────┐  │
│  │  Docker Compose Stack (cryptoviz-scrap)            │  │
│  │  Network: cryptonet (bridge)                       │  │
│  │                                                     │  │
│  │  ┌────────────────────────────────────────────┐    │  │
│  │  │ MariaDB Container (cryptoviz_mariadb)     │    │  │
│  │  │ - Port: 3307:3306                         │    │  │
│  │  │ - Volume: mariadb_data                    │    │  │
│  │  │ - Healthcheck actif                       │    │  │
│  │  └────────────────────────────────────────────┘    │  │
│  │                                                     │  │
│  │  ┌────────────────────────────────────────────┐    │  │
│  │  │ RabbitMQ (cryptoviz_rabbitmq)             │    │  │
│  │  │ - Port: 5672 (AMQP), 15672 (Management)  │    │  │
│  │  │ - User: unundxql                          │    │  │
│  │  │ - Vhost: unundxql                         │    │  │
│  │  │ - Healthcheck actif                       │    │  │
│  │  └────────────────────────────────────────────┘    │  │
│  │                                                     │  │
│  │  ┌────────────────────────────────────────────┐    │  │
│  │  │ Scraper Cron (cryptoviz_scraper_cron)     │    │  │
│  │  │ - Tourne toutes les 5 minutes (300s)      │    │  │
│  │  │ - Status: UP                              │    │  │
│  │  │ - Collecte données CoinGecko              │    │  │
│  │  └────────────────────────────────────────────┘    │  │
│  │                                                     │  │
│  │  ┌────────────────────────────────────────────┐    │  │
│  │  │ Worker (cryptoviz_worker)                 │    │  │
│  │  │ - Status: UP                              │    │  │
│  │  │ - Consomme queue crypto_queue             │    │  │
│  │  │ - Insert dans MariaDB                     │    │  │
│  │  └────────────────────────────────────────────┘    │  │
│  │                                                     │  │
│  │  ┌────────────────────────────────────────────┐    │  │
│  │  │ News Scraper (cryptoviz_news_scraper)     │    │  │
│  │  │ - Tourne toutes les 15 minutes (900s)     │    │  │
│  │  │ - Status: EXITED (par design, cron-like)  │    │  │
│  │  │ - Collecte articles CryptoPanic           │    │  │
│  │  └────────────────────────────────────────────┘    │  │
│  │                                                     │  │
│  │  ┌────────────────────────────────────────────┐    │  │
│  │  │ Sentiment Worker (cryptoviz_sentiment_worker)│  │
│  │  │ - Status: EXITED (par design, cron-like)  │    │  │
│  │  │ - Consomme queue news_queue               │    │  │
│  │  │ - Analyse sentiment avec IA               │    │  │
│  │  └────────────────────────────────────────────┘    │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Services et ports actifs

| Service | Type | Port(s) | Status |
|---------|------|---------|--------|
| NGINX | systemd | 80 | ✅ Running |
| Backend Go | systemd | 8080 | ✅ Running |
| MariaDB (native) | systemd | 3306 | ✅ Running |
| MariaDB (Docker) | container | 3307→3306 | ✅ Running |
| RabbitMQ | container | 5672, 15672 | ✅ Running |
| Scraper Cron | container | - | ✅ Running |
| Worker | container | - | ✅ Running |
| News Scraper | container | - | ⏸️ Cron (every 15min) |
| Sentiment Worker | container | - | ⏸️ Cron (on demand) |

### Configuration systemd

**Backend Service** (`/etc/systemd/system/cryptoviz-backend.service`) :
```ini
[Unit]
Description=CryptoViz Backend API Service
After=network.target mysql.service
Wants=mysql.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/Projects/backend
ExecStart=/root/Projects/backend/cryptoviz-backend
Restart=always
RestartSec=5

StandardOutput=append:/var/log/cryptoviz-backend.log
StandardError=append:/var/log/cryptoviz-backend-error.log

NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

### Configuration NGINX

**Site configuration** (`/etc/nginx/sites-available/cryptoviz`) :
- **Frontend :** Sert les fichiers statiques depuis `/root/Projects/frontend`
- **Reverse proxy :** Toutes les requêtes `/api/*` sont redirigées vers `http://localhost:8080`
- **Compression gzip :** Activée pour les assets JS/CSS/JSON
- **Headers de sécurité :** X-Frame-Options, X-Content-Type-Options, X-XSS-Protection

### Docker Compose Stack

Le fichier `docker-compose.yml` orchestre 6 services :

1. **mariadb** - Base de données containerisée (port 3307)
2. **rabbitmq** - Message broker avec management UI
3. **scraper-cron** - Scraper périodique (toutes les 5 minutes)
4. **worker** - Consumer permanent de la queue crypto
5. **news_scraper** - Scraper d'articles (toutes les 15 minutes)
6. **sentiment_worker** - Analyseur de sentiment (on-demand)

**Network :** Tous les conteneurs communiquent via le réseau bridge `cryptonet`.

**Volumes :** Données MariaDB persistées dans le volume `mariadb_data`.

### Flux de données en production

```
Internet
   ↓
NGINX:80
   ├─→ Frontend (fichiers statiques)
   └─→ /api/* → Backend:8080
                    ↓
              MariaDB:3306
                    ↑
    ┌───────────────┴────────────────┐
    │                                │
Scraper (5min) → RabbitMQ → Worker (permanent)
News Scraper (15min) → RabbitMQ → Sentiment Worker
```

### Commandes de gestion

**Backend :**
```bash
sudo systemctl status cryptoviz-backend
sudo systemctl restart cryptoviz-backend
sudo journalctl -u cryptoviz-backend -f
```

**NGINX :**
```bash
sudo systemctl reload nginx
sudo nginx -t  # Test configuration
```

**Docker Stack :**
```bash
cd /root/Projects/scrap/cryptoviz-scrap
docker compose ps
docker compose logs -f worker
docker compose restart scraper-cron
```

**Base de données :**
```bash
mysql -u root -p cryptoviz
# ou via Docker
docker exec -it cryptoviz_mariadb mysql -u root -p
```

### Monitoring

- **Backend logs :** `/var/log/cryptoviz-backend.log`
- **NGINX logs :** `/var/log/nginx/access.log` et `/var/log/nginx/error.log`
- **Docker logs :** `docker logs <container_name>`
- **RabbitMQ Management :** http://165.22.196.162:15672

### Sécurité

- Pas de ports sensibles exposés publiquement (MariaDB, RabbitMQ uniquement en local)
- NGINX configuré avec headers de sécurité
- Backend isolé derrière reverse proxy
- Services systemd avec options de sécurité (NoNewPrivileges, PrivateTmp)
