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
import { useEdgeStyleStore } from '../../stores/edgeStyleStore'
import { MindMapNode } from './MindMapNode'
import { layoutTree } from './layout'

const nodeTypes = { mindmap: MindMapNode }

interface Props {
  readOnly?: boolean
}

export function MindMapCanvas({ readOnly }: Props) {
  const mindNodes = useEditorStore(s => s.nodes)
  const selectedId = useEditorStore(s => s.selectedId)
  const setSelectedId = useEditorStore(s => s.setSelectedId)

  const edgeType = useEdgeStyleStore(s => s.type)
  const edgeThickness = useEdgeStyleStore(s => s.thickness)
  const edgeColor = useEdgeStyleStore(s => s.color)

  const { rfNodes, edges } = useMemo(() => {
    const rfNodes: RFNode[] = mindNodes.map(n => ({
      id: n.id,
      type: 'mindmap',
      position: { x: 0, y: 0 }, // will be overridden by layout
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
      .map(n => ({
        id: `e-${n.parentId}-${n.id}`,
        source: n.parentId!,
        target: n.id,
        type: edgeType,
        style: { stroke: edgeColor, strokeWidth: edgeThickness },
      }))
    const laidOut = layoutTree(rfNodes, edges)
    return { rfNodes: laidOut.nodes, edges: laidOut.edges }
  }, [mindNodes, selectedId, readOnly, edgeType, edgeThickness, edgeColor])

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
