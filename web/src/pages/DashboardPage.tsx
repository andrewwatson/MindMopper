import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { mapsApi } from '../api/maps'
import type { MapSummary } from '../types/api'

export default function DashboardPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const { data: maps = [], isLoading } = useQuery({
    queryKey: ['maps'],
    queryFn: mapsApi.list,
  })

  const createMutation = useMutation({
    mutationFn: (title: string) => mapsApi.create(title || 'Untitled Map'),
    onSuccess: (map) => {
      qc.invalidateQueries({ queryKey: ['maps'] })
      setCreating(false)
      setNewTitle('')
      navigate(`/maps/${map.id}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: mapsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maps'] }),
  })

  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      mapsApi.rename(id, title),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maps'] })
      setRenaming(null)
    },
  })

  const handleCreate = () => {
    createMutation.mutate(newTitle)
  }

  const startRename = (map: MapSummary) => {
    setRenaming(map.id)
    setRenameValue(map.title)
  }

  const commitRename = (id: string) => {
    if (renameValue.trim()) {
      renameMutation.mutate({ id, title: renameValue.trim() })
    } else {
      setRenaming(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">MindMopper</h1>
        <button
          onClick={() => setCreating(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          New Map
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {creating && (
          <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4 flex gap-3">
            <input
              autoFocus
              type="text"
              placeholder="Map title..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreate()
                if (e.key === 'Escape') { setCreating(false); setNewTitle('') }
              }}
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Create
            </button>
            <button
              onClick={() => { setCreating(false); setNewTitle('') }}
              className="text-gray-500 px-3 py-2 rounded text-sm hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center text-gray-400 py-16">Loading...</div>
        ) : maps.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            <p className="text-lg mb-2">No maps yet</p>
            <p className="text-sm">Click "New Map" to create your first mind map</p>
          </div>
        ) : (
          <div className="space-y-2">
            {maps.map(map => (
              <div
                key={map.id}
                className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3 hover:border-blue-300 group"
              >
                {renaming === map.id ? (
                  <input
                    autoFocus
                    type="text"
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onBlur={() => commitRename(map.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitRename(map.id)
                      if (e.key === 'Escape') setRenaming(null)
                    }}
                    className="flex-1 border border-blue-400 rounded px-2 py-1 text-sm focus:outline-none"
                  />
                ) : (
                  <button
                    className="flex-1 text-left text-gray-900 font-medium text-sm hover:text-blue-600"
                    onClick={() => navigate(`/maps/${map.id}`)}
                  >
                    {map.title}
                  </button>
                )}
                <span className="text-xs text-gray-400">
                  {new Date(map.updatedAt).toLocaleDateString()}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => startRename(map)}
                    className="text-xs text-gray-500 px-2 py-1 rounded hover:bg-gray-100"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${map.title}"?`)) deleteMutation.mutate(map.id)
                    }}
                    className="text-xs text-red-500 px-2 py-1 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
