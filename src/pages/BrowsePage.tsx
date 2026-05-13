import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { supabaseConfigured } from '../lib/env'
import { PropertyCard } from '../components/PropertyCard'
import type { PublicPropertyRow } from '../types/property'

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
      const blob = [
        p.title,
        p.town,
        p.county,
        p.area_label,
        p.description,
        p.listing_reference,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return blob.includes(qt)
    })
  }, [query.data, qText, county, type])

  const counties = useMemo(() => {
    const s = new Set<string>()
    ;(query.data ?? []).forEach((p) => p.county && s.add(p.county))
    return [...s].sort()
  }, [query.data])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-white mb-2">Browse homes</h1>
      <p className="text-zinc-500 text-sm mb-8">Coordinates &amp; estate names are never shown here on purpose.</p>

      {!configured && (
        <div className="glass-card p-6 text-zinc-400">Configure Supabase in <code className="text-cyan-200">.env</code> first.</div>
      )}

      {configured && (
        <>
          <div className="glass-card mb-8 grid gap-4 p-4 md:grid-cols-4">
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-600 md:col-span-2"
              placeholder="Search title, town, ref..."
              value={qText}
              onChange={(e) => setQText(e.target.value)}
            />
            <select
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              value={county}
              onChange={(e) => setCounty(e.target.value)}
            >
              <option value="">All counties</option>
              {counties.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white capitalize"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">All types</option>
              {['apartment', 'bedsitter', 'bungalow', 'maisonette', 'studio', 'townhouse', 'land', 'commercial'].map(
                (t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ),
              )}
            </select>
          </div>

          {query.isLoading && <p className="text-zinc-500">Loading...</p>}
          {query.error && <p className="text-red-400">{(query.error as Error).message}</p>}
          {!query.isLoading && !query.error && (
            <p className="text-xs text-zinc-600 mb-4">{filtered.length} listing(s)</p>
          )}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
