import { useQuery } from '@tanstack/react-query'
import { AdminMap } from '../../components/admin/AdminMap'
import { supabase } from '../../lib/supabase'
import type { DbProperty } from '../../types/property'

async function adminLoad(): Promise<DbProperty[]> {
  if (!supabase) throw new Error('Missing Supabase client')
  const { data, error } = await supabase.from('properties').select('*')
  if (error) throw error
  return data as DbProperty[]
}

export function AdminMapPage() {
  const q = useQuery({ queryKey: ['admin-properties-map'], queryFn: adminLoad })

  if (q.isLoading) return <p className="text-zinc-500">Hydrating raster...</p>
  if (q.error) return <p className="text-red-400">{(q.error as Error).message}</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Operations map</h1>
        <p className="text-sm text-zinc-500 mt-2 max-w-xl">
          CARTO Voyager basemap • internal coordinates only • never surfaced on public URLs.
        </p>
      </div>
      <AdminMap properties={q.data ?? []} />
    </div>
  )
}
