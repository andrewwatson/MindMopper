# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

MindMopper is a free, open source mind mapping web app — an alternative to paid tools like MindMeister. Users can create and share mind maps (visual trees of related ideas and links) without accounts or subscriptions.

Module path: `github.com/andrewwatson/mindmopper`
Language: Go 1.25+

## Commands

### Backend (Go)

```bash
go build ./...           # compile backend
go test ./...            # run all Go tests
go test ./... -run TestName  # run a single test
go vet ./...             # lint
go run .                 # start backend on :8080
```

### Frontend (React / Vite)

```bash
cd web && npm run build  # production build → web/dist/
cd web && npm run dev    # Vite dev server on :5173 (proxies /api and /s to :8080)
cd web && npm test       # run Vitest tests
```

### Development (both together)

```bash
./scripts/dev.sh         # starts Go backend + Vite dev server concurrently
```

### Docker

```bash
docker compose up --build   # build and run in production mode
docker compose down         # stop
```

## Architecture

### Overview

Go chi API server at `/api/*`, SPA served at `/*`. Single binary embeds the compiled React app via `//go:embed all:web/dist` in `main.go`.

### Identity model

Anonymous ownership via a UUID stored in `localStorage`. Each request carries the UUID in the `X-User-Id` header. No accounts or sign-in required.

### Storage

SQLite at the path set by `DB_PATH` env var (default `/data/data.db` in Docker). Migrations managed by goose (`internal/migrations/`).

### Key packages

| Package | Purpose |
|---|---|
| `internal/config` | Load config from env vars (`PORT`, `DB_PATH`, `ENV`) |
| `internal/server` | Chi router setup, CORS, rate-limit middleware |
| `internal/handlers` | HTTP handlers for maps, nodes, shares |
| `internal/store` | SQLite repos (maps, nodes, shares) via sqlx |
| `internal/tree` | Mind-map tree validation logic |
| `internal/models` | Shared data types |
| `internal/migrations` | Goose SQL migrations |
| `internal/service` | Business-logic layer between handlers and store |
| `internal/ctxkeys` | Context key types to avoid collisions |

### API routes (chi)

- `GET /api/maps` — list maps owned by requesting user
- `POST /api/maps` — create map
- `GET /api/maps/{id}` — get map + nodes
- `PUT /api/maps/{id}` — update map metadata
- `DELETE /api/maps/{id}` — delete map
- `POST /api/maps/{id}/nodes` — add node
- `PUT /api/maps/{id}/nodes/{nodeId}` — update node
- `DELETE /api/maps/{id}/nodes/{nodeId}` — delete node
- `POST /api/maps/{id}/share` — create share link
- `GET /s/{token}` — resolve share link (served by backend, renders SPA)

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8080` | HTTP listen port |
| `DB_PATH` | (required) | Path to SQLite file |
| `ENV` | `development` | `production` enables stricter settings |

### Frontend (web/)

React 19 + TypeScript + Vite. Key libraries: React Flow (`@xyflow/react`), TanStack Query, Zustand, React Router v7, Tailwind CSS.

Vite dev proxy: `/api/*` and `/s/*` → `http://localhost:8080`.
