import dagre from '@dagrejs/dagre'
import type { Node as RFNode, Edge } from '@xyflow/react'

const NODE_W = 200
const NODE_H = 44

export function layoutTree(rfNodes: RFNode[], edges: Edge[]): { nodes: RFNode[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', ranksep: 80, nodesep: 16, marginx: 40, marginy: 40 })

  rfNodes.forEach(n => g.setNode(n.id, { width: NODE_W, height: NODE_H }))
  edges.forEach(e => g.setEdge(e.source, e.target))
  dagre.layout(g)

  return {
    nodes: rfNodes.map(n => {
      const pos = g.node(n.id)
      return { ...n, position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 } }
    }),
    edges,
  }
}
