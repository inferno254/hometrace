import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { env, supabaseConfigured } from '../lib/env'
import { PropertyCard } from '../components/PropertyCard'
import { FadeIn } from '../components/FadeIn'
import type { PublicPropertyRow } from '../types/property'

async function loadFeatured(): Promise<PublicPropertyRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('fetch_public_properties')
  if (error) throw error
  const rows = (data ?? []) as PublicPropertyRow[]
  return rows.slice(0, 6)
}

function SkeletonCard() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="skeleton aspect-[5/3]" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-3 w-2/3" />
        <div className="flex gap-3">
          <div className="skeleton h-3 w-16" />
          <div className="skeleton h-3 w-16" />
        </div>
      </div>
    </div>
  )
}

export function HomePage() {
  const configured = supabaseConfigured()
  const q = useQuery({
    queryKey: ['public-properties'],
    queryFn: loadFeatured,
    enabled: configured,
  })

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-hero-grid bg-grid-size opacity-35" aria-hidden />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 md:flex-row md:items-center md:py-24">
          <FadeIn className="flex-1 space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-200">
              <Sparkles className="h-3.5 w-3.5" /> Kenyan homes, curated signal
            </p>
            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
              Trace what&apos;s <span className="text-gradient">available</span>.
              <br />
              We place you on the map.
            </h1>
            <p className="max-w-xl text-lg text-zinc-400">
              Browse real listings with <strong className="text-zinc-200">prices and broad locations</strong>.
              Exact pins and owner lines stay with our team — you call <strong>HomeTrace</strong> and we unlock
              the next step.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/browse"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-3 text-sm font-semibold text-trace-dusk shadow-lg shadow-cyan-500/25 hover:opacity-90 hover:scale-[1.02] transition-all"
              >
                Browse homes <ArrowRight className="h-4 w-4" />
              </Link>
              {env.publicPhone && (
                <a
                  href={`tel:${env.publicPhone.replace(/\s/g, '')}`}
                  className="rounded-xl border border-white/15 px-5 py-3 text-sm font-medium text-white hover:bg-white/5 transition-colors"
                >
                  Call {env.publicPhone}
                </a>
              )}
            </div>
          </FadeIn>
          <FadeIn delay={150} className="glass-card flex-1 p-6 md:max-w-md">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-8 w-8 text-violet-300" />
              <div className="space-y-2 text-sm text-zinc-400">
                <p className="font-display font-semibold text-white">Privacy by design</p>
                <p>
                  Visitors never see rooftop-accurate pins. Admins ingest coordinates for internal routing —
                  customer maps stay high-level until you dial in.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <FadeIn>
          <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">Featured availability</h2>
              <p className="text-sm text-zinc-500 mt-1">Published &amp; verified for public view · wide-area context only</p>
            </div>
            <Link to="/browse" className="text-sm text-cyan-300 hover:underline inline-flex items-center gap-1">
              See all listings <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </FadeIn>

        {!configured && (
          <div className="glass-card rounded-2xl p-8 text-center text-zinc-400">
            <p>Copy <code className="text-cyan-200">.env.example</code> to <code className="text-cyan-200">.env</code> and add Supabase keys to load live listings.</p>
          </div>
        )}

        {configured && q.isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <FadeIn key={i} delay={i * 100}>
                <SkeletonCard />
              </FadeIn>
            ))}
          </div>
        )}
        {configured && q.error && (
          <p className="text-red-400 text-center py-12">{(q.error as Error).message}</p>
        )}
        {configured && q.data && q.data.length === 0 && (
          <p className="text-zinc-500 text-center py-12">No published listings yet. Admins can add homes from /admin.</p>
        )}
        {configured && q.data && q.data.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {q.data.map((p, i) => (
              <FadeIn key={p.id} delay={i * 80}>
                <PropertyCard property={p} />
              </FadeIn>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
