import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Heart, GitCompare, SlidersHorizontal, X } from 'lucide-react'
import { usePageMeta } from '../lib/seo'
import { supabase } from '../lib/supabase'
import { supabaseConfigured } from '../lib/env'
import { PropertyCard } from '../components/PropertyCard'
import { FadeIn } from '../components/FadeIn'
import { SaveButton } from '../components/SaveButton'
import { CompareButton } from '../components/CompareButton'
import { AreaInsights } from '../components/AreaInsights'
import { useFavorites } from '../hooks/useFavorites'
import { useCompare } from '../hooks/useCompare'
import type { PublicPropertyRow } from '../types/property'

const PAGE_SIZE = 12

async function loadAll(): Promise<PublicPropertyRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('fetch_public_properties')
  if (error) throw error
  return (data ?? []) as PublicPropertyRow[]
}

export function BrowsePage() {
  usePageMeta('Browse listings', 'Filter and search homes by county, price, type, and more. Broad area context only — exact pins stay private.')
  const configured = supabaseConfigured()
  const [qText, setQText] = useState('')
  const [county, setCounty] = useState('')
  const [type, setType] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [furnished, setFurnished] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const { isFavorite, toggle: toggleFav } = useFavorites()
  const { isSelected, toggle: toggleCompare } = useCompare()

  const query = useQuery({
    queryKey: ['public-properties-all'],
    queryFn: loadAll,
    enabled: configured,
  })

  const filtered = useMemo(() => {
    const list = query.data ?? []
    const qt = qText.trim().toLowerCase()
    const pMin = priceMin ? Number(priceMin) : 0
    const pMax = priceMax ? Number(priceMax) : Infinity

    let result = list.filter((p) => {
      if (county && p.county.toLowerCase() !== county.toLowerCase()) return false
      if (type && p.property_type !== type) return false
      if (furnished === 'yes' && !p.furnished) return false
      if (furnished === 'no' && p.furnished) return false
      if (Number(p.price) < pMin || Number(p.price) > pMax) return false
      if (!qt) return true
      const blob = [p.title, p.town, p.county, p.area_label, p.description, p.listing_reference]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return blob.includes(qt)
    })

    if (sortBy === 'price-low') result.sort((a, b) => Number(a.price) - Number(b.price))
    else if (sortBy === 'price-high') result.sort((a, b) => Number(b.price) - Number(a.price))
    else if (sortBy === 'newest') result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    else if (sortBy === 'oldest') result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    return result
  }, [query.data, qText, county, type, priceMin, priceMax, furnished, sortBy])

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
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-display text-3xl font-bold text-white">Browse homes</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs transition-colors ${
              showFilters ? 'border-cyan-400/30 text-cyan-300 bg-cyan-400/10' : 'border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
          </button>
        </div>
        <p className="text-zinc-500 text-sm mb-6">Coordinates &amp; estate names are never shown here on purpose.</p>
      </FadeIn>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Heart className="h-3.5 w-3.5" />
          <span>Click ♡ to save, use compare ✓ for side-by-side</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <GitCompare className="h-3.5 w-3.5" />
          <span>Select 2-4 to compare</span>
        </div>
      </div>

      {!configured && (
        <div className="glass-card p-6 text-zinc-400">Configure Supabase in <code className="text-cyan-200">.env</code> first.</div>
      )}

      {configured && (
        <>
          <FadeIn>
            <div className="glass-card mb-8 space-y-3 p-4">
              <div className="grid gap-3 md:grid-cols-4">
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

              {showFilters && (
                <div className="grid gap-3 md:grid-cols-4 pt-2 border-t border-white/10 animate-fade-in">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
                      placeholder="Min price"
                      value={priceMin}
                      onChange={(e) => { setPriceMin(e.target.value); resetPage() }}
                    />
                    <input
                      type="number"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
                      placeholder="Max price"
                      value={priceMax}
                      onChange={(e) => { setPriceMax(e.target.value); resetPage() }}
                    />
                  </div>
                  <select
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                    value={furnished}
                    onChange={(e) => { setFurnished(e.target.value); resetPage() }}
                  >
                    <option value="">Any furnishing</option>
                    <option value="yes">Furnished</option>
                    <option value="no">Unfurnished</option>
                  </select>
                  <select
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); resetPage() }}
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="price-low">Price: Low → High</option>
                    <option value="price-high">Price: High → Low</option>
                  </select>
                  {(priceMin || priceMax || furnished || sortBy !== 'newest') && (
                    <button
                      onClick={() => { setPriceMin(''); setPriceMax(''); setFurnished(''); setSortBy('newest'); resetPage() }}
                      className="flex items-center justify-center gap-1 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      <X className="h-3 w-3" /> Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </FadeIn>

          <div className="grid gap-6 lg:grid-cols-4">
            <div className="lg:col-span-4 xl:col-span-1">
              {query.data && query.data.length > 0 && (
                <AreaInsights
                  properties={query.data}
                  targetCounty={county || undefined}
                  targetTown={qText || undefined}
                />
              )}
            </div>
            <div className="lg:col-span-4 xl:col-span-3">
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
                <>
                  <div className="flex items-center justify-between mb-4 text-xs text-zinc-600">
                    <span>{filtered.length} listing{filtered.length !== 1 ? 's' : ''}</span>
                    <span>Page {safePage} of {totalPages}</span>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {paged.map((p, i) => (
                      <FadeIn key={p.id} delay={(i % PAGE_SIZE) * 60}>
                        <div className="relative">
                          <PropertyCard property={p} />
                          <div className="absolute top-2 right-2 flex gap-1">
                            <SaveButton id={p.id} isFavorite={isFavorite(p.id)} onToggle={toggleFav} compact />
                          </div>
                          <div className="absolute top-10 right-2">
                            <CompareButton id={p.id} isSelected={isSelected(p.id)} onToggle={toggleCompare} />
                          </div>
                        </div>
                      </FadeIn>
                    ))}
                  </div>

                  {totalPages > 1 && (
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
          </div>
        </>
      )}
    </div>
  )
}
