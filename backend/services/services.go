package service

import (
	"github.com/jmoiron/sqlx"
	"github.com/nikitakofman/cryptoviz-backend/models"
)

type Service struct {
	db *sqlx.DB
}

func New(db *sqlx.DB) *Service {
	return &Service{db: db}
}

/* ---------- Crypto Data ---------- */

func (s *Service) ListCryptoData(limit, offset int) ([]models.CryptoDataDTO, error) {
	const q = `
SELECT
  cd.*,
  c.name   AS crypto_name,
  c.symbol AS crypto_symbol,
  s.name   AS source_name,
  s.base_url
FROM crypto_data cd
JOIN cryptocurrencies c ON c.id = cd.crypto_id
JOIN sources s          ON s.id = cd.source_id
ORDER BY cd.captured_at DESC
LIMIT ? OFFSET ?`

	var rows []models.CryptoDataRowDB
	if err := s.db.Select(&rows, q, limit, offset); err != nil {
		return nil, err
	}

	out := make([]models.CryptoDataDTO, len(rows))
	for i, r := range rows {
		out[i] = models.CryptoDataDTO{
			ID:                r.ID,
			CryptoID:          r.CryptoID,
			SourceID:          r.SourceID,
			CapturedAt:        r.CapturedAt,
			PriceUSD:          r.PriceUSD,
			PctChange24h:      r.PctChange24h,
			PctChange7d:       r.PctChange7d,
			MarketCapUSD:      r.MarketCapUSD,
			Volume24hUSD:      r.Volume24hUSD,
			SupplyCirculating: r.SupplyCirculating,
			SupplyMax:         r.SupplyMax,
			IngestedAt:        r.IngestedAt,
		}
		out[i].Crypto.Name = r.CryptoName
		out[i].Crypto.Symbol = r.CryptoSymbol
		out[i].Source.Name = r.SourceName
		out[i].Source.BaseURL = r.BaseURL
	}
	return out, nil
}

/* ---------- Market Stats ---------- */

func (s *Service) ListMarketStats(limit, offset int) ([]models.MarketStatsDTO, error) {
	const q = `
SELECT
  ms.*,
  s.name    AS source_name,
  s.base_url
FROM market_stats ms
JOIN sources s ON s.id = ms.source_id
ORDER BY ms.captured_at DESC
LIMIT ? OFFSET ?`

	var rows []models.MarketStatsRowDB
	if err := s.db.Select(&rows, q, limit, offset); err != nil {
		return nil, err
	}

	out := make([]models.MarketStatsDTO, len(rows))
	for i, r := range rows {
		out[i] = models.MarketStatsDTO{
			ID:                r.ID,
			SourceID:          r.SourceID,
			CapturedAt:        r.CapturedAt,
			TotalMarketCapUSD: r.TotalMarketCapUSD,
			BTCDominancePct:   r.BTCDominancePct,
			FearGreed:         r.FearGreed,
			CreatedAt:         r.CreatedAt,
		}
		out[i].Source.Name = r.SourceName
		out[i].Source.BaseURL = r.BaseURL
	}
	return out, nil
}

/* ---------- Articles ---------- */

func (s *Service) ListArticles(limit, offset int) ([]models.ArticlesDTO, error) {
	const q = `
SELECT
  *
FROM news_articles a
ORDER BY a.created_at DESC
LIMIT ? OFFSET ?`

	var rows []models.ArticlesRowDB
	if err := s.db.Select(&rows, q, limit, offset); err != nil {
		return nil, err
	}

	out := make([]models.ArticlesDTO, len(rows))
	for i, r := range rows {
		out[i] = models.ArticlesDTO(r)
	}
	return out, nil
}

/* ---------- Sentiment Analysis ---------- */

func (s *Service) ListSentimentAnalysis(limit, offset int) ([]models.SentimentAnalysisDTO, error) {
	const q = `
SELECT
  sa.*,
  na.url,
  na.title
FROM sentiment_analysis sa
JOIN news_articles na ON na.id = sa.article_id
ORDER BY sa.analyzed_at DESC
LIMIT ? OFFSET ?`

	var rows []models.SentimentAnalysisRowDB
	if err := s.db.Select(&rows, q, limit, offset); err != nil {
		return nil, err
	}

	out := make([]models.SentimentAnalysisDTO, len(rows))
	for i, r := range rows {
		out[i] = models.SentimentAnalysisDTO{
			ID:                	r.ID,
			ArticleID:         	r.ArticleID,
			SentimentScore:    	r.SentimentScore,
			SentimentLabel: 	r.SentimentLabel,
			Confidence:   		r.Confidence,
			Summary:         	r.Summary,
			KeyTopics:         	r.KeyTopics,
			ImpactPrediction: 	r.ImpactPrediction,
			Reasoning: 			r.Reasoning,
			AnalyzedAt: 		r.AnalyzedAt,
		}
		out[i].Article.Url = r.Url
		out[i].Article.Title = r.Title
	}
	return out, nil
}
