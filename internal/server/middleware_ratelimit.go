package server

import (
	"net/http"
	"time"

	"github.com/ulule/limiter/v3"
	"github.com/ulule/limiter/v3/drivers/middleware/stdlib"
	"github.com/ulule/limiter/v3/drivers/store/memory"
)

// MapCreationRateLimiter returns middleware that limits each client IP to
// maxPerHour map-creation requests per hour. The middleware uses an in-memory
// store keyed by client IP.
func MapCreationRateLimiter(maxPerHour int) func(http.Handler) http.Handler {
	rate := limiter.Rate{
		Period: time.Hour,
		Limit:  int64(maxPerHour),
	}
	memStore := memory.NewStore()
	instance := limiter.New(memStore, rate)
	mw := stdlib.NewMiddleware(instance)
	return func(next http.Handler) http.Handler {
		return mw.Handler(next)
	}
}
