import { useEffect, useCallback, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { mapsApi } from '../api/maps'
import { useEditorStore } from '../stores/editorStore'
import { MindMapCanvas } from '../components/mindmap/MindMapCanvas'
import { KeyboardController } from '../components/mindmap/KeyboardController'
import { ShareDialog } from '../components/ShareDialog'
import { useDebouncedEffect } from '../hooks/useDebouncedEffect'

export default function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const [showShare, setShowShare] = useState(false)

  const nodes = useEditorStore(s => s.nodes)
  const dirty = useEditorStore(s => s.dirty)
  const saving = useEditorStore(s => s.saving)
  const setNodes = useEditorStore(s => s.setNodes)
  const setDirty = useEditorStore(s => s.setDirty)
  const setSaving = useEditorStore(s => s.setSaving)
  const getRootId = useEditorStore(s => s.getRootId)

  const forceSaveRef = useRef<() => void>(() => {})

  const { data, isLoading, isError } = useQuery({
    queryKey: ['maps', id],
    queryFn: () => mapsApi.get(id!),
    enabled: !!id,
  })

  // Seed store when data loads
  useEffect(() => {
    if (data) {
      setNodes(data.nodes)
      setDirty(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const saveMutation = useMutation({
    mutationFn: () => {
      const rootId = getRootId()
      if (!rootId) throw new Error('no root')
      return mapsApi.saveTree(id!, rootId, nodes)
    },
    onMutate: () => setSaving('saving'),
    onSuccess: () => { setSaving('saved'); setDirty(false) },
    onError: () => setSaving('error'),
    onSettled: () => setTimeout(() => setSaving('idle'), 2000),
  })

  // Debounced autosave
  useDebouncedEffect(() => {
    if (dirty) saveMutation.mutate()
  }, [dirty, nodes], 500)

  const forceSave = useCallback(() => {
    if (dirty) saveMutation.mutate()
  }, [dirty, saveMutation])

  // Keep ref in sync for keyboard controller
  useEffect(() => { forceSaveRef.current = forceSave }, [forceSave])

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>
  )
  if (isError) return (
    <div className="min-h-screen flex items-center justify-center text-red-500">
      Map not found. <Link to="/" className="ml-2 underline text-blue-500">Go home</Link>
    </div>
  )

  const savingLabel = {
    idle: '',
    saving: 'Saving…',
    saved: 'Saved',
    error: 'Save failed',
  }[saving]

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 shrink-0">
        <Link to="/" className="text-gray-400 hover:text-gray-600 text-sm">← Maps</Link>
        <span className="text-gray-900 font-medium text-sm truncate flex-1">{data?.map.title}</span>
        <span className="text-xs text-gray-400">{savingLabel}</span>
        <button
          onClick={() => setShowShare(true)}
          className="text-sm px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Share
        </button>
      </header>

      <div className="flex-1 relative">
        <MindMapCanvas />
        <KeyboardController onForceSave={() => forceSaveRef.current()} />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-gray-500 shadow-sm border border-gray-200 pointer-events-none">
          Tab = child · Enter = sibling · F2 = rename · Del = delete · Arrows = navigate
        </div>
      </div>

      {showShare && id && (
        <ShareDialog mapId={id} onClose={() => setShowShare(false)} />
      )}
    </div>
  )
}
