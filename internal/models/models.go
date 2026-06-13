package models

import "time"

type User struct {
	ID        string    `db:"id"         json:"id"`
	CreatedAt time.Time `db:"created_at" json:"createdAt"`
}

type Map struct {
	ID         string    `db:"id"           json:"id"`
	UserID     string    `db:"user_id"      json:"-"`
	Title      string    `db:"title"        json:"title"`
	RootNodeID *string   `db:"root_node_id" json:"rootNodeId,omitempty"`
	CreatedAt  time.Time `db:"created_at"   json:"createdAt"`
	UpdatedAt  time.Time `db:"updated_at"   json:"updatedAt"`
}

type Node struct {
	ID        string    `db:"id"         json:"id"`
	MapID     string    `db:"map_id"     json:"-"`
	ParentID  *string   `db:"parent_id"  json:"parentId"`
	Text      string    `db:"text"       json:"text"`
	SortOrder int       `db:"sort_order" json:"sortOrder"`
	URL       string    `db:"url"        json:"url"`
	CreatedAt time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt time.Time `db:"updated_at" json:"updatedAt"`
}

type MapWithTree struct {
	Map    Map    `json:"map"`
	RootID string `json:"rootId"`
	Nodes  []Node `json:"nodes"`
}

type ShareLink struct {
	Token     string     `db:"token"      json:"token"`
	MapID     string     `db:"map_id"     json:"-"`
	CreatedAt time.Time  `db:"created_at" json:"createdAt"`
	RevokedAt *time.Time `db:"revoked_at" json:"revokedAt,omitempty"`
}

type TreeWrite struct {
	RootID string `json:"rootId"`
	Nodes  []Node `json:"nodes"`
}
