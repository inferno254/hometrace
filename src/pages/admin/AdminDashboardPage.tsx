import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Edit3, Trash2, Search, X, Check, EyeOff, Phone } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../components/Toast'
import type { DbProperty, ListingQuality } from '../../types/property'

async function adminLoad(): Promise<DbProperty[]> {
  if (!supabase) throw new Error('Missing Supabase client')
  const { data, error } = await supabase.from('properties').select('*').order('updated_at', { ascending: false })
  if (error) throw error
  return data as DbProperty[]
}

async function fetchInquiries(): Promise<number> {
  if (!supabase) return 0
  const { count } = await supabase.from('property_inquiries').select('*', { count: 'exact', head: true })
  return count ?? 0
}

function calcQuality(p: DbProperty): ListingQuality {
  const fields: [string, unknown][] = [
    ['Title', p.title],
    ['Price', p.price && p.price > 0],
    ['Bedrooms', p.bedrooms != null],
    ['Bathrooms', p.bathrooms != null],
    ['County', p.county],
    ['Town', p.town],
    ['Description', p.description],
    ['Cover image', p.cover_image_url],
    ['Lat/Lng', p.latitude != null && p.longitude != null],
    ['Estate', p.estate],
    ['Owner phone', p.owner_phone],
    ['Size', p.size_sqm],
  ]
  const filled = fields.filter(([, v]) => Boolean(v)).length
  const missing = fields.filter(([, v]) => !Boolean(v)).map(([k]) => k)
  return { completeness: Math.round((filled / fields.length) * 100), missing }
}

export function AdminDashboardPage() {
  const q = useQuery({ queryKey: ['admin-properties'], queryFn: adminLoad })
  const inqQ = useQuery({ queryKey: ['admin-inquiry-count'], queryFn: fetchInquiries })
  const qc = useQueryClient()
  const { toast } = useToast()
  const [searchText, setSearchText] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const rows = (q.data ?? []).filter((r) => {
    if (!searchText.trim()) return true
    const st = searchText.toLowerCase()
    return (
      r.title?.toLowerCase().includes(st) ||
      r.listing_reference?.toLowerCase().includes(st) ||
      r.town?.toLowerCase().includes(st) ||
      r.county?.toLowerCase().includes(st) ||
      r.estate?.toLowerCase().includes(st)
    )
  })

  const published = rows.filter((r) => r.is_published).length
  const drafts = rows.length - published
  const geocoded = rows.filter((r) => r.latitude != null && r.longitude != null).length
  const avgQuality = rows.length
    ? Math.round(rows.reduce((s, r) => s + calcQuality(r).completeness, 0) / rows.length)
    : 0

  const confirmDelete = async (id: string) => {
    if (!supabase) return
    if (!window.confirm('Delete this property permanently? This cannot be undone.')) return
    setDeleting(id)
    try {
      const { error: imgErr } = await supabase.from('property_images').delete().eq('property_id', id)
      if (imgErr) throw imgErr
      const { error: amenErr } = await supabase.from('amenities').delete().eq('property_id', id)
      if (amenErr) throw amenErr
      const { error } = await supabase.from('properties').delete().eq('id', id)
      if (error) throw error
      toast('Property deleted', 'success')
      qc.invalidateQueries({ queryKey: ['admin-properties'] })
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setDeleting(null)
    }
  }

  const togglePublished = async (id: string, current: boolean) => {
    if (!supabase) return
    setToggling(id)
    try {
      const { error } = await supabase.from('properties').update({ is_published: !current }).eq('id', id)
      if (error) throw error
      toast(current ? 'Unpublished' : 'Published', 'success')
      qc.invalidateQueries({ queryKey: ['admin-properties'] })
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setToggling(null)
    }
  }

  if (q.isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-5">
              <div className="skeleton h-3 w-20 mb-3" />
              <div className="skeleton h-9 w-16" />
            </div>
          ))}
        </div>
        <div className="skeleton h-[300px] w-full rounded-2xl" />
      </div>
    )
  }

  if (q.error) return <p className="text-red-400">{(q.error as Error).message}</p>

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-4">
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
          <p className="text-xs text-zinc-600 mt-1">Add lat/lng to appear on map</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Listing quality</p>
          <p className="font-display text-4xl font-bold text-amber-300 mt-2">{avgQuality}%</p>
          <p className="text-xs text-zinc-600 mt-1">{inqQ.data ?? 0} inquiries received</p>
        </div>
      </div>

      {inqQ.data && inqQ.data > 0 && (
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-cyan-400" />
              <span className="text-zinc-300"><strong className="text-white">{inqQ.data}</strong> inquiry{inqQ.data !== 1 ? 'ies' : 'y'} received</span>
            </div>
            <Link to="/admin/inquiries" className="text-xs text-cyan-300 hover:underline">View all</Link>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            className="w-full rounded-xl border border-white/10 bg-black/30 pl-9 pr-8 py-2 text-sm text-white placeholder:text-zinc-600"
            placeholder="Search listings..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {searchText && (
            <button onClick={() => setSearchText('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Link
          to="/admin/new"
          className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-xs font-semibold text-trace-dusk hover:opacity-90 transition-opacity"
        >
          + Add property
        </Link>
      </div>

      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.04] text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="p-4">Reference</th>
                <th className="p-4">Title</th>
                <th className="p-4 hidden md:table-cell">Location</th>
                <th className="p-4">Status</th>
                <th className="p-4 hidden md:table-cell">Quality</th>
                <th className="p-4 hidden lg:table-cell">Pins</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((r) => {
                const quality = calcQuality(r)
                return (
                  <tr key={r.id} className="text-zinc-300 hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-mono text-xs text-cyan-300">{r.listing_reference}</td>
                    <td className="p-4 text-white max-w-[200px] truncate">{r.title}</td>
                    <td className="p-4 text-xs hidden md:table-cell">
                      {[r.estate, r.town, r.county].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="p-4 text-xs whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => togglePublished(r.id, r.is_published)}
                          disabled={toggling === r.id}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                            r.is_published
                              ? 'bg-green-400/15 text-green-400 hover:bg-green-400/25'
                              : 'bg-amber-400/15 text-amber-300 hover:bg-amber-400/25'
                          }`}
                        >
                          {r.is_published ? <Check className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          {r.is_published ? 'Published' : 'Draft'}
                        </button>
                        {!r.is_available && <span className="text-red-400">Unavail.</span>}
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-trace-line overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              quality.completeness >= 80 ? 'bg-green-400' : quality.completeness >= 50 ? 'bg-amber-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${quality.completeness}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-zinc-500">{quality.completeness}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs hidden lg:table-cell">
                      {r.latitude != null ? `${Number(r.latitude).toFixed(3)}, ${Number(r.longitude ?? 0).toFixed(3)}` : '—'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/admin/edit/${r.id}`}
                          className="rounded-lg p-1.5 text-zinc-500 hover:text-cyan-300 hover:bg-white/5 transition-all"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => confirmDelete(r.id)}
                          disabled={deleting === r.id}
                          className="rounded-lg p-1.5 text-zinc-500 hover:text-red-400 hover:bg-white/5 transition-all disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-600">
                    {searchText ? 'No listings match your search.' : 'No listings yet. Add one!'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
