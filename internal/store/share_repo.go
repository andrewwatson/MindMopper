package store

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"time"

	"github.com/andrewwatson/mindmopper/internal/models"
	"github.com/jmoiron/sqlx"
)

type ShareRepo struct{ db *sqlx.DB }

func NewShareRepo(db *sqlx.DB) *ShareRepo { return &ShareRepo{db: db} }

func generateToken() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func (r *ShareRepo) Create(ctx context.Context, mapID string) (*models.ShareLink, error) {
	token, err := generateToken()
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	_, err = r.db.ExecContext(ctx,
		`INSERT INTO share_links (token, map_id, created_at) VALUES (?, ?, ?)`,
		token, mapID, now)
	if err != nil {
		return nil, err
	}
	return &models.ShareLink{Token: token, MapID: mapID, CreatedAt: now}, nil
}

func (r *ShareRepo) GetByToken(ctx context.Context, token string) (*models.ShareLink, error) {
	var s models.ShareLink
	err := r.db.GetContext(ctx, &s,
		`SELECT token, map_id, created_at, revoked_at FROM share_links
         WHERE token = ? AND revoked_at IS NULL`, token)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *ShareRepo) RevokeAllForMap(ctx context.Context, mapID string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE share_links SET revoked_at = ? WHERE map_id = ? AND revoked_at IS NULL`,
		time.Now().UTC(), mapID)
	return err
}
