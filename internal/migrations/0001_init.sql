-- +goose NO TRANSACTION
-- +goose Up
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS users (
    id           TEXT PRIMARY KEY,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS maps (
    id             TEXT PRIMARY KEY,
    user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title          TEXT NOT NULL DEFAULT 'Untitled Map',
    root_node_id   TEXT,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_maps_user_id ON maps(user_id);
CREATE INDEX IF NOT EXISTS idx_maps_updated_at ON maps(updated_at);

CREATE TABLE IF NOT EXISTS nodes (
    id           TEXT PRIMARY KEY,
    map_id       TEXT NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    parent_id    TEXT REFERENCES nodes(id) ON DELETE CASCADE,
    text         TEXT NOT NULL DEFAULT '',
    sort_order   INTEGER NOT NULL DEFAULT 0,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_nodes_map_id ON nodes(map_id);
CREATE INDEX IF NOT EXISTS idx_nodes_parent_id ON nodes(parent_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_nodes_one_root_per_map ON nodes(map_id) WHERE parent_id IS NULL;

CREATE TABLE IF NOT EXISTS share_links (
    token        TEXT PRIMARY KEY,
    map_id       TEXT NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at   DATETIME
);
CREATE INDEX IF NOT EXISTS idx_share_links_map_id ON share_links(map_id);

-- +goose Down
DROP TABLE IF EXISTS share_links;
DROP TABLE IF EXISTS nodes;
DROP TABLE IF EXISTS maps;
DROP TABLE IF EXISTS users;
