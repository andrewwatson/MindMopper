// Package ctxkeys defines shared context keys used across packages.
// Living in its own leaf package prevents import cycles between
// server (which writes the values) and handlers (which read them).
package ctxkeys

import "context"

// key is an unexported type to prevent context-key collisions.
type key string

// UserID is the context key that stores the authenticated user's UUID.
const UserID key = "userID"

// GetUserID returns the user ID stored in ctx, or "" if absent.
func GetUserID(ctx context.Context) string {
	id, _ := ctx.Value(UserID).(string)
	return id
}
