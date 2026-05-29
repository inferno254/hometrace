import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Heart, ArrowLeft, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { supabaseConfigured } from '../lib/env'
import { PropertyCard } from '../components/PropertyCard'
import { FadeIn } from '../components/FadeIn'
import { useFavorites } from '../hooks/useFavorites'
import type { PublicPropertyRow } from '../types/property'

export function SavedPage() {
  const configured = supabaseConfigured()
  const { favorites, count, clear } = useFavorites()

  const q = useQuery({
    queryKey: ['public-properties-all'],
    queryFn: async () => {
      if (!supabase) return []
      const { data } = await supabase.rpc('fetch_public_properties')
      return (data ?? []) as PublicPropertyRow[]
    },
    enabled: configured && favorites.length > 0,
  })

  const saved = (q.data ?? []).filter((p) => favorites.includes(p.id))

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <FadeIn>
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/browse" className="mb-3 inline-flex items-center gap-1 text-sm text-cyan-300 hover:underline">
              <ArrowLeft className="h-4 w-4" /> Back to browse
            </Link>
            <h1 className="font-display text-3xl font-bold text-white mt-2 flex items-center gap-3">
              <Heart className="h-6 w-6 text-red-400" /> Saved listings
            </h1>
            <p className="text-zinc-500 text-sm mt-1">{count} saved · stored in your browser</p>
          </div>
          {count > 0 && (
            <button
              onClick={clear}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-400 hover:text-red-300 hover:border-red-400/30 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear all
            </button>
          )}
        </div>
      </FadeIn>

      {!configured && (
        <div className="glass-card p-6 text-zinc-400">Configure Supabase in <code className="text-cyan-200">.env</code> first.</div>
      )}

      {configured && count === 0 && (
        <FadeIn>
          <div className="glass-card rounded-2xl p-12 text-center">
            <Heart className="h-10 w-10 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 mb-2">No saved listings yet</p>
            <p className="text-sm text-zinc-600 mb-6">Tap the ♡ icon on any listing to save it here.</p>
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-trace-dusk hover:opacity-90 transition-opacity"
            >
              Browse homes
            </Link>
          </div>
        </FadeIn>
      )}

      {configured && count > 0 && (
        <>
          {q.isLoading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass-card overflow-hidden">
                  <div className="skeleton aspect-[5/3]" />
                  <div className="space-y-3 p-4">
                    <div className="skeleton h-5 w-3/4" />
                    <div className="skeleton h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((p, i) => (
              <FadeIn key={p.id} delay={i * 80}>
                <PropertyCard property={p} />
              </FadeIn>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
