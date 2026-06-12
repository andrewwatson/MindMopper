package server

import (
	"embed"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/andrewwatson/mindmopper/internal/config"
	"github.com/andrewwatson/mindmopper/internal/handlers"
	"github.com/andrewwatson/mindmopper/internal/store"
)

// Repos bundles all repository dependencies for handlers.
// Defined here (not in store) to avoid import cycles.
type Repos struct {
	Maps  *store.MapsRepo
	Nodes *store.NodesRepo
	Share *store.ShareRepo
}

// Server wraps the configured chi router.
type Server struct {
	router *chi.Mux
	cfg    config.Config
	repos  *Repos
	static embed.FS
}

// New constructs the HTTP server with all routes and middleware wired.
func New(cfg config.Config, repos *Repos, staticFS embed.FS) *Server {
	r := chi.NewRouter()

	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Content-Type", "X-User-Id"},
	}))

	r.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte("ok"))
	})

	mapsH := &handlers.MapsHandler{Maps: repos.Maps, Nodes: repos.Nodes}
	shareH := &handlers.ShareHandler{Maps: repos.Maps, Nodes: repos.Nodes, Share: repos.Share}

	// Build the rate limiter middleware once so the in-memory store is
	// shared across requests.
	createLimiter := MapCreationRateLimiter(cfg.RateLimitMaps)

	// Public share endpoint must be registered OUTSIDE the authenticated
	// /api group so it can be reached without an X-User-Id header.
	r.Get("/api/shared/{token}", shareH.GetPublic)

	// Authenticated API routes.
	r.Route("/api", func(r chi.Router) {
		r.Use(IdentityMiddleware(repos.Maps))

		r.Get("/maps", mapsH.List)
		// Apply the per-IP rate limiter only to map creation.
		r.With(createLimiter).Post("/maps", mapsH.Create)
		r.Get("/maps/{id}", mapsH.Get)
		r.Patch("/maps/{id}", mapsH.Rename)
		r.Delete("/maps/{id}", mapsH.Delete)
		r.Put("/maps/{id}/tree", mapsH.SaveTree)

		r.Post("/maps/{id}/share", shareH.Create)
		r.Delete("/maps/{id}/share", shareH.Revoke)
	})

	// SPA fallback: any non-API path serves the embedded React app.
	r.Get("/*", SPAHandler(staticFS))

	return &Server{router: r, cfg: cfg, repos: repos, static: staticFS}
}

// Handler returns the underlying http.Handler suitable for http.ListenAndServe.
func (s *Server) Handler() http.Handler { return s.router }
