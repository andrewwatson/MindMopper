export type UUID = string

export interface MapSummary {
  id: UUID
  title: string
  rootNodeId?: UUID
  createdAt: string
  updatedAt: string
}

export interface MindNode {
  id: UUID
  parentId: UUID | null
  text: string
  sortOrder: number
  url: string
  createdAt: string
  updatedAt: string
}

export interface MapWithTree {
  map: MapSummary
  rootId: UUID
  nodes: MindNode[]
}

export interface ShareLink {
  token: string
  url: string
}

export interface ApiError {
  error: { code: string; message: string }
}
