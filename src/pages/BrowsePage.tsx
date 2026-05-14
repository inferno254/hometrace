import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { supabaseConfigured } from '../lib/env'
import { PropertyCard } from '../components/PropertyCard'
import { FadeIn } from '../components/FadeIn'
import type { PublicPropertyRow } from '../types/property'

const PAGE_SIZE = 12

async function loadAll(): Promise<PublicPropertyRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('fetch_public_properties')
  if (error) throw error
  return (data ?? []) as PublicPropertyRow[]
}

export function BrowsePage() {
  const configured = supabaseConfigured()
  const [qText, setQText] = useState('')
  const [county, setCounty] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [aiMode] = useState(false)

  const query = useQuery({
    queryKey: ['public-properties-all'],
    queryFn: loadAll,
    enabled: configured,
  })

  const filtered = useMemo(() => {
    const list = query.data ?? []
    const qt = qText.trim().toLowerCase()
    return list.filter((p) => {
      if (county && p.county.toLowerCase() !== county.toLowerCase()) return false
      if (type && p.property_type !== type) return false
      if (!qt) return true
      const blob = [p.title, p.town, p.county, p.area_label, p.description, p.listing_reference]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return blob.includes(qt)
    })
  }, [query.data, qText, county, type])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const counties = useMemo(() => {
    const s = new Set<string>()
    ;(query.data ?? []).forEach((p) => p.county && s.add(p.county))
    return [...s].sort()
  }, [query.data])

  const resetPage = () => setPage(1)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <FadeIn>
        <h1 className="font-display text-3xl font-bold text-white mb-2">Browse homes</h1>
        <p className="text-zinc-500 text-sm mb-8">Coordinates &amp; estate names are never shown here on purpose.</p>
      </FadeIn>

      {!configured && (
        <div className="glass-card p-6 text-zinc-400">Configure Supabase in <code className="text-cyan-200">.env</code> first.</div>
      )}

      {configured && (
        <>
          <FadeIn>
            <div className="glass-card mb-8 grid gap-4 p-4 md:grid-cols-4">
              <input
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-600 md:col-span-2"
                placeholder="Search title, town, ref..."
                value={qText}
                onChange={(e) => { setQText(e.target.value); resetPage() }}
              />
              <select
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                value={county}
                onChange={(e) => { setCounty(e.target.value); resetPage() }}
              >
                <option value="">All counties</option>
                {counties.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white capitalize"
                value={type}
                onChange={(e) => { setType(e.target.value); resetPage() }}
              >
                <option value="">All types</option>
                {['apartment', 'bedsitter', 'bungalow', 'maisonette', 'studio', 'townhouse', 'land', 'commercial'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </FadeIn>

          {query.isLoading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <FadeIn key={i} delay={i * 80}>
                  <div className="glass-card overflow-hidden">
                    <div className="skeleton aspect-[5/3]" />
                    <div className="space-y-3 p-4">
                      <div className="skeleton h-5 w-3/4" />
                      <div className="skeleton h-4 w-1/2" />
                      <div className="skeleton h-3 w-2/3" />
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          )}
          {query.error && <p className="text-red-400">{(query.error as Error).message}</p>}
          {!query.isLoading && !query.error && (
            <div className="flex items-center justify-between mb-4 text-xs text-zinc-600">
              <span>{filtered.length} listing(s)</span>
              {!aiMode && totalPages > 1 && (
                <span>Page {safePage} of {totalPages}</span>
              )}
            </div>
          )}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(aiMode ? filtered : paged).map((p, i) => (
              <FadeIn key={p.id} delay={(i % PAGE_SIZE) * 60}>
                <PropertyCard property={p} />
              </FadeIn>
            ))}
          </div>

          {!query.isLoading && !query.error && !aiMode && totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="text-xs text-zinc-600">
                {safePage} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
