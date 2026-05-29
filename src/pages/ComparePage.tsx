import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowLeft, X, Check, Minus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { supabaseConfigured } from '../lib/env'
import { FadeIn } from '../components/FadeIn'
import { useCompare } from '../hooks/useCompare'
import type { PublicPropertyRow } from '../types/property'

export function ComparePage() {
  const configured = supabaseConfigured()
  const { compare, count, toggle, clear } = useCompare()

  const q = useQuery({
    queryKey: ['public-properties-all'],
    queryFn: async () => {
      if (!supabase) return []
      const { data } = await supabase.rpc('fetch_public_properties')
      return (data ?? []) as PublicPropertyRow[]
    },
    enabled: configured && compare.length > 0,
  })

  const items = useMemo(() => {
    return (q.data ?? []).filter((p) => compare.includes(p.id))
  }, [q.data, compare])

  function formatPrice(p: PublicPropertyRow) {
    const n = Number(p.price)
    const formatted = Number.isFinite(n) ? `KSh ${n.toLocaleString()}` : '—'
    if (p.price_type === 'sale') return `${formatted}`
    if (p.price_type === 'negotiable') return `${formatted}+`
    return `${formatted}/mo`
  }

  if (!configured) {
    return <div className="mx-auto max-w-6xl px-4 py-10 text-zinc-400">Configure Supabase first.</div>
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <FadeIn>
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/browse" className="mb-3 inline-flex items-center gap-1 text-sm text-cyan-300 hover:underline">
              <ArrowLeft className="h-4 w-4" /> Back to browse
            </Link>
            <h1 className="font-display text-3xl font-bold text-white mt-2">Compare listings</h1>
            <p className="text-zinc-500 text-sm mt-1">{count} selected</p>
          </div>
          {count > 0 && (
            <button
              onClick={clear}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Clear all
            </button>
          )}
        </div>
      </FadeIn>

      {count === 0 && (
        <FadeIn>
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="text-zinc-400 mb-2">No listings selected for comparison</p>
            <p className="text-sm text-zinc-600 mb-6">Select 2-4 listings using the compare button on any listing card.</p>
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-trace-dusk"
            >
              Browse & select
            </Link>
          </div>
        </FadeIn>
      )}

      {count > 0 && items.length === 0 && (
        <p className="text-zinc-500">Loading comparison data...</p>
      )}

      {items.length >= 2 && (
        <FadeIn>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="w-32 p-3 text-left text-xs uppercase tracking-wider text-zinc-500">Feature</th>
                  {items.map((p) => (
                    <th key={p.id} className="p-3 min-w-[200px] align-top">
                      <div className="relative">
                        <button
                          onClick={() => toggle(p.id)}
                          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500/80 text-[10px] text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="h-28 w-full rounded-xl overflow-hidden bg-trace-line mb-2">
                          {(p.cover_image_url || p.image_urls?.[0]) ? (
                            <img src={p.cover_image_url || p.image_urls![0]} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-zinc-600 text-xs">No image</div>
                          )}
                        </div>
                        <Link to={`/listing/${p.id}`} className="font-display font-semibold text-white hover:text-cyan-300 transition-colors text-sm leading-tight block">
                          {p.title}
                        </Link>
                        <p className="text-xs text-zinc-500 mt-0.5">{p.listing_reference}</p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { label: 'Price', render: (p: PublicPropertyRow) => <span className="text-trace-cyan font-semibold">{formatPrice(p)}</span> },
                  { label: 'Type', render: (p: PublicPropertyRow) => <span className="capitalize">{p.property_type}</span> },
                  { label: 'Bedrooms', render: (p: PublicPropertyRow) => <span>{p.bedrooms ?? '—'}</span> },
                  { label: 'Bathrooms', render: (p: PublicPropertyRow) => <span>{p.bathrooms ?? '—'}</span> },
                  { label: 'Furnished', render: (p: PublicPropertyRow) => p.furnished ? <Check className="h-4 w-4 text-green-400" /> : <Minus className="h-4 w-4 text-zinc-600" /> },
                  { label: 'Size', render: (p: PublicPropertyRow) => <span>{p.size_sqm ? `${p.size_sqm} m²` : '—'}</span> },
                  { label: 'Location', render: (p: PublicPropertyRow) => <span className="text-xs">{[p.town, p.county].filter(Boolean).join(', ')}</span> },
                  { label: 'Area', render: (p: PublicPropertyRow) => <span className="text-xs text-zinc-400">{p.area_label || '—'}</span> },
                  { label: 'Amenities', render: (p: PublicPropertyRow) => (
                    <div className="flex flex-wrap gap-1">
                      {p.amenity_names?.length ? p.amenity_names.map((a) => (
                        <span key={a} className="text-[10px] bg-white/5 rounded px-1.5 py-0.5">{a}</span>
                      )) : <span className="text-zinc-600">—</span>}
                    </div>
                  )},
                  { label: 'Listed', render: (p: PublicPropertyRow) => <span className="text-xs text-zinc-500">{new Date(p.created_at).toLocaleDateString()}</span> },
                ].map((row) => (
                  <tr key={row.label} className="hover:bg-white/[0.02]">
                    <td className="p-3 text-xs font-medium text-zinc-400">{row.label}</td>
                    {items.map((p) => (
                      <td key={p.id} className="p-3 text-zinc-300">
                        {row.render(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>
      )}

      {items.length === 1 && (
        <FadeIn>
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="text-zinc-400">Select at least <strong>2</strong> listings to compare (you have {count})</p>
            <Link
              to="/browse"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-trace-dusk"
            >
              Add more listings
            </Link>
          </div>
        </FadeIn>
      )}
    </div>
  )
}
