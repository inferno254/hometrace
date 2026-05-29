import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapPinned, TrendingUp, Home, DollarSign, Shield, Bus, School, Hospital, ShoppingBag } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { PublicPropertyRow } from '../types/property'

type Props = {
  properties: PublicPropertyRow[]
  targetCounty?: string
  targetTown?: string
}

type NairobiArea = {
  id: string
  town: string
  area_label: string | null
  estate: string
  typical_rent_min: number | null
  typical_rent_max: number | null
  security_rating: string | null
  transport_notes: string | null
  amenities_nearby: string[] | null
  schools_nearby: string[] | null
  hospitals_nearby: string[] | null
  shopping_nearby: string[] | null
}

function RatingBadge({ rating }: { rating: string | null }) {
  if (!rating) return null
  const colors: Record<string, string> = {
    low: 'bg-red-400/15 text-red-300 border-red-400/30',
    medium: 'bg-amber-400/15 text-amber-200 border-amber-400/30',
    high: 'bg-cyan-400/15 text-cyan-200 border-cyan-400/30',
    premium: 'bg-violet-400/15 text-violet-200 border-violet-400/30',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${colors[rating] || 'bg-white/5 text-zinc-400 border-white/10'}`}>
      <Shield className="h-3 w-3" />
      {rating}
    </span>
  )
}

export function AreaInsights({ properties, targetCounty, targetTown }: Props) {
  const { data: areas } = useQuery({
    queryKey: ['nairobi-areas', targetTown],
    queryFn: async () => {
      if (!supabase) return [] as NairobiArea[]
      let q = supabase.from('nairobi_areas').select('*')
      if (targetTown) q = q.ilike('town', targetTown)
      if (targetCounty && !targetTown) q = q.ilike('county', targetCounty)
      const { data } = await q.limit(10)
      return (data ?? []) as NairobiArea[]
    },
    enabled: Boolean(supabase),
  })

  const stats = useMemo(() => {
    const filtered = properties.filter((p) => {
      if (targetCounty && p.county !== targetCounty) return false
      if (targetTown && p.town !== targetTown) return false
      return true
    })

    if (filtered.length < 2 && (!areas || areas.length === 0)) return null

    const rentalPrices = filtered
      .filter((p) => p.price_type === 'monthly' && p.price > 0)
      .map((p) => Number(p.price))
    const salePrices = filtered
      .filter((p) => p.price_type === 'sale' && p.price > 0)
      .map((p) => Number(p.price))

    const avgRent = rentalPrices.length
      ? Math.round(rentalPrices.reduce((a, b) => a + b, 0) / rentalPrices.length)
      : null
    const avgSale = salePrices.length
      ? Math.round(salePrices.reduce((a, b) => a + b, 0) / salePrices.length)
      : null

    const typeCount: Record<string, number> = {}
    filtered.forEach((p) => {
      typeCount[p.property_type] = (typeCount[p.property_type] || 0) + 1
    })
    const topTypes = Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

    return {
      total: filtered.length,
      avgRent,
      avgSale,
      topTypes,
      furnished: filtered.filter((p) => p.furnished).length,
    }
  }, [properties, targetCounty, targetTown, areas])

  if (!stats && (!areas || areas.length === 0)) return null

  return (
    <div className="space-y-4">
      {/* Price stats */}
      {stats && (
        <div className="glass-card rounded-xl p-4 space-y-3">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <MapPinned className="h-3.5 w-3.5 text-trace-violet" />
            Area insights
            {targetTown && <span className="text-zinc-600 normal-case">· {targetTown}</span>}
            {targetCounty && !targetTown && <span className="text-zinc-600 normal-case">· {targetCounty}</span>}
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                <Home className="h-3 w-3" /> Listings
              </div>
              <p className="font-semibold text-white">{stats.total}</p>
            </div>
            {stats.avgRent && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                  <DollarSign className="h-3 w-3" /> Avg. rent
                </div>
                <p className="font-semibold text-cyan-300">KSh {stats.avgRent.toLocaleString()}</p>
              </div>
            )}
            {stats.avgSale && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                  <TrendingUp className="h-3 w-3" /> Avg. sale
                </div>
                <p className="font-semibold text-violet-300">KSh {stats.avgSale.toLocaleString()}</p>
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                <Home className="h-3 w-3" /> Top types
              </div>
              <div className="flex flex-wrap gap-1">
                {stats.topTypes.map(([type, count]) => (
                  <span key={type} className="text-xs text-zinc-400 bg-white/5 rounded px-1.5 py-0.5 capitalize">
                    {type} {count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nairobi area context cards */}
      {areas && areas.length > 0 && areas.map((area) => (
        <div key={area.id} className="glass-card rounded-xl p-4 space-y-3">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <MapPinned className="h-3.5 w-3.5 text-trace-violet" />
            {area.estate}
            {area.area_label && <span className="text-zinc-600 normal-case">· {area.area_label}</span>}
          </h4>

          <div className="flex flex-wrap items-center gap-2">
            <RatingBadge rating={area.security_rating} />
            {area.typical_rent_min && area.typical_rent_max && (
              <span className="text-[10px] text-zinc-400 bg-white/5 rounded px-1.5 py-0.5">
                Rent range: KSh {area.typical_rent_min.toLocaleString()} – {area.typical_rent_max.toLocaleString()}
              </span>
            )}
          </div>

          {area.transport_notes && (
            <div className="flex items-start gap-2 text-xs text-zinc-400">
              <Bus className="h-3.5 w-3.5 mt-0.5 shrink-0 text-cyan-400" />
              <span>{area.transport_notes}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs">
            {area.schools_nearby && area.schools_nearby.length > 0 && (
              <div className="space-y-1">
                <span className="flex items-center gap-1 text-zinc-500 font-medium">
                  <School className="h-3 w-3" /> Schools
                </span>
                <ul className="space-y-0.5">
                  {area.schools_nearby.slice(0, 3).map((s) => (
                    <li key={s} className="text-zinc-400">· {s}</li>
                  ))}
                  {area.schools_nearby.length > 3 && (
                    <li className="text-zinc-600">+{area.schools_nearby.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}

            {area.hospitals_nearby && area.hospitals_nearby.length > 0 && (
              <div className="space-y-1">
                <span className="flex items-center gap-1 text-zinc-500 font-medium">
                  <Hospital className="h-3 w-3" /> Hospitals
                </span>
                <ul className="space-y-0.5">
                  {area.hospitals_nearby.slice(0, 3).map((h) => (
                    <li key={h} className="text-zinc-400">· {h}</li>
                  ))}
                  {area.hospitals_nearby.length > 3 && (
                    <li className="text-zinc-600">+{area.hospitals_nearby.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}

            {area.shopping_nearby && area.shopping_nearby.length > 0 && (
              <div className="space-y-1">
                <span className="flex items-center gap-1 text-zinc-500 font-medium">
                  <ShoppingBag className="h-3 w-3" /> Shopping
                </span>
                <ul className="space-y-0.5">
                  {area.shopping_nearby.slice(0, 3).map((s) => (
                    <li key={s} className="text-zinc-400">· {s}</li>
                  ))}
                  {area.shopping_nearby.length > 3 && (
                    <li className="text-zinc-600">+{area.shopping_nearby.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}

            {area.amenities_nearby && area.amenities_nearby.length > 0 && (
              <div className="space-y-1">
                <span className="flex items-center gap-1 text-zinc-500 font-medium">
                  <Home className="h-3 w-3" /> Amenities
                </span>
                <div className="flex flex-wrap gap-1">
                  {area.amenities_nearby.slice(0, 4).map((a) => (
                    <span key={a} className="text-[10px] text-zinc-400 bg-white/5 rounded px-1.5 py-0.5">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}