import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Phone, ChevronLeft, MapPinned } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { env, supabaseConfigured } from '../lib/env'
import type { PublicPropertyRow } from '../types/property'

async function loadOne(id: string): Promise<PublicPropertyRow | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('fetch_public_property', { target_id: id })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  return (row as PublicPropertyRow) ?? null
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

  const q = useQuery({
    queryKey: ['public-property', id],
    queryFn: () => loadOne(id!),
    enabled: Boolean(configured && id),
  })

  if (!id) return null

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/browse" className="mb-6 inline-flex items-center gap-1 text-sm text-cyan-300 hover:underline">
        <ChevronLeft className="h-4 w-4" /> Back to browse
      </Link>

      {!configured && <p className="text-zinc-500">Supabase not configured.</p>}
      {q.isLoading && <p className="text-zinc-500">Loading...</p>}
      {q.error && <p className="text-red-400">{(q.error as Error).message}</p>}
      {q.data === null && !q.isLoading && <p className="text-zinc-500">Listing not found or not published.</p>}

      {q.data && (
        <article className="glass-card overflow-hidden">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="relative aspect-[4/3] bg-trace-line">
              {q.data.image_urls && q.data.image_urls[0] ? (
                <img src={q.data.image_urls[0]} alt="" className="h-full w-full object-cover" />
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
              <p className="flex items-start gap-2 text-sm text-zinc-400">
                <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-trace-violet" />
                <span>
                  <span className="text-zinc-200">
                    {[q.data.town, q.data.county].filter(Boolean).join(' · ')}
                  </span>
                  {q.data.area_label && (
                    <>
                      {' '}
                      · <span className="italic text-zinc-500">{q.data.area_label} corridor</span>
                    </>
                  )}
                  <span className="block text-[11px] text-zinc-600 mt-1">
                    Street-level pins are withheld. Call HomeTrace for placement &amp; verified viewing slots.
                  </span>
                </span>
              </p>
              <div className="flex flex-wrap gap-2 text-xs capitalize text-zinc-300">
                {q.data.bedrooms != null && <span className="rounded-full bg-white/10 px-2 py-1">{q.data.bedrooms} bed</span>}
                {q.data.bathrooms != null && (
                  <span className="rounded-full bg-white/10 px-2 py-1">{q.data.bathrooms} bath</span>
                )}
                <span className="rounded-full bg-white/10 px-2 py-1">{q.data.property_type}</span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row pt-2">
                {env.publicPhone && (
                  <a
                    href={`tel:${env.publicPhone.replace(/\s/g, '')}`}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-3 text-sm font-bold text-trace-dusk"
                  >
                    <Phone className="h-4 w-4" /> Call HomeTrace
                  </a>
                )}
                {env.whatsappUrl && env.whatsappUrl !== '#' && (
                  <a
                    href={env.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white hover:bg-white/5"
                  >
                    WhatsApp us
                  </a>
                )}
              </div>
            </div>
          </div>

          {(q.data.amenity_names?.length ?? 0) > 0 && (
            <div className="border-t border-white/10 p-6 md:p-8">
              <h2 className="font-display text-sm font-semibold text-white mb-3">Amenity signal</h2>
              <ul className="flex flex-wrap gap-2">
                {q.data.amenity_names!.map((a) => (
                  <li key={a} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">
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
      )}
    </div>
  )
}
