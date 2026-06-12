package store

import (
	"context"
	"time"

	"github.com/andrewwatson/mindmopper/internal/models"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type MapsRepo struct{ db *sqlx.DB }

func NewMapsRepo(db *sqlx.DB) *MapsRepo { return &MapsRepo{db: db} }

func (r *MapsRepo) EnsureUser(ctx context.Context, userID string) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT OR IGNORE INTO users (id) VALUES (?)`, userID)
	return err
}

func (r *MapsRepo) List(ctx context.Context, userID string) ([]models.Map, error) {
	var maps []models.Map
	err := r.db.SelectContext(ctx, &maps,
		`SELECT id, user_id, title, root_node_id, created_at, updated_at
         FROM maps WHERE user_id = ? ORDER BY updated_at DESC`, userID)
	return maps, err
}

func (r *MapsRepo) Create(ctx context.Context, userID, title string) (*models.Map, error) {
	id := uuid.New().String()
	now := time.Now().UTC()
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO maps (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
		id, userID, title, now, now)
	if err != nil {
		return nil, err
	}
	return &models.Map{ID: id, UserID: userID, Title: title, CreatedAt: now, UpdatedAt: now}, nil
}

func (r *MapsRepo) Get(ctx context.Context, id, userID string) (*models.Map, error) {
	var m models.Map
	err := r.db.GetContext(ctx, &m,
		`SELECT id, user_id, title, root_node_id, created_at, updated_at
         FROM maps WHERE id = ? AND user_id = ?`, id, userID)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *MapsRepo) GetByID(ctx context.Context, id string) (*models.Map, error) {
	var m models.Map
	err := r.db.GetContext(ctx, &m,
		`SELECT id, user_id, title, root_node_id, created_at, updated_at
         FROM maps WHERE id = ?`, id)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *MapsRepo) Rename(ctx context.Context, id, userID, title string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE maps SET title = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
		title, time.Now().UTC(), id, userID)
	return err
}

func (r *MapsRepo) UpdateRootNode(ctx context.Context, mapID, rootNodeID string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE maps SET root_node_id = ?, updated_at = ? WHERE id = ?`,
		rootNodeID, time.Now().UTC(), mapID)
	return err
}

func (r *MapsRepo) Delete(ctx context.Context, id, userID string) error {
	_, err := r.db.ExecContext(ctx,
		`DELETE FROM maps WHERE id = ? AND user_id = ?`, id, userID)
	return err
}

func (r *MapsRepo) TouchUpdatedAt(ctx context.Context, mapID string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE maps SET updated_at = ? WHERE id = ?`, time.Now().UTC(), mapID)
	return err
}
