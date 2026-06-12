package handlers

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/andrewwatson/mindmopper/internal/ctxkeys"
	"github.com/andrewwatson/mindmopper/internal/models"
	"github.com/andrewwatson/mindmopper/internal/store"
)

// ShareHandler groups share-link endpoints (both authenticated and public).
type ShareHandler struct {
	Maps  *store.MapsRepo
	Nodes *store.NodesRepo
	Share *store.ShareRepo
}

// Create issues a new share token for a map the caller owns.
func (h *ShareHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := ctxkeys.GetUserID(r.Context())
	mapID := chi.URLParam(r, "id")

	if _, err := h.Maps.Get(r.Context(), mapID, userID); err != nil {
		WriteError(w, "NOT_FOUND", "map not found", http.StatusNotFound)
		return
	}
	link, err := h.Share.Create(r.Context(), mapID)
	if err != nil {
		WriteError(w, "INTERNAL", err.Error(), http.StatusInternalServerError)
		return
	}
	scheme := "http"
	if r.TLS != nil {
		scheme = "https"
	}
	WriteJSON(w, http.StatusCreated, map[string]string{
		"token": link.Token,
		"url":   fmt.Sprintf("%s://%s/s/%s", scheme, r.Host, link.Token),
	})
}

// Revoke invalidates all active share tokens for a map.
func (h *ShareHandler) Revoke(w http.ResponseWriter, r *http.Request) {
	userID := ctxkeys.GetUserID(r.Context())
	mapID := chi.URLParam(r, "id")

	if _, err := h.Maps.Get(r.Context(), mapID, userID); err != nil {
		WriteError(w, "NOT_FOUND", "map not found", http.StatusNotFound)
		return
	}
	if err := h.Share.RevokeAllForMap(r.Context(), mapID); err != nil {
		WriteError(w, "INTERNAL", err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// GetPublic returns the map+tree referenced by a non-revoked share token.
// No authentication is required.
func (h *ShareHandler) GetPublic(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	link, err := h.Share.GetByToken(r.Context(), token)
	if err != nil {
		WriteError(w, "NOT_FOUND", "shared map not found", http.StatusNotFound)
		return
	}
	m, err := h.Maps.GetByID(r.Context(), link.MapID)
	if err != nil {
		WriteError(w, "NOT_FOUND", "map not found", http.StatusNotFound)
		return
	}
	nodes, err := h.Nodes.ListByMap(r.Context(), link.MapID)
	if err != nil {
		WriteError(w, "INTERNAL", err.Error(), http.StatusInternalServerError)
		return
	}
	if nodes == nil {
		nodes = []models.Node{}
	}
	rootID := ""
	if m.RootNodeID != nil {
		rootID = *m.RootNodeID
	}
	WriteJSON(w, http.StatusOK, models.MapWithTree{Map: *m, RootID: rootID, Nodes: nodes})
}
