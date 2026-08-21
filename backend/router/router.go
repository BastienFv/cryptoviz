package router

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/jmoiron/sqlx"

	"github.com/nikitakofman/cryptoviz-backend/services"
)

type Router struct {
	svc *service.Service
}

func New(db *sqlx.DB) http.Handler {
	rt := &Router{svc: service.New(db)}

	r := chi.NewRouter()
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Get("/api/health", rt.health)
	r.Get("/api/crypto-data", rt.listCryptoData)
	r.Get("/api/market-stats", rt.listMarketStats)
	r.Get("/api/articles", rt.listArticles)
	r.Get("/api/sentiment-analysis", rt.listSentimentAnalysis)

	// SSE Streaming endpoints
	r.Get("/api/stream/crypto-data", rt.streamCryptoData)
	r.Get("/api/stream/all", rt.streamAll)

	return r
}

/* ---------- Handlers ---------- */

func (rt *Router) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"status": "ok"})
}

func (rt *Router) listCryptoData(w http.ResponseWriter, r *http.Request) {
	limit := parseInt(r, "limit", 100, 1, 1000)
	offset := parseInt(r, "offset", 0, 0, 1_000_000)

	items, err := rt.svc.ListCryptoData(limit, offset)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"count": len(items),
		"items": items,
	})
}

func (rt *Router) listMarketStats(w http.ResponseWriter, r *http.Request) {
	limit := parseInt(r, "limit", 100, 1, 1000)
	offset := parseInt(r, "offset", 0, 0, 1_000_000)

	items, err := rt.svc.ListMarketStats(limit, offset)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"count": len(items),
		"items": items,
	})
}

func (rt *Router) listArticles(w http.ResponseWriter, r *http.Request) {
	limit := parseInt(r, "limit", 100, 1, 1000)
	offset := parseInt(r, "offset", 0, 0, 1_000_000)

	items, err := rt.svc.ListArticles(limit, offset)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"count": len(items),
		"items": items,
	})
}

func (rt *Router) listSentimentAnalysis(w http.ResponseWriter, r *http.Request) {
	limit := parseInt(r, "limit", 100, 1, 1000)
	offset := parseInt(r, "offset", 0, 0, 1_000_000)

	items, err := rt.svc.ListSentimentAnalysis(limit, offset)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"count": len(items),
		"items": items,
	})
}

func (rt *Router) streamCryptoData(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	limit := parseInt(r, "limit", 50, 1, 1000)
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	ctx := r.Context()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			items, err := rt.svc.ListCryptoData(limit, 0)
			if err != nil {
				fmt.Fprintf(w, "event: error\ndata: {\"error\": \"%s\"}\n\n", err.Error())
				flusher.Flush()
				continue
			}

			data, err := json.Marshal(map[string]any{
				"count": len(items),
				"items": items,
				"timestamp": time.Now().Unix(),
			})
			if err != nil {
				fmt.Fprintf(w, "event: error\ndata: {\"error\": \"%s\"}\n\n", err.Error())
				flusher.Flush()
				continue
			}

			fmt.Fprintf(w, "data: %s\n\n", data)
			flusher.Flush()
		}
	}
}

func (rt *Router) streamAll(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	ctx := r.Context()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			cryptoData, err := rt.svc.ListCryptoData(100, 0)
			if err != nil {
				fmt.Fprintf(w, "event: error\ndata: {\"error\": \"crypto: %s\"}\n\n", err.Error())
				flusher.Flush()
				continue
			}

			marketStats, err := rt.svc.ListMarketStats(10, 0)
			if err != nil {
				fmt.Fprintf(w, "event: error\ndata: {\"error\": \"market: %s\"}\n\n", err.Error())
				flusher.Flush()
				continue
			}

			articles, err := rt.svc.ListArticles(20, 0)
			if err != nil {
				fmt.Fprintf(w, "event: error\ndata: {\"error\": \"articles: %s\"}\n\n", err.Error())
				flusher.Flush()
				continue
			}

			sentimentAnalysis, err := rt.svc.ListSentimentAnalysis(20, 0)
			if err != nil {
				fmt.Fprintf(w, "event: error\ndata: {\"error\": \"sentiment: %s\"}\n\n", err.Error())
				flusher.Flush()
				continue
			}

			payload := map[string]any{
				"cryptoData":         cryptoData,
				"marketStats":        marketStats,
				"articles":           articles,
				"sentimentAnalysis":  sentimentAnalysis,
				"timestamp":          time.Now().Unix(),
			}

			data, err := json.Marshal(payload)
			if err != nil {
				fmt.Fprintf(w, "event: error\ndata: {\"error\": \"marshal: %s\"}\n\n", err.Error())
				flusher.Flush()
				continue
			}

			fmt.Fprintf(w, "data: %s\n\n", data)
			flusher.Flush()
		}
	}
}

/* ---------- Helpers HTTP ---------- */

func parseInt(r *http.Request, key string, def, min, max int) int {
	v := r.URL.Query().Get(key)
	if v == "" {
		return def
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return def
	}
	if n < min {
		return min
	}
	if n > max {
		return max
	}
	return n
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

func writeErr(w http.ResponseWriter, code int, err error) {
	writeJSON(w, code, map[string]any{"error": err.Error()})
}
