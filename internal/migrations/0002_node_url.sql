-- +goose Up
ALTER TABLE nodes ADD COLUMN url TEXT NOT NULL DEFAULT '';

-- +goose Down
-- SQLite does not support DROP COLUMN before 3.35; leave as no-op
