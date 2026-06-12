package main

import (
	"embed"
	"log/slog"
	"net/http"
	"os"

	"github.com/andrewwatson/mindmopper/internal/config"
	"github.com/andrewwatson/mindmopper/internal/migrations"
	"github.com/andrewwatson/mindmopper/internal/server"
	"github.com/andrewwatson/mindmopper/internal/store"
)

//go:embed all:web/dist
var staticFS embed.FS

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	cfg := config.Load()

	db, err := store.NewDB(cfg.DBPath)
	if err != nil {
		slog.Error("failed to open database", "error", err)
		os.Exit(1)
	}

	if err := migrations.Up(store.RawDB(db)); err != nil {
		slog.Error("failed to run migrations", "error", err)
		os.Exit(1)
	}

	repos := &server.Repos{
		Maps:  store.NewMapsRepo(db),
		Nodes: store.NewNodesRepo(db),
		Share: store.NewShareRepo(db),
	}

	srv := server.New(cfg, repos, staticFS)

	slog.Info("starting server", "port", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, srv.Handler()); err != nil {
		slog.Error("server stopped", "error", err)
		os.Exit(1)
	}
}
