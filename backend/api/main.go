package main

import "github.com/joho/godotenv"

import (
	"log"
	"net/http"
	"os"

	"github.com/jmoiron/sqlx"
	_ "github.com/go-sql-driver/mysql"

	"github.com/nikitakofman/cryptoviz-backend/router"
)

func main() {
	_ = godotenv.Load()

	dsn := getenv("DB_DSN", "")
	if dsn == "" {
		log.Fatal("DB_DSN manquant.")
	}
	port := getenv("PORT", "8080")

	db, err := sqlx.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	if err := db.Ping(); err != nil {
		log.Fatalf("ping db: %v", err)
	}
	defer db.Close()
	log.Println("✅ Connected to MariaDB")

	addr := ":" + port
	log.Printf("API listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, router.New(db)))
}

func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}