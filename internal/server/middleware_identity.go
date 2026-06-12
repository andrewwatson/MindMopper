package server

import (
	"context"
	"net/http"
	"regexp"

	"github.com/andrewwatson/mindmopper/internal/ctxkeys"
	"github.com/andrewwatson/mindmopper/internal/handlers"
)

// userEnsurer is the minimal interface required to auto-register users.
// Defined locally so the middleware does not import the store package directly.
type userEnsurer interface {
	EnsureUser(ctx context.Context, id string) error
}

var uuidRe = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)

// IdentityMiddleware extracts the X-User-Id header, validates it as a UUID,
// auto-registers the user, and stores the ID in the request context.
func IdentityMiddleware(repo userEnsurer) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userID := r.Header.Get("X-User-Id")
			if !uuidRe.MatchString(userID) {
				handlers.WriteError(w, "INVALID_IDENTITY", "X-User-Id must be a valid UUID", http.StatusUnauthorized)
				return
			}
			if err := repo.EnsureUser(r.Context(), userID); err != nil {
				handlers.WriteError(w, "INTERNAL", "failed to register user", http.StatusInternalServerError)
				return
			}
			ctx := context.WithValue(r.Context(), ctxkeys.UserID, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
