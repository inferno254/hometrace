import { useQuery } from '@tanstack/react-query'
import { X, GitCompare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { PublicPropertyRow } from '../types/property'

type Props = {
  ids: string[]
  onRemove: (id: string) => void
  onClear: () => void
}

async function loadBatch(ids: string[]): Promise<PublicPropertyRow[]> {
  if (!supabase || ids.length === 0) return []
  const { data } = await supabase.rpc('fetch_public_properties')
  const rows = (data ?? []) as PublicPropertyRow[]
  return rows.filter((r) => ids.includes(r.id))
}

export function CompareBar({ ids, onRemove, onClear }: Props) {
  const navigate = useNavigate()
  const { data: items } = useQuery({
    queryKey: ['compare-items', ids],
    queryFn: () => loadBatch(ids),
    enabled: ids.length > 0,
  })

  if (ids.length === 0) return null

  return (
    <div id="compare-bar" className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-trace-dusk/95 backdrop-blur-xl px-4 py-3 transition-shadow">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <GitCompare className="h-4 w-4 text-cyan-400" />
          <span className="font-medium text-white">{ids.length}</span> selected
          <button onClick={onClear} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors ml-2">
            Clear all
          </button>
        </div>
        <div className="flex items-center gap-2">
          {items?.slice(0, 4).map((p) => (
            <div key={p.id} className="relative">
              <div className="h-8 w-8 rounded-md overflow-hidden border border-white/10">
                {p.cover_image_url || p.image_urls?.[0] ? (
                  <img src={p.cover_image_url || p.image_urls![0]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-trace-line" />
                )}
              </div>
              <button
                onClick={() => onRemove(p.id)}
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500/80 text-[8px] text-white flex items-center justify-center hover:bg-red-500 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            onClick={() => navigate('/compare')}
            disabled={ids.length < 2}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-xs font-bold text-trace-dusk disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            Compare ({ids.length})
          </button>
        </div>
      </div>
    </div>
  )
}
