import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Phone, ChevronLeft, MapPinned, Image as ImageIcon, Calculator, Check } from 'lucide-react'
import { usePageMeta } from '../lib/seo'
import { supabase } from '../lib/supabase'
import { env, supabaseConfigured } from '../lib/env'
import { ImageCarousel } from '../components/ImageCarousel'
import { FadeIn } from '../components/FadeIn'
import { SaveButton } from '../components/SaveButton'
import { ShareButton } from '../components/ShareButton'
import { BudgetCalculator } from '../components/BudgetCalculator'
import { InquiryForm } from '../components/InquiryForm'
import { AreaInsights } from '../components/AreaInsights'
import { useFavorites } from '../hooks/useFavorites'
import type { PublicPropertyRow } from '../types/property'

async function loadOne(id: string): Promise<PublicPropertyRow | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('fetch_public_property', { target_id: id })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  return (row as PublicPropertyRow) ?? null
}

async function loadAll(): Promise<PublicPropertyRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('fetch_public_properties')
  if (error) throw error
  return (data ?? []) as PublicPropertyRow[]
}

function formatPrice(p: PublicPropertyRow) {
  const n = Number(p.price)
  const formatted = Number.isFinite(n) ? `KSh ${n.toLocaleString()}` : 'Price on request'
  if (p.price_type === 'sale') return `${formatted} · sale`
  if (p.price_type === 'negotiable') return `${formatted}+ · negotiable`
  return `${formatted} · /mo`
}

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const configured = supabaseConfigured()
  const [carouselOpen, setCarouselOpen] = useState(false)
  const [showCalc, setShowCalc] = useState(false)
  const { isFavorite, toggle: toggleFav } = useFavorites()

  const q = useQuery({
    queryKey: ['public-property', id],
    queryFn: () => loadOne(id!),
    enabled: Boolean(configured && id),
  })

  const allQuery = useQuery({
    queryKey: ['public-properties-all'],
    queryFn: loadAll,
    enabled: configured,
  })

  usePageMeta(
    q.data?.title ?? 'Loading...',
    q.data ? `${q.data.bedrooms ?? '?'} bed · ${q.data.bathrooms ?? '?'} bath · KSh ${Number(q.data.price).toLocaleString()} · ${q.data.town}, ${q.data.county}` : undefined,
    q.data?.image_urls?.[0] ?? undefined,
  )

  if (!id) return null

  const imgCount = q.data?.image_urls?.length ?? 0

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <FadeIn>
        <Link to="/browse" className="mb-6 inline-flex items-center gap-1 text-sm text-cyan-300 hover:underline">
          <ChevronLeft className="h-4 w-4" /> Back to browse
        </Link>
      </FadeIn>

      {!configured && <p className="text-zinc-500">Supabase not configured.</p>}
      {q.isLoading && (
        <div className="glass-card overflow-hidden">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="skeleton aspect-[4/3]" />
            <div className="space-y-4 p-6 md:p-8">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-8 w-3/4" />
              <div className="skeleton h-6 w-1/2" />
              <div className="skeleton h-4 w-2/3" />
              <div className="flex gap-2"><div className="skeleton h-6 w-16" /><div className="skeleton h-6 w-16" /></div>
            </div>
          </div>
        </div>
      )}
      {q.error && <p className="text-red-400">{(q.error as Error).message}</p>}
      {q.data === null && !q.isLoading && <p className="text-zinc-500">Listing not found or not published.</p>}

      {q.data && (
        <>
          <FadeIn>
            <article className="glass-card overflow-hidden">
              <div className="grid gap-0 md:grid-cols-2">
                <div className="relative aspect-[4/3] bg-trace-line group">
                  {q.data.image_urls && q.data.image_urls[0] ? (
                    <>
                      <img
                        src={q.data.image_urls[0]}
                        alt=""
                        className="h-full w-full object-cover cursor-pointer"
                        onClick={() => setCarouselOpen(true)}
                      />
                      <button
                        onClick={() => setCarouselOpen(true)}
                        className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        {imgCount} photo{imgCount > 1 ? 's' : ''}
                      </button>
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-600">No images</div>
                  )}
                </div>
                <div className="flex flex-col justify-center gap-4 p-6 md:p-8">
                  <p className="text-xs font-semibold uppercase tracking-widest text-violet-300">
                    {q.data.listing_reference}
                  </p>
                  <h1 className="font-display text-2xl font-bold text-white md:text-3xl">{q.data.title}</h1>
                  <p className="text-xl font-semibold text-trace-cyan">{formatPrice(q.data)}</p>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><span className="text-zinc-400">{q.data.bedrooms ?? '?'}</span> bed</span>
                    <span className="text-zinc-600">·</span>
                    <span className="flex items-center gap-1"><span className="text-zinc-400">{q.data.bathrooms ?? '?'}</span> bath</span>
                    <span className="text-zinc-600">·</span>
                    <span className="capitalize text-zinc-400">{q.data.property_type}</span>
                    {q.data.furnished != null && (
                      <>
                        <span className="text-zinc-600">·</span>
                        <span className={q.data.furnished ? 'text-cyan-300' : 'text-zinc-500'}>
                          {q.data.furnished ? 'Furnished' : 'Unfurnished'}
                        </span>
                      </>
                    )}
                    {q.data.size_sqm && (
                      <>
                        <span className="text-zinc-600">·</span>
                        <span>{q.data.size_sqm} m²</span>
                      </>
                    )}
                  </div>

                  <p className="flex items-start gap-2 text-sm text-zinc-400">
                    <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-trace-violet" />
                    <span>
                      <span className="text-zinc-200">
                        {[q.data.town, q.data.county].filter(Boolean).join(' · ')}
                      </span>
                      {q.data.area_label && (
                        <> · <span className="italic text-zinc-500">{q.data.area_label} corridor</span></>
                      )}
                      <span className="block text-[11px] text-zinc-600 mt-1">
                        Street-level pins are withheld. Call HomeTrace for placement &amp; verified viewing slots.
                      </span>
                    </span>
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <SaveButton id={id} isFavorite={isFavorite(id)} onToggle={toggleFav} />
                    <ShareButton url={`/listing/${id}`} title={q.data.title} />
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row pt-2">
                    {env.publicPhone && (
                      <a
                        href={`tel:${env.publicPhone.replace(/\s/g, '')}`}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-3 text-sm font-bold text-trace-dusk hover:opacity-90 transition-opacity"
                      >
                        <Phone className="h-4 w-4" /> Call HomeTrace
                      </a>
                    )}
                    <button
                      onClick={() => setShowCalc(true)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white hover:bg-white/5 transition-colors"
                    >
                      <Calculator className="h-4 w-4" /> Budget check
                    </button>
                  </div>
                </div>
              </div>

              {(q.data.amenity_names?.length ?? 0) > 0 && (
                <div className="border-t border-white/10 p-6 md:p-8">
                  <h2 className="font-display text-sm font-semibold text-white mb-3">Amenity signal</h2>
                  <ul className="flex flex-wrap gap-2">
                    {q.data.amenity_names!.map((a) => (
                      <li key={a} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">
                        <Check className="h-3 w-3 inline mr-1 text-cyan-400" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(q.data.description || q.data.ai_generated_description) && (
                <div className="border-t border-white/10 p-6 md:p-8 space-y-4 text-sm leading-relaxed text-zinc-400">
                  {q.data.description && (
                    <div>
                      <h2 className="font-display text-sm font-semibold text-white mb-2">About</h2>
                      <p className="whitespace-pre-wrap">{q.data.description}</p>
                    </div>
                  )}
                  {q.data.ai_generated_description && (
                    <div>
                      <h2 className="font-display text-sm font-semibold text-white mb-2">Draft narrative</h2>
                      <p className="whitespace-pre-wrap text-zinc-500">{q.data.ai_generated_description}</p>
                    </div>
                  )}
                </div>
              )}
            </article>
          </FadeIn>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <FadeIn>
              <InquiryForm propertyId={id} listingRef={q.data.listing_reference ?? 'HT'} />
            </FadeIn>
            <FadeIn delay={100}>
              {allQuery.data && (
                <AreaInsights
                  properties={allQuery.data}
                  targetCounty={q.data.county}
                  targetTown={q.data.town}
                />
              )}
            </FadeIn>
          </div>
        </>
      )}

      {carouselOpen && q.data?.image_urls && (
        <ImageCarousel images={q.data.image_urls} onClose={() => setCarouselOpen(false)} />
      )}

      {showCalc && <BudgetCalculator onClose={() => setShowCalc(false)} />}
    </div>
  )
}
