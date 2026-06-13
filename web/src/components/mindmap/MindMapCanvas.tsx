import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node as RFNode,
  type Edge,
} from '@xyflow/react'
import { useEditorStore } from '../../stores/editorStore'
import { useEdgeStyleStore, COLOR_PALETTES } from '../../stores/edgeStyleStore'
import { MindMapNode } from './MindMapNode'
import { layoutTree } from './layout'
import type { MindNode } from '../../types/api'

const nodeTypes = { mindmap: MindMapNode }

// Build a map from nodeId → palette color index based on which direct child of root it is.
// All descendants of that child inherit the same index.
function buildBranchColorMap(nodes: MindNode[]): Map<string, number> {
  const rootNode = nodes.find(n => n.parentId === null)
  if (!rootNode) return new Map()

  // Direct children of root, sorted by sortOrder
  const topBranches = nodes
    .filter(n => n.parentId === rootNode.id)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const colorMap = new Map<string, number>()

  // BFS from each top-level branch, propagating its color index
  topBranches.forEach((branch, idx) => {
    const queue = [branch.id]
    while (queue.length > 0) {
      const id = queue.shift()!
      colorMap.set(id, idx)
      nodes.filter(n => n.parentId === id).forEach(child => queue.push(child.id))
    }
  })

  return colorMap
}

interface Props {
  readOnly?: boolean
}

export function MindMapCanvas({ readOnly }: Props) {
  const mindNodes = useEditorStore(s => s.nodes)
  const selectedId = useEditorStore(s => s.selectedId)
  const setSelectedId = useEditorStore(s => s.setSelectedId)

  const edgeType = useEdgeStyleStore(s => s.type)
  const edgeThickness = useEdgeStyleStore(s => s.thickness)
  const paletteId = useEdgeStyleStore(s => s.paletteId)

  const { rfNodes, edges } = useMemo(() => {
    const palette = COLOR_PALETTES.find(p => p.id === paletteId) ?? COLOR_PALETTES[0]
    const branchColorMap = buildBranchColorMap(mindNodes)

    const rfNodes: RFNode[] = mindNodes.map(n => ({
      id: n.id,
      type: 'mindmap',
      position: { x: 0, y: 0 },
      selected: n.id === selectedId,
      data: {
        label: n.text,
        isRoot: n.parentId === null,
        isReadOnly: readOnly,
        url: n.url ?? '',
      },
    }))

    const edges: Edge[] = mindNodes
      .filter(n => n.parentId !== null)
      .map(n => {
        const colorIdx = branchColorMap.get(n.id) ?? 0
        const color = palette.colors[colorIdx % palette.colors.length]
        return {
          id: `e-${n.parentId}-${n.id}`,
          source: n.parentId!,
          target: n.id,
          type: edgeType,
          style: { stroke: color, strokeWidth: edgeThickness },
        }
      })

    const laidOut = layoutTree(rfNodes, edges)
    return { rfNodes: laidOut.nodes, edges: laidOut.edges }
  }, [mindNodes, selectedId, readOnly, edgeType, edgeThickness, paletteId])

  const onNodeClick = useCallback((_: unknown, node: RFNode) => {
    setSelectedId(node.id)
  }, [setSelectedId])

  const onPaneClick = useCallback(() => {
    setSelectedId(null)
  }, [setSelectedId])

  return (
    <ReactFlow
      nodes={rfNodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      nodesDraggable={!readOnly}
      nodesConnectable={false}
      elementsSelectable={!readOnly}
      minZoom={0.1}
      maxZoom={2}
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  )
}
