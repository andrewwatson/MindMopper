import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type EdgeType = 'default' | 'straight' | 'step' | 'smoothstep'
export type EdgeThickness = 1 | 2 | 3 | 5

export interface EdgeStyle {
  type: EdgeType
  thickness: EdgeThickness
  color: string
}

interface EdgeStyleState extends EdgeStyle {
  setType: (type: EdgeType) => void
  setThickness: (thickness: EdgeThickness) => void
  setColor: (color: string) => void
}

export const EDGE_COLORS = [
  { label: 'Gray',   value: '#94a3b8' },
  { label: 'Blue',   value: '#3b82f6' },
  { label: 'Green',  value: '#22c55e' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'Red',    value: '#ef4444' },
  { label: 'Black',  value: '#1e293b' },
]

export const useEdgeStyleStore = create<EdgeStyleState>()(
  persist(
    (set) => ({
      type: 'smoothstep',
      thickness: 2,
      color: '#94a3b8',
      setType: (type) => set({ type }),
      setThickness: (thickness) => set({ thickness }),
      setColor: (color) => set({ color }),
    }),
    { name: 'mindmopper.edgeStyle' }
  )
)
