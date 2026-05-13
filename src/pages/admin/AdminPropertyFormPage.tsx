import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { generateHouseDescription } from '../../lib/gemini'

const AMENITIES = ['WiFi', 'Parking', 'Water 24/7', 'Electricity', 'Security', 'CCTV', 'Gym', 'Backup Generator']

type FormShape = {
  title: string
  description: string
  price: string
  price_type: string
  bedrooms: string
  bathrooms: string
  property_type: string
  county: string
  town: string
  area_label: string
  estate: string
  address: string
  latitude: string
  longitude: string
  owner_phone: string
  is_available: boolean
  is_published: boolean
  amenities: string[]
}

export function AdminPropertyFormPage() {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [form, setForm] = useState<FormShape>({
    title: '',
    description: '',
    price: '',
    price_type: 'monthly',
    bedrooms: '',
    bathrooms: '',
    property_type: 'apartment',
    county: '',
    town: '',
    area_label: '',
    estate: '',
    address: '',
    latitude: '',
    longitude: '',
    owner_phone: '',
    is_available: true,
    is_published: false,
    amenities: [],
  })
  const [files, setFiles] = useState<FileList | null>(null)
  const [aiText, setAiText] = useState('')

  const toggleAmenity = (a: string) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }))
  }

  const runGemini = async () => {
    setAiBusy(true)
    setNote(null)
    try {
      const text = await generateHouseDescription({
        property_type: form.property_type,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        county: form.county,
        town: form.town,
        area_label: form.area_label || null,
        price: Number(form.price) || 0,
        price_type: form.price_type,
        amenities: form.amenities,
      })
      setAiText(text)
    } catch (e) {
      setNote((e as Error).message)
    } finally {
      setAiBusy(false)
    }
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setNote(null)
    if (!supabase) return
    setBusy(true)
    try {
      const row = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        ai_generated_description: aiText || null,
        price: Number(form.price),
        price_type: form.price_type,
        bedrooms: form.bedrooms === '' ? null : Number(form.bedrooms),
        bathrooms: form.bathrooms === '' ? null : Number(form.bathrooms),
        property_type: form.property_type,
        county: form.county.trim(),
        town: form.town.trim(),
        area_label: form.area_label.trim() || null,
        estate: form.estate.trim() || null,
        address: form.address.trim() || null,
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
        owner_phone: form.owner_phone.trim() || null,
        is_available: form.is_available,
        is_published: form.is_published,
        cover_image_url: null as string | null,
      }

      if (!row.title || !Number.isFinite(row.price)) {
        setNote('Title and numeric price required.')
        setBusy(false)
        return
      }

      const { data: prop, error: pe } = await supabase.from('properties').insert(row).select('id').single()
      if (pe || !prop) throw pe ?? new Error('Insert failed')

      const pid = prop.id as string

      const uploadedUrls: string[] = []
      if (files?.length) {
        for (const file of Array.from(files)) {
          const path = `${pid}/${crypto.randomUUID()}-${file.name.replace(/\s+/g, '_')}`
          const { error: upErr } = await supabase.storage.from('property-images').upload(path, file)
          if (upErr) throw upErr
          const { data: pub } = supabase.storage.from('property-images').getPublicUrl(path)
          uploadedUrls.push(pub.publicUrl)
        }
      }

      if (uploadedUrls.length > 0) {
        await supabase.from('property_images').insert(
          uploadedUrls.map((image_url, i) => ({
            property_id: pid,
            image_url,
            is_cover: i === 0,
            sort_order: i,
          })),
        )
        await supabase.from('properties').update({ cover_image_url: uploadedUrls[0] }).eq('id', pid)
      }

      if (form.amenities.length) {
        await supabase.from('amenities').insert(
          form.amenities.map((name) => ({
            property_id: pid,
            name,
          })),
        )
      }

      navigate('/admin')
    } catch (err) {
      setNote((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Ingress a listing</h1>
        <p className="text-sm text-zinc-500 mt-2">
          Public cards show only county / town / area_label. Estate, address, coords &amp; owner phone stay admin-only.
        </p>
      </div>

      <form onSubmit={onSubmit} className="glass-card space-y-4 p-6">
        <input
          className="input-ht"
          placeholder="Marketing title"
          value={form.title}
          required
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            type="number"
            className="input-ht"
            placeholder="Price (KSh)"
            required
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <select
            className="input-ht"
            value={form.price_type}
            onChange={(e) => setForm({ ...form, price_type: e.target.value })}
          >
            <option value="monthly">Monthly rent</option>
            <option value="sale">Sale</option>
            <option value="negotiable">Negotiable anchor</option>
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            className="input-ht"
            placeholder="Bedrooms"
            type="number"
            value={form.bedrooms}
            onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
          />
          <input
            className="input-ht"
            placeholder="Bathrooms"
            type="number"
            value={form.bathrooms}
            onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
          />
        </div>

        <select
          className="input-ht capitalize"
          value={form.property_type}
          onChange={(e) => setForm({ ...form, property_type: e.target.value })}
        >
          {['apartment', 'bedsitter', 'bungalow', 'maisonette', 'studio', 'townhouse', 'land', 'commercial'].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <div className="grid gap-4 sm:grid-cols-3">
          <input
            className="input-ht"
            placeholder="County"
            required
            value={form.county}
            onChange={(e) => setForm({ ...form, county: e.target.value })}
          />
          <input
            className="input-ht"
            placeholder="Town"
            required
            value={form.town}
            onChange={(e) => setForm({ ...form, town: e.target.value })}
          />
          <input
            className="input-ht"
            placeholder="Public area hint (optional)"
            value={form.area_label}
            onChange={(e) => setForm({ ...form, area_label: e.target.value })}
          />
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
          <p className="text-xs font-semibold text-amber-200 uppercase tracking-wider">Internal only</p>
          <input
            className="input-ht bg-black/35"
            placeholder="Estate / neighbourhood"
            value={form.estate}
            onChange={(e) => setForm({ ...form, estate: e.target.value })}
          />
          <input
            className="input-ht bg-black/35"
            placeholder="Full address memo"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              className="input-ht bg-black/35"
              placeholder="Latitude"
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
            />
            <input
              className="input-ht bg-black/35"
              placeholder="Longitude"
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
            />
          </div>
          <input
            className="input-ht bg-black/35"
            placeholder="Owner / agent phone"
            value={form.owner_phone}
            onChange={(e) => setForm({ ...form, owner_phone: e.target.value })}
          />
        </div>

        <textarea
          className="input-ht min-h-[100px]"
          placeholder="Manual description shown to buyers (stay high-level)."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div>
          <p className="text-xs text-zinc-500 mb-2">Amenity chips → surface on public blurbs.</p>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => (
              <button
                key={a}
                type="button"
                className={`rounded-full px-3 py-1 text-xs border ${
                  form.amenities.includes(a) ? 'bg-violet-500/30 border-violet-400/50 text-white' : 'border-white/10 text-zinc-400'
                }`}
                onClick={() => toggleAmenity(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="border border-white/10 rounded-xl p-4 space-y-2">
          <p className="text-xs text-zinc-500 mb-2">Imagery uploads (Supabase bucket `property-images`)</p>
          <input type="file" accept="image/*" multiple onChange={(e) => setFiles(e.target.files)} />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={aiBusy}
            className="inline-flex items-center gap-2 rounded-xl border border-violet-400/40 bg-violet-500/10 px-4 py-2 text-sm text-violet-100"
            onClick={() => runGemini()}
          >
            <Sparkles className="h-4 w-4" /> {aiBusy ? 'Drafting narrative...' : 'Gemini prose layer'}
          </button>
          {aiText && (
            <span className="text-xs text-zinc-500 self-center">{aiText.length} chars drafted</span>
          )}
        </div>
        {aiText && <textarea readOnly value={aiText} className="input-ht min-h-[120px]" />}

        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2 text-zinc-300">
            <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
            Listed as available
          </label>
          <label className="flex items-center gap-2 text-zinc-300">
            <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
            Publish to public mosaic
          </label>
        </div>

        {note && <p className="text-sm text-red-400">{note}</p>}

        <button
          disabled={busy}
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-green-600 to-teal-500 py-3 text-sm font-bold text-black disabled:opacity-50"
        >
          {busy ? 'Committing dossier…' : 'Save listing pipeline'}
        </button>
      </form>
      <style>{`
        .input-ht {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(255 255 255 / 0.1);
          background: rgb(0 0 0 / 0.35);
          padding: 0.65rem 0.85rem;
          font-size: 0.875rem;
          color: #f8fafc;
        }
        .input-ht::placeholder { color: rgb(161 161 170); }
      `}</style>
    </div>
  )
}
