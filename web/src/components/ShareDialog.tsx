import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { shareApi } from '../api/share'

interface Props {
  mapId: string
  onClose: () => void
}

export function ShareDialog({ mapId, onClose }: Props) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const shareMutation = useMutation({
    mutationFn: () => shareApi.create(mapId),
    onSuccess: (link) => setShareUrl(link.url),
  })

  const revokeMutation = useMutation({
    mutationFn: () => shareApi.revoke(mapId),
    onSuccess: () => { setShareUrl(null) },
  })

  const copyUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-96 max-w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Share Map</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {!shareUrl ? (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Create a read-only link to share this map with anyone.
            </p>
            <button
              onClick={() => shareMutation.mutate()}
              disabled={shareMutation.isPending}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {shareMutation.isPending ? 'Creating link...' : 'Create share link'}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-2">Share this read-only link:</p>
            <div className="flex gap-2 mb-4">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 text-xs border border-gray-300 rounded px-2 py-2 bg-gray-50"
              />
              <button
                onClick={copyUrl}
                className="bg-gray-100 px-3 py-2 rounded text-sm hover:bg-gray-200"
              >
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
            <button
              onClick={() => revokeMutation.mutate()}
              disabled={revokeMutation.isPending}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Revoke link
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
