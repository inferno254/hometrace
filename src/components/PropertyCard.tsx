import { Link } from 'react-router-dom'
import { Bath, Bed, Building2, MapPinned } from 'lucide-react'
import type { PublicPropertyRow } from '../types/property'

type Props = { property: PublicPropertyRow }

function formatPrice(p: PublicPropertyRow) {
  const n = Number(p.price)
  const formatted = Number.isFinite(n) ? `KSh ${n.toLocaleString()}` : 'Price on request'
  if (p.price_type === 'sale') return `${formatted} · sale`
  if (p.price_type === 'negotiable') return `${formatted}+ · negotiable`
  return `${formatted} · /mo`
}

export function PropertyCard({ property: p }: Props) {
  const img =
    (p.cover_image_url && String(p.cover_image_url)) ||
    (p.image_urls && p.image_urls[0]) ||
    null

  const areaLine = [p.town, p.county].filter(Boolean).join(' · ')
  const fuzz = p.area_label ? `${p.area_label} area` : 'Broad location only'

  return (
    <Link
      to={`/listing/${p.id}`}
      className="group glass-card block overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 hover:border-trace-violet/40"
    >
      <div className="relative aspect-[5/3] overflow-hidden bg-trace-line">
        {img ? (
          <img
            src={img}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-600 text-sm">No photo yet</div>
        )}
        <div className="absolute left-3 top-3 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-200 ring-1 ring-cyan-400/30">
          {p.listing_reference ?? 'HT'}
        </div>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="font-display text-lg font-semibold text-white group-hover:text-trace-cyan transition-colors line-clamp-2">
          {p.title}
        </h3>
        <p className="text-sm text-trace-cyan font-medium">{formatPrice(p)}</p>
        <p className="flex items-center gap-1.5 text-xs text-zinc-400">
          <MapPinned className="h-3.5 w-3.5 shrink-0 text-trace-violet" />
          <span>
            {areaLine || 'Kenya'} — <span className="text-zinc-500">{fuzz}</span>
          </span>
        </p>
        <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
          {p.bedrooms != null && (
            <span className="inline-flex items-center gap-1">
              <Bed className="h-3.5 w-3.5" /> {p.bedrooms} bed
            </span>
          )}
          {p.bathrooms != null && (
            <span className="inline-flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" /> {p.bathrooms} bath
            </span>
          )}
          <span className="inline-flex items-center gap-1 capitalize">
            <Building2 className="h-3.5 w-3.5" /> {p.property_type}
          </span>
        </div>
      </div>
    </Link>
  )
}
