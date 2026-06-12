import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { shareApi } from '../api/share'
import { useEditorStore } from '../stores/editorStore'
import { MindMapCanvas } from '../components/mindmap/MindMapCanvas'

export default function SharedMapPage() {
  const { token } = useParams<{ token: string }>()
  const setNodes = useEditorStore(s => s.setNodes)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['shared', token],
    queryFn: () => shareApi.getShared(token!),
    enabled: !!token,
  })

  useEffect(() => {
    if (data) setNodes(data.nodes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>
  )
  if (isError) return (
    <div className="min-h-screen flex items-center justify-center text-red-500">
      This map is no longer available. <Link to="/" className="ml-2 underline text-blue-500">Go home</Link>
    </div>
  )

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 shrink-0">
        <span className="text-gray-900 font-medium text-sm flex-1">{data?.map.title}</span>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Read-only</span>
        <Link to="/" className="text-sm text-blue-600 hover:underline">Create your own</Link>
      </header>
      <div className="flex-1 relative">
        <MindMapCanvas readOnly />
      </div>
    </div>
  )
}
