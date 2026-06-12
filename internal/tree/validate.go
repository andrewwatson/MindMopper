package tree

import (
	"errors"

	"github.com/andrewwatson/mindmopper/internal/models"
)

var (
	ErrNoRoot       = errors.New("tree has no root node")
	ErrMultipleRoot = errors.New("tree has multiple root nodes")
	ErrCycle        = errors.New("tree contains a cycle")
	ErrOrphan       = errors.New("tree contains orphan nodes")
	ErrRootMismatch = errors.New("declared rootId does not match actual root")
)

// Validate checks that nodes form a valid single-root tree with no cycles.
func Validate(rootID string, nodes []models.Node) error {
	if len(nodes) == 0 {
		return ErrNoRoot
	}

	byID := make(map[string]models.Node, len(nodes))
	for _, n := range nodes {
		byID[n.ID] = n
	}

	var roots []string
	for _, n := range nodes {
		if n.ParentID == nil {
			roots = append(roots, n.ID)
		}
	}

	if len(roots) == 0 {
		return ErrNoRoot
	}
	if len(roots) > 1 {
		return ErrMultipleRoot
	}
	if roots[0] != rootID {
		return ErrRootMismatch
	}

	// Check all non-root nodes have a parent in the set.
	for _, n := range nodes {
		if n.ParentID != nil {
			if _, ok := byID[*n.ParentID]; !ok {
				return ErrOrphan
			}
		}
	}

	// Cycle detection via DFS coloring.
	const (
		white = 0
		gray  = 1
		black = 2
	)
	color := make(map[string]int, len(nodes))

	// Build children map.
	children := make(map[string][]string, len(nodes))
	for _, n := range nodes {
		if n.ParentID != nil {
			children[*n.ParentID] = append(children[*n.ParentID], n.ID)
		}
	}

	var dfs func(id string) error
	dfs = func(id string) error {
		color[id] = gray
		for _, child := range children[id] {
			if color[child] == gray {
				return ErrCycle
			}
			if color[child] == white {
				if err := dfs(child); err != nil {
					return err
				}
			}
		}
		color[id] = black
		return nil
	}

	return dfs(rootID)
}
