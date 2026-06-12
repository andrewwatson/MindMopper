package store

import (
	"context"
	"time"

	"github.com/andrewwatson/mindmopper/internal/models"
	"github.com/jmoiron/sqlx"
)

type NodesRepo struct{ db *sqlx.DB }

func NewNodesRepo(db *sqlx.DB) *NodesRepo { return &NodesRepo{db: db} }

func (r *NodesRepo) ListByMap(ctx context.Context, mapID string) ([]models.Node, error) {
	var nodes []models.Node
	err := r.db.SelectContext(ctx, &nodes,
		`SELECT id, map_id, parent_id, text, sort_order, created_at, updated_at
         FROM nodes WHERE map_id = ? ORDER BY sort_order ASC`, mapID)
	return nodes, err
}

// ReplaceTree atomically replaces all nodes for a map within a transaction.
func (r *NodesRepo) ReplaceTree(ctx context.Context, mapID string, nodes []models.Node) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, `DELETE FROM nodes WHERE map_id = ?`, mapID); err != nil {
		return err
	}

	now := time.Now().UTC()
	for _, n := range nodes {
		if _, err := tx.ExecContext(ctx,
			`INSERT INTO nodes (id, map_id, parent_id, text, sort_order, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
			n.ID, mapID, n.ParentID, n.Text, n.SortOrder, now, now); err != nil {
			return err
		}
	}

	return tx.Commit()
}
