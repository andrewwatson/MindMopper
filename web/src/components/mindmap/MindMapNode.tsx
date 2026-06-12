import { memo, useCallback, useRef, useEffect } from 'react'
import { Handle, Position } from '@xyflow/react'
import { useEditorStore } from '../../stores/editorStore'
import clsx from 'clsx'

interface MindMapNodeProps {
  id: string
  data: { label: string; isRoot: boolean; isReadOnly?: boolean }
  selected: boolean
}

export const MindMapNode = memo(({ id, data, selected }: MindMapNodeProps) => {
  const editingId = useEditorStore(s => s.editingId)
  const setEditingId = useEditorStore(s => s.setEditingId)
  const updateNodeText = useEditorStore(s => s.updateNodeText)
  const setSelectedId = useEditorStore(s => s.setSelectedId)
  const isEditing = editingId === id
  const inputRef = useRef<HTMLInputElement>(null)
  const originalText = useRef(data.label)

  useEffect(() => {
    if (!isEditing) return
    // setTimeout defers focus until after React Flow finishes mounting the node
    const t = setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 0)
    return () => clearTimeout(t)
  }, [isEditing])

  const commitEdit = useCallback(() => {
    setEditingId(null)
  }, [setEditingId])

  const cancelEdit = useCallback(() => {
    updateNodeText(id, originalText.current)
    setEditingId(null)
  }, [id, updateNodeText, setEditingId])

  const handleDoubleClick = useCallback(() => {
    if (data.isReadOnly) return
    originalText.current = data.label
    setEditingId(id)
    setSelectedId(id)
  }, [id, data.label, data.isReadOnly, setEditingId, setSelectedId])

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={clsx(
        'px-3 py-2 rounded-lg border-2 bg-white shadow-sm min-w-[120px] max-w-[200px] cursor-pointer select-none',
        selected ? 'border-blue-500 shadow-blue-100 shadow-md' : 'border-gray-200 hover:border-gray-400',
        data.isRoot && 'border-gray-700 bg-gray-50 font-semibold',
      )}
    >
      {!data.isRoot && (
        <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-gray-400" />
      )}
      {isEditing ? (
        <input
          ref={inputRef}
          value={data.label}
          onChange={e => updateNodeText(id, e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.stopPropagation(); commitEdit() }
            if (e.key === 'Escape') { e.stopPropagation(); cancelEdit() }
          }}
          className="w-full text-sm outline-none bg-transparent"
          style={{ minWidth: 80 }}
        />
      ) : (
        <span className="text-sm text-gray-800 block truncate">{data.label || <span className="text-gray-400 italic">empty</span>}</span>
      )}
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-gray-400" />
    </div>
  )
})
MindMapNode.displayName = 'MindMapNode'
