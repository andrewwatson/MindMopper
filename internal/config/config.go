package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port          string
	DBPath        string
	RateLimitMaps int // map creations per hour per IP
	Env           string
}

func Load() Config {
	rateLimit := 10
	if v := os.Getenv("RATE_LIMIT_MAPS"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			rateLimit = n
		}
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "data.db"
	}
	env := os.Getenv("ENV")
	if env == "" {
		env = "development"
	}
	return Config{
		Port:          port,
		DBPath:        dbPath,
		RateLimitMaps: rateLimit,
		Env:           env,
	}
}
