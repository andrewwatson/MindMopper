package server

import (
	"embed"
	"io/fs"
	"net/http"
	"strings"
)

// SPAHandler serves the embedded React SPA. For any path that does not
// correspond to a file in the embedded FS, it falls back to index.html so
// client-side routing works (SPA fallback).
func SPAHandler(staticFS embed.FS) http.HandlerFunc {
	// Re-root the embedded FS at "web/dist" so paths are relative to the dist dir.
	sub, err := fs.Sub(staticFS, "web/dist")
	if err != nil {
		panic(err)
	}
	fileServer := http.FileServer(http.FS(sub))

	return func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/")

		// Root request: serve index.html via the file server.
		if path == "" {
			fileServer.ServeHTTP(w, r)
			return
		}

		// Try to open the requested asset — fall back to index.html only when
		// the path does not correspond to a real file (directories included).
		f, err := sub.Open(path)
		if err != nil {
			r2 := r.Clone(r.Context())
			r2.URL.Path = "/"
			fileServer.ServeHTTP(w, r2)
			return
		}
		stat, err := f.Stat()
		f.Close()
		if err != nil || stat.IsDir() {
			r2 := r.Clone(r.Context())
			r2.URL.Path = "/"
			fileServer.ServeHTTP(w, r2)
			return
		}
		fileServer.ServeHTTP(w, r)
	}
}
