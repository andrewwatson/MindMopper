import { useEffect } from 'react'
import { useEditorStore } from '../../stores/editorStore'

interface Props {
  readOnly?: boolean
  onForceSave?: () => void
}

export function KeyboardController({ readOnly, onForceSave }: Props) {
  const store = useEditorStore()

  useEffect(() => {
    if (readOnly) return

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'

      const { selectedId, editingId, nodes } = store

      // When editing — only handle commit/cancel
      if (editingId) {
        // Input handles Enter/Escape itself; nothing to do here
        return
      }

      if (!selectedId) return

      if (isInput) return

      switch (e.key) {
        case 'Tab':
          e.preventDefault()
          store.addChild(selectedId)
          break
        case 'Enter':
          e.preventDefault()
          store.addSibling(selectedId)
          break
        case 'F2':
          e.preventDefault()
          store.setEditingId(selectedId)
          break
        case 'Delete':
        case 'Backspace': {
          const node = nodes.find(n => n.id === selectedId)
          if (node && node.parentId !== null) {
            e.preventDefault()
            store.deleteNode(selectedId)
          }
          break
        }
        case 'Escape':
          store.setSelectedId(null)
          break
        case 'ArrowLeft': {
          e.preventDefault()
          const cur = nodes.find(n => n.id === selectedId)
          if (cur?.parentId) store.setSelectedId(cur.parentId)
          break
        }
        case 'ArrowRight': {
          e.preventDefault()
          const firstChild = nodes
            .filter(n => n.parentId === selectedId)
            .sort((a, b) => a.sortOrder - b.sortOrder)[0]
          if (firstChild) store.setSelectedId(firstChild.id)
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          const cur = nodes.find(n => n.id === selectedId)
          if (!cur || cur.parentId === null) break
          const siblings = nodes
            .filter(n => n.parentId === cur.parentId)
            .sort((a, b) => a.sortOrder - b.sortOrder)
          const idx = siblings.findIndex(n => n.id === selectedId)
          if (idx > 0) store.setSelectedId(siblings[idx - 1].id)
          else if (cur.parentId) store.setSelectedId(cur.parentId)
          break
        }
        case 'ArrowDown': {
          e.preventDefault()
          const cur = nodes.find(n => n.id === selectedId)
          if (!cur || cur.parentId === null) break
          const siblings = nodes
            .filter(n => n.parentId === cur.parentId)
            .sort((a, b) => a.sortOrder - b.sortOrder)
          const idx = siblings.findIndex(n => n.id === selectedId)
          if (idx < siblings.length - 1) store.setSelectedId(siblings[idx + 1].id)
          break
        }
        case 's':
        case 'S':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            onForceSave?.()
          }
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [store, readOnly, onForceSave])

  return null
}
