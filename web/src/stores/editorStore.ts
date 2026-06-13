import { create } from 'zustand'
import type { MindNode } from '../types/api'

interface EditorState {
  nodes: MindNode[]
  selectedId: string | null
  dirty: boolean
  saving: 'idle' | 'saving' | 'saved' | 'error'
  editingId: string | null

  setNodes: (nodes: MindNode[]) => void
  setSelectedId: (id: string | null) => void
  setDirty: (dirty: boolean) => void
  setSaving: (status: 'idle' | 'saving' | 'saved' | 'error') => void
  setEditingId: (id: string | null) => void

  // Tree mutations
  addChild: (parentId: string) => string  // returns new node id
  addSibling: (siblingId: string) => string  // returns new node id
  deleteNode: (id: string) => void
  updateNodeText: (id: string, text: string) => void
  updateNodeUrl: (id: string, url: string) => void
  getRootId: () => string | null
}

function generateId(): string {
  return crypto.randomUUID()
}

export const useEditorStore = create<EditorState>((set, get) => ({
  nodes: [],
  selectedId: null,
  dirty: false,
  saving: 'idle',
  editingId: null,

  setNodes: (nodes) => set({ nodes }),
  setSelectedId: (id) => set({ selectedId: id }),
  setDirty: (dirty) => set({ dirty }),
  setSaving: (saving) => set({ saving }),
  setEditingId: (id) => set({ editingId: id }),

  getRootId: () => {
    const root = get().nodes.find(n => n.parentId === null)
    return root?.id ?? null
  },

  addChild: (parentId) => {
    const newId = generateId()
    const siblings = get().nodes.filter(n => n.parentId === parentId)
    const maxOrder = siblings.reduce((m, n) => Math.max(m, n.sortOrder), -1)
    const newNode: MindNode = {
      id: newId,
      parentId,
      text: '',
      sortOrder: maxOrder + 1,
      url: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set(s => ({ nodes: [...s.nodes, newNode], dirty: true, selectedId: newId, editingId: newId }))
    return newId
  },

  addSibling: (siblingId) => {
    const nodes = get().nodes
    const sibling = nodes.find(n => n.id === siblingId)
    if (!sibling || sibling.parentId === null) return siblingId // can't add sibling to root
    const newId = generateId()
    const newNode: MindNode = {
      id: newId,
      parentId: sibling.parentId,
      text: '',
      sortOrder: sibling.sortOrder + 1,
      url: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    // Renumber siblings after insertion point
    const updated = nodes.map(n =>
      n.parentId === sibling.parentId && n.sortOrder > sibling.sortOrder
        ? { ...n, sortOrder: n.sortOrder + 1 }
        : n
    )
    set({ nodes: [...updated, newNode], dirty: true, selectedId: newId, editingId: newId })
    return newId
  },

  deleteNode: (id) => {
    const nodes = get().nodes
    const node = nodes.find(n => n.id === id)
    if (!node || node.parentId === null) return // can't delete root

    // Collect all descendant IDs recursively
    const toDelete = new Set<string>([id])
    const collectDescendants = (parentId: string) => {
      nodes.filter(n => n.parentId === parentId).forEach(n => {
        toDelete.add(n.id)
        collectDescendants(n.id)
      })
    }
    collectDescendants(id)

    // Select parent after deletion
    set(s => ({
      nodes: s.nodes.filter(n => !toDelete.has(n.id)),
      dirty: true,
      selectedId: node.parentId,
      editingId: null,
    }))
  },

  updateNodeText: (id, text) => {
    set(s => ({
      nodes: s.nodes.map(n => n.id === id ? { ...n, text } : n),
      dirty: true,
    }))
  },

  updateNodeUrl: (id, url) => {
    set(s => ({
      nodes: s.nodes.map(n => n.id === id ? { ...n, url } : n),
      dirty: true,
    }))
  },
}))
