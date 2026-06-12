package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/andrewwatson/mindmopper/internal/ctxkeys"
	"github.com/andrewwatson/mindmopper/internal/models"
	"github.com/andrewwatson/mindmopper/internal/store"
	"github.com/andrewwatson/mindmopper/internal/tree"
)

// MapsHandler groups the HTTP endpoints related to maps.
type MapsHandler struct {
	Maps  *store.MapsRepo
	Nodes *store.NodesRepo
}

// List returns all maps owned by the authenticated user.
func (h *MapsHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := ctxkeys.GetUserID(r.Context())
	maps, err := h.Maps.List(r.Context(), userID)
	if err != nil {
		WriteError(w, "INTERNAL", err.Error(), http.StatusInternalServerError)
		return
	}
	if maps == nil {
		maps = []models.Map{}
	}
	WriteJSON(w, http.StatusOK, map[string]any{"maps": maps})
}

// Create creates a new map (with a single root node) for the authenticated user.
func (h *MapsHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := ctxkeys.GetUserID(r.Context())

	var body struct {
		Title string `json:"title"`
	}
	// A missing or empty body is acceptable; we default the title.
	_ = json.NewDecoder(r.Body).Decode(&body)

	title := body.Title
	if title == "" {
		title = "Untitled Map"
	}
	if len(title) > 100 {
		WriteError(w, "TITLE_TOO_LONG", "title must be 100 chars or less", http.StatusBadRequest)
		return
	}

	m, err := h.Maps.Create(r.Context(), userID, title)
	if err != nil {
		WriteError(w, "INTERNAL", err.Error(), http.StatusInternalServerError)
		return
	}

	// Seed the map with an initial root node so the client always has
	// something to render after creation.
	rootID := newUUID()
	rootNode := models.Node{
		ID:        rootID,
		MapID:     m.ID,
		Text:      m.Title,
		SortOrder: 0,
	}
	if err := h.Nodes.ReplaceTree(r.Context(), m.ID, []models.Node{rootNode}); err != nil {
		WriteError(w, "INTERNAL", err.Error(), http.StatusInternalServerError)
		return
	}
	if err := h.Maps.UpdateRootNode(r.Context(), m.ID, rootID); err != nil {
		WriteError(w, "INTERNAL", err.Error(), http.StatusInternalServerError)
		return
	}
	m.RootNodeID = &rootID

	WriteJSON(w, http.StatusCreated, m)
}

// Get returns a single map together with its node tree.
func (h *MapsHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID := ctxkeys.GetUserID(r.Context())
	id := chi.URLParam(r, "id")

	m, err := h.Maps.Get(r.Context(), id, userID)
	if err != nil {
		WriteError(w, "NOT_FOUND", "map not found", http.StatusNotFound)
		return
	}
	nodes, err := h.Nodes.ListByMap(r.Context(), id)
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

// Rename updates the title of an existing map.
func (h *MapsHandler) Rename(w http.ResponseWriter, r *http.Request) {
	userID := ctxkeys.GetUserID(r.Context())
	id := chi.URLParam(r, "id")

	var body struct {
		Title string `json:"title"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		WriteError(w, "INVALID_BODY", "invalid JSON", http.StatusBadRequest)
		return
	}
	if body.Title == "" {
		WriteError(w, "MISSING_TITLE", "title is required", http.StatusBadRequest)
		return
	}
	if len(body.Title) > 100 {
		WriteError(w, "TITLE_TOO_LONG", "title must be 100 chars or less", http.StatusBadRequest)
		return
	}

	// Verify the map exists and is owned by the user before mutating.
	if _, err := h.Maps.Get(r.Context(), id, userID); err != nil {
		WriteError(w, "NOT_FOUND", "map not found", http.StatusNotFound)
		return
	}
	if err := h.Maps.Rename(r.Context(), id, userID, body.Title); err != nil {
		WriteError(w, "INTERNAL", err.Error(), http.StatusInternalServerError)
		return
	}
	m, err := h.Maps.Get(r.Context(), id, userID)
	if err != nil {
		WriteError(w, "INTERNAL", err.Error(), http.StatusInternalServerError)
		return
	}
	WriteJSON(w, http.StatusOK, m)
}

// Delete removes a map and (via FK cascade) its nodes and share links.
func (h *MapsHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := ctxkeys.GetUserID(r.Context())
	id := chi.URLParam(r, "id")
	if err := h.Maps.Delete(r.Context(), id, userID); err != nil {
		WriteError(w, "INTERNAL", err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// SaveTree atomically replaces the entire node tree for a map.
func (h *MapsHandler) SaveTree(w http.ResponseWriter, r *http.Request) {
	userID := ctxkeys.GetUserID(r.Context())
	id := chi.URLParam(r, "id")

	// Verify ownership before touching nodes.
	if _, err := h.Maps.Get(r.Context(), id, userID); err != nil {
		WriteError(w, "NOT_FOUND", "map not found", http.StatusNotFound)
		return
	}

	var body models.TreeWrite
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		WriteError(w, "INVALID_BODY", "invalid JSON", http.StatusBadRequest)
		return
	}

	if err := tree.Validate(body.RootID, body.Nodes); err != nil {
		WriteError(w, "INVALID_TREE", err.Error(), http.StatusBadRequest)
		return
	}

	// Stamp every incoming node with the owning map ID so the client cannot
	// smuggle nodes across maps.
	for i := range body.Nodes {
		body.Nodes[i].MapID = id
	}

	if err := h.Nodes.ReplaceTree(r.Context(), id, body.Nodes); err != nil {
		WriteError(w, "INTERNAL", err.Error(), http.StatusInternalServerError)
		return
	}
	if err := h.Maps.UpdateRootNode(r.Context(), id, body.RootID); err != nil {
		WriteError(w, "INTERNAL", err.Error(), http.StatusInternalServerError)
		return
	}

	WriteJSON(w, http.StatusOK, map[string]any{"savedAt": nowRFC3339()})
}

// --- small helpers ---

func newUUID() string         { return uuid.New().String() }
func nowRFC3339() string      { return time.Now().UTC().Format(time.RFC3339) }
