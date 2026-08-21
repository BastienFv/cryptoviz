package models

import (
	"time"
)

type CryptoDataRowDB struct {
	ID                int64      `db:"id"`
	CryptoID          int64      `db:"crypto_id"`
	SourceID          int64      `db:"source_id"`
	CapturedAt        *time.Time `db:"captured_at"`
	PriceUSD          *float64   `db:"price_usd"`
	PctChange24h      *float64   `db:"pct_change_24h"`
	PctChange7d       *float64   `db:"pct_change_7d"`
	MarketCapUSD      *float64   `db:"market_cap_usd"`
	Volume24hUSD      *float64   `db:"volume_24h_usd"`
	SupplyCirculating *float64   `db:"supply_circulating"`
	SupplyMax         *float64   `db:"supply_max"`
	IngestedAt        *time.Time `db:"ingested_at"`

	CryptoName   string `db:"crypto_name"`
	CryptoSymbol string `db:"crypto_symbol"`
	SourceName   string `db:"source_name"`
	BaseURL      string `db:"base_url"`
}

type MarketStatsRowDB struct {
	ID                int64      `db:"id"`
	SourceID          int64      `db:"source_id"`
	CapturedAt        *time.Time `db:"captured_at"`
	TotalMarketCapUSD *float64   `db:"total_market_cap_usd"`
	BTCDominancePct   *float64   `db:"btc_dominance_pct"`
	FearGreed         *int       `db:"fear_greed"`
	CreatedAt         *time.Time `db:"created_at"`
	
	SourceName string `db:"source_name"`
	BaseURL    string `db:"base_url"`
}

type ArticlesRowDB struct {
	ID	   		   	int64		`db:"id"`
	ExternalID	   	string		`db:"external_id"`
	Url		   	   	string		`db:"url"`
	Title		   	string		`db:"title"`
	Description		*string		`db:"description"`
	Source			string		`db:"source"`
	Domain 			*string		`db:"domain"`
	PublishedAt		*time.Time	`db:"published_at"`
	VotesPositive	*int64		`db:"votes_positive"`
	VotesNegative	*int64		`db:"votes_negative"` 
	CreatedAt      	*time.Time	`db:"created_at"`
}

type SentimentAnalysisRowDB struct {
	ID					int64		`db:"id"`
	ArticleID 			int64		`db:"article_id"`
	SentimentScore		float32		`db:"sentiment_score"`
	SentimentLabel		string		`db:"sentiment_label"`
	Confidence			float32		`db:"confidence"`
	Summary				string		`db:"summary"`
	KeyTopics			*string		`db:"key_topics"`
	ImpactPrediction	string		`db:"impact_prediction"`
	Reasoning			*string		`db:"reasoning"`
	AnalyzedAt			time.Time	`db:"analyzed_at"`
	
	Url					string		`db:"url"`
	Title				string		`db:"title"`
}

/* ====== DTO renvoyés en JSON ====== */

type CryptoDataDTO struct {
	ID                int64      `json:"id"`
	CryptoID          int64      `json:"crypto_id"`
	SourceID          int64      `json:"source_id"`
	CapturedAt        *time.Time `json:"captured_at,omitempty"`
	PriceUSD          *float64   `json:"price_usd,omitempty"`
	PctChange24h      *float64   `json:"pct_change_24h,omitempty"`
	PctChange7d       *float64   `json:"pct_change_7d,omitempty"`
	MarketCapUSD      *float64   `json:"market_cap_usd,omitempty"`
	Volume24hUSD      *float64   `json:"volume_24h_usd,omitempty"`
	SupplyCirculating *float64   `json:"supply_circulating,omitempty"`
	SupplyMax         *float64   `json:"supply_max,omitempty"`
	IngestedAt        *time.Time `json:"ingested_at,omitempty"`
	Crypto            struct {
		Name   string `json:"name"`
		Symbol string `json:"symbol"`
	} `json:"crypto"`
	Source struct {
		Name    string `json:"name"`
		BaseURL string `json:"base_url"`
	} `json:"source"`
}

type MarketStatsDTO struct {
	ID                int64      `json:"id"`
	SourceID          int64      `json:"source_id"`
	CapturedAt        *time.Time `json:"captured_at,omitempty"`
	TotalMarketCapUSD *float64   `json:"total_market_cap_usd,omitempty"`
	BTCDominancePct   *float64   `json:"btc_dominance_pct,omitempty"`
	FearGreed         *int       `json:"fear_greed,omitempty"`
	CreatedAt         *time.Time `json:"created_at,omitempty"`
	Source            struct {
		Name    string `json:"name"`
		BaseURL string `json:"base_url"`
	} `json:"source"`
}

type ArticlesDTO struct {
	ID	   		   	int64		`json:"id"`
	ExternalID	   	string		`json:"external_id"`
	Url		   	   	string		`json:"url"`
	Title		   	string		`json:"title"`
	Description		*string		`json:"description"`
	Source			string		`json:"source"`
	Domain 			*string		`json:"domain"`
	PublishedAt		*time.Time	`json:"published_at"`
	VotesPositive	*int64		`json:"votes_positive"`
	VotesNegative	*int64		`json:"votes_negative"` 
	CreatedAt      	*time.Time	`json:"created_at"`			 
}

type SentimentAnalysisDTO struct {
	ID					int64		`json:"id"`
	ArticleID 			int64		`json:"article_id"`
	SentimentScore		float32		`json:"sentiment_score"`
	SentimentLabel		string		`json:"sentiment_label"`
	Confidence			float32		`json:"confidence"`
	Summary				string		`json:"summary"`
	KeyTopics			*string		`json:"key_topics"`
	ImpactPrediction	string		`json:"impact_prediction"`
	Reasoning			*string		`json:"reasoning"`
	AnalyzedAt			time.Time	`json:"analyzed_at"`
	Article            struct {
		Url    	string 	`json:"url"`
		Title 	string 	`json:"title"`
	} `json:"article"`
}
