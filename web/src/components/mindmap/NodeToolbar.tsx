import { useState, useRef, useEffect } from 'react'
import { NodeToolbar, Position } from '@xyflow/react'
import { useEditorStore } from '../../stores/editorStore'

interface Props {
  id: string
  url: string
  isReadOnly?: boolean
}

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function NodeLinkToolbar({ id, url, isReadOnly }: Props) {
  const updateNodeUrl = useEditorStore(s => s.updateNodeUrl)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(url)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const hasUrl = url.length > 0

  useEffect(() => {
    if (editing) {
      setDraft(url)
      setError('')
      setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select() }, 0)
    }
  }, [editing, url])

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed === '') {
      // Allow clearing the URL
      updateNodeUrl(id, '')
      setEditing(false)
      return
    }
    if (!isValidUrl(trimmed)) {
      setError('URL must start with http:// or https://')
      return
    }
    updateNodeUrl(id, trimmed)
    setEditing(false)
  }

  const cancel = () => {
    setEditing(false)
    setError('')
  }

  const openLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasUrl) window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (isReadOnly) {
    if (!hasUrl) return null
    return (
      <NodeToolbar position={Position.Top} align="center">
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-lg px-2 py-1.5">
          <button
            onClick={openLink}
            title={url}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
          >
            <LinkIcon filled />
            <span className="max-w-[140px] truncate">{url.replace(/^https?:\/\//, '')}</span>
          </button>
        </div>
      </NodeToolbar>
    )
  }

  return (
    <NodeToolbar position={Position.Top} align="center">
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-lg px-2 py-1.5">
        {!editing ? (
          <>
            <button
              onClick={e => { e.stopPropagation(); setEditing(true) }}
              title={hasUrl ? `Link: ${url}` : 'Add link'}
              className={`p-1 rounded hover:bg-gray-100 transition-colors ${hasUrl ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LinkIcon filled={hasUrl} />
            </button>
            {hasUrl && (
              <button
                onClick={openLink}
                title="Open link"
                className="text-xs text-blue-500 hover:text-blue-700 hover:underline max-w-[120px] truncate px-1"
              >
                {url.replace(/^https?:\/\//, '')}
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <input
                ref={inputRef}
                value={draft}
                onChange={e => { setDraft(e.target.value); setError('') }}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.stopPropagation(); commit() }
                  if (e.key === 'Escape') { e.stopPropagation(); cancel() }
                }}
                placeholder="https://example.com"
                className="text-xs border border-gray-300 rounded px-2 py-1 w-48 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={e => { e.stopPropagation(); commit() }}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={e => { e.stopPropagation(); cancel() }}
                className="text-xs text-gray-500 px-2 py-1 rounded hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
            {error && <p className="text-xs text-red-500 px-1">{error}</p>}
            {draft && (
              <button
                onClick={e => { e.stopPropagation(); setDraft(''); updateNodeUrl(id, ''); setEditing(false) }}
                className="text-xs text-gray-400 hover:text-red-500 text-left px-1"
              >
                Remove link
              </button>
            )}
          </div>
        )}
      </div>
    </NodeToolbar>
  )
}

function LinkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {filled ? (
        <>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" fill="currentColor" opacity="0.2"/>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </>
      ) : (
        <>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </>
      )}
    </svg>
  )
}
