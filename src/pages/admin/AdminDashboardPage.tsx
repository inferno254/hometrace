import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { DbProperty } from '../../types/property'

async function adminLoad(): Promise<DbProperty[]> {
  if (!supabase) throw new Error('Missing Supabase client')
  const { data, error } = await supabase.from('properties').select('*').order('updated_at', { ascending: false })
  if (error) throw error
  return data as DbProperty[]
}

export function AdminDashboardPage() {
  const q = useQuery({ queryKey: ['admin-properties'], queryFn: adminLoad })

  if (q.isLoading) return <p className="text-zinc-500">Pulling dossier...</p>
  if (q.error) return <p className="text-red-400">{(q.error as Error).message}</p>

  const rows = q.data ?? []
  const published = rows.filter((r) => r.is_published).length
  const drafts = rows.length - published
  const geocoded = rows.filter((r) => r.latitude != null && r.longitude != null).length

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-card p-5">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Total pipeline</p>
          <p className="font-display text-4xl font-bold text-white mt-2">{rows.length}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Live blurbs</p>
          <p className="font-display text-4xl font-bold text-cyan-300 mt-2">{published}</p>
          <p className="text-xs text-zinc-600 mt-1">{drafts} unpublished</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Pins on admin map</p>
          <p className="font-display text-4xl font-bold text-violet-300 mt-2">{geocoded}</p>
          <p className="text-xs text-zinc-600 mt-1">Add lat/lng to appear on Voyager tiles</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.04] text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="p-4">Reference</th>
              <th className="p-4">Title</th>
              <th className="p-4">Location (internal)</th>
              <th className="p-4">Status</th>
              <th className="p-4">Pins</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((r) => (
              <tr key={r.id} className="text-zinc-300">
                <td className="p-4 font-mono text-xs text-cyan-300">{r.listing_reference}</td>
                <td className="p-4 text-white">{r.title}</td>
                <td className="p-4 text-xs">
                  {[r.estate, r.town, r.county].filter(Boolean).join(' · ') || '—'}
                </td>
                <td className="p-4 text-xs">
                  {r.is_published ? <span className="text-green-400">Published</span> : <span className="text-amber-300">Draft</span>}
                  {!r.is_available && <span className="ml-2 text-red-400">Unavailable</span>}
                </td>
                <td className="p-4 text-xs">
                  {r.latitude != null ? `${Number(r.latitude).toFixed(3)}, ${Number(r.longitude ?? 0).toFixed(3)}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
