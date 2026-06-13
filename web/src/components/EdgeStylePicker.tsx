import { useState, useRef, useEffect } from 'react'
import { useEdgeStyleStore, COLOR_PALETTES, type EdgeType, type EdgeThickness } from '../stores/edgeStyleStore'

export function EdgeStylePicker() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const { type, thickness, paletteId, setType, setThickness, setPaletteId } = useEdgeStyleStore()

  const activePalette = COLOR_PALETTES.find(p => p.id === paletteId) ?? COLOR_PALETTES[0]

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const edgeTypes: { value: EdgeType; label: string; preview: string }[] = [
    { value: 'default',    label: 'Bezier',   preview: 'M0,8 C12,8 18,2 30,2' },
    { value: 'smoothstep', label: 'Rounded',  preview: 'M0,8 L8,8 Q14,8 14,2 L30,2' },
    { value: 'step',       label: 'Angular',  preview: 'M0,8 L15,8 L15,2 L30,2' },
    { value: 'straight',   label: 'Straight', preview: 'M0,8 L30,2' },
  ]

  const thicknesses: { value: EdgeThickness; label: string }[] = [
    { value: 1, label: 'Thin' },
    { value: 2, label: 'Medium' },
    { value: 3, label: 'Thick' },
    { value: 5, label: 'Bold' },
  ]

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Line style"
        className={`text-sm px-3 py-1.5 border rounded-md hover:bg-gray-50 flex items-center gap-1.5 ${open ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700'}`}
      >
        {/* Mini palette swatch strip */}
        <span className="flex gap-0.5">
          {activePalette.colors.slice(0, 5).map((c, i) => (
            <span key={i} className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c }} />
          ))}
        </span>
        <span>Lines</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-72 z-50">

          {/* Edge type */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Style</p>
          <div className="grid grid-cols-2 gap-1.5 mb-4">
            {edgeTypes.map(et => (
              <button
                key={et.value}
                onClick={() => setType(et.value)}
                className={`flex items-center gap-2 px-2 py-2 rounded-lg border text-xs transition-colors ${
                  type === et.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 hover:border-gray-400 text-gray-600'
                }`}
              >
                <svg width="30" height="10" viewBox="0 0 30 10" className="shrink-0">
                  <path d={et.preview} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {et.label}
              </button>
            ))}
          </div>

          {/* Thickness */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Thickness</p>
          <div className="flex gap-1.5 mb-4">
            {thicknesses.map(t => (
              <button
                key={t.value}
                onClick={() => setThickness(t.value)}
                title={t.label}
                className={`flex-1 flex items-center justify-center h-8 rounded-lg border transition-colors ${
                  thickness === t.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <div
                  className="rounded-full bg-gray-600"
                  style={{ width: '60%', height: t.value }}
                />
              </button>
            ))}
          </div>

          {/* Palette */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Color Palette</p>
          <div className="flex flex-col gap-1.5">
            {COLOR_PALETTES.map(palette => (
              <button
                key={palette.id}
                onClick={() => setPaletteId(palette.id)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-colors text-xs ${
                  paletteId === palette.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-100 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="flex gap-0.5 shrink-0">
                  {palette.colors.map((c, i) => (
                    <span
                      key={i}
                      className="w-4 h-4 rounded-sm"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </span>
                <span className="ml-1">{palette.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
