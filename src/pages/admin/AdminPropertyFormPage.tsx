import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { generateHouseDescription } from '../../lib/gemini'
import { useToast } from '../../components/Toast'

const AMENITIES = ['WiFi', 'Parking', 'Water 24/7', 'Electricity', 'Security', 'CCTV', 'Gym', 'Backup Generator']

const TOWNS_BY_COUNTY: Record<string, string[]> = {
  Nairobi: ['CBD', 'Westlands', 'Kilimani', 'Kileleshwa', 'Lavington', 'Parklands', 'Upper Hill', 'Riverside', 'Spring Valley', 'Muthaiga', 'Gigiri', 'Karen', 'Langata', 'Rongai (Nairobi side)', 'Madaraka', 'South B', 'South C', 'Eastlands', 'Buruburu', 'Umoja', 'Donholm', 'Embakasi', 'Utawala', 'Dandora', 'Kasarani', 'Roysambu', 'Kahawa', 'Githurai', 'Zimmerman', 'Mathare North', 'Pipeline'],
  Kiambu: ['Kiambu Town', 'Thika', 'Ruiru', 'Ruaka', 'Kabete', 'Kikuyu', 'Limuru', 'Tigoni', 'Juja', 'Kinoo', 'Githunguri', 'Ngewa', 'Wangige', 'Nderu', 'Lari', 'Gatundu'],
  Machakos: ['Machakos Town', 'Athi River', 'Kitengela', 'Mavoko', 'Kangundo', 'Tala', 'Matuu', 'Kathiani', 'Masinga', 'Yatta', 'Mwala'],
  Kajiado: ['Ngong', 'Ongata Rongai', 'Kiserian', 'Isinya', 'Kajiado Town', 'Namanga', 'Bissil', 'Shompole', 'Magadi'],
  Kisumu: ['Kisumu City', 'Ahero', 'Muhoroni', 'Koru', 'Kisumu West', 'Nyando', 'Miwani'],
  Mombasa: ['Mombasa Island', 'Nyali', 'Bamburi', 'Likoni', 'Mtwapa', 'Shanzu', 'Tudor', 'Kizingo', 'Mikindani'],
  Nakuru: ['Nakuru Town', 'Naivasha', 'Gilgil', 'Njoro', 'Molo', 'Mau Summit', 'Elementaita', 'Subukia', 'Bahati'],
  Eldoret: ['Eldoret Town', 'Iten', 'Kapsowar', 'Tambach', 'Chepkorio', 'Kabarnet'],
  Nyeri: ['Nyeri Town', 'Karatina', 'Othaya', 'Mukurweini', 'Kieni', 'Mathira', 'Tetu'],
  Meru: ['Meru Town', 'Nkubu', 'Chuka', 'Chogoria', 'Maua', 'Timau', 'Nanyuki'],
  'Uasin Gishu': ['Eldoret', 'Moiben', 'Soy', 'Kapsaret', 'Turbo', 'Ainabkoi'],
  Kilifi: ['Kilifi Town', 'Malindi', 'Watamu', 'Mtwapa (Kilifi side)', 'Mariakani', 'Kaloleni', 'Rabai'],
  Kwale: ['Kwale Town', 'Diani', 'Ukunda', 'Msambweni', 'Lunga Lunga', 'Shimoni'],
  'Taita Taveta': ['Voi', 'Taveta', 'Wundanyi', 'Mwatate', 'Taita'],
  Muranga: ['Muranga Town', 'Kangema', 'Kandara', 'Gatanga', 'Maragua', 'Kigumo'],
  Kirinyaga: ['Kerugoya', 'Kutus', 'Sagana', 'Mwea', 'Gichugu', 'Ndia'],
  Embu: ['Embu Town', 'Runyenjes', 'Siakago', 'Manyatta', 'Kyeni'],
  Makueni: ['Wote', 'Kibwezi', 'Makindu', 'Mtito Andei', 'Sultan Hamud', 'Salama'],
  Kitui: ['Kitui Town', 'Mwingi', 'Mutomo', 'Kwa Vonza', 'Ikutha', 'Kyuso'],
  Nandi: ['Kapsabet', 'Nandi Hills', 'Kobujoi', 'Chepterit', 'Tinderet'],
  Kericho: ['Kericho Town', 'Litein', 'Sotik', 'Buret', 'Londiani', 'Kipkelion'],
  Bomet: ['Bomet Town', 'Sotik', 'Mogogosiek', 'Longisa', 'Chepalungu'],
  'Trans Nzoia': ['Kitale', 'Kiminini', 'Kwanza', 'Endebess', 'Saboti'],
  Bungoma: ['Bungoma Town', 'Webuye', 'Kimilili', 'Sirisia', 'Tongaren', 'Mt Elgon'],
  Busia: ['Busia Town', 'Nambale', 'Port Victoria', 'Funyula', 'Teso North', 'Teso South'],
  Siaya: ['Siaya Town', 'Bondo', 'Ugunja', 'Ukwala', 'Yala', 'Rarieda'],
  'Homa Bay': ['Homa Bay Town', 'Mbita', 'Oyugis', 'Rachuonyo', 'Suba', 'Ndhiwa'],
  Migori: ['Migori Town', 'Kehancha', 'Awendo', 'Rongo', 'Uriri', 'Suna'],
  Kisii: ['Kisii Town', 'Ogembo', 'Nyamache', 'Keroka', 'Tabaka', 'Masimba'],
  Kakamega: ['Kakamega Town', 'Mumias', 'Butere', 'Malava', 'Lurambi', 'Navakholo', 'Matungu', 'Khwisero'],
  Laikipia: ['Nanyuki', 'Nyahururu', 'Rumuruti', 'Marmanet', 'Doldol', 'Kinamba'],
}

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
  furnished: boolean
  size_sqm: string
  amenities: string[]
}

const EMPTY_FORM: FormShape = {
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
  furnished: false,
  size_sqm: '',
  amenities: [],
}

export function AdminPropertyFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const [loadingData, setLoadingData] = useState(isEdit)
  const [form, setForm] = useState<FormShape>(EMPTY_FORM)
  const [files, setFiles] = useState<FileList | null>(null)
  const [aiText, setAiText] = useState('')
  const [existingImages, setExistingImages] = useState<string[]>([])

  useEffect(() => {
    if (!id || !supabase) return
    ;(async () => {
      const { data: prop, error } = await supabase
        .from('properties')
        .select('*, property_images(image_url, is_cover), amenities(name)')
        .eq('id', id)
        .single()
      if (error || !prop) {
        toast('Failed to load property for editing', 'error')
        navigate('/admin')
        return
      }
      setForm({
        title: prop.title ?? '',
        description: prop.description ?? '',
        price: String(prop.price ?? ''),
        price_type: prop.price_type ?? 'monthly',
        bedrooms: prop.bedrooms != null ? String(prop.bedrooms) : '',
        bathrooms: prop.bathrooms != null ? String(prop.bathrooms) : '',
        property_type: prop.property_type ?? 'apartment',
        county: prop.county ?? '',
        town: prop.town ?? '',
        area_label: prop.area_label ?? '',
        estate: prop.estate ?? '',
        address: prop.address ?? '',
        latitude: prop.latitude != null ? String(prop.latitude) : '',
        longitude: prop.longitude != null ? String(prop.longitude) : '',
        owner_phone: prop.owner_phone ?? '',
        is_available: prop.is_available ?? true,
        is_published: prop.is_published ?? false,
        furnished: prop.furnished ?? false,
        size_sqm: prop.size_sqm != null ? String(prop.size_sqm) : '',
        amenities: (prop.amenities as { name: string }[] | undefined)?.map((a) => a.name) ?? [],
      })
      setAiText(prop.ai_generated_description ?? '')
      setExistingImages(
        (prop.property_images as { image_url: string }[] | undefined)?.map((i) => i.image_url) ?? [],
      )
      setLoadingData(false)
    })()
  }, [id, navigate, toast])

  const toggleAmenity = (a: string) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }))
  }

  const runGemini = async () => {
    setAiBusy(true)
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
      toast((e as Error).message, 'error')
    } finally {
      setAiBusy(false)
    }
  }

  const removeExistingImage = async (url: string) => {
    setExistingImages((prev) => prev.filter((u) => u !== url))
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    if (!form.title.trim() || !Number(form.price)) {
      toast('Title and numeric price required.', 'error')
      return
    }
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
        furnished: form.furnished,
        size_sqm: form.size_sqm === '' ? null : Number(form.size_sqm),
      }

      let pid: string

      if (isEdit && id) {
        const { error: upErr } = await supabase.from('properties').update(row).eq('id', id)
        if (upErr) throw upErr
        pid = id

        if (form.amenities.length) {
          await supabase.from('amenities').delete().eq('property_id', pid)
          await supabase.from('amenities').insert(form.amenities.map((name) => ({ property_id: pid, name })))
        }
      } else {
        const { data: prop, error: pe } = await supabase.from('properties').insert(row).select('id').single()
        if (pe || !prop) throw pe ?? new Error('Insert failed')
        pid = prop.id as string

        if (form.amenities.length) {
          await supabase.from('amenities').insert(form.amenities.map((name) => ({ property_id: pid, name })))
        }
      }

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

      const allImages = [...existingImages, ...uploadedUrls]

      if (isEdit && id) {
        if (uploadedUrls.length > 0) {
          await supabase.from('property_images').insert(
            uploadedUrls.map((image_url, i) => ({
              property_id: pid,
              image_url,
              is_cover: allImages.length === uploadedUrls.length ? i === 0 : false,
              sort_order: existingImages.length + i,
            })),
          )
        }
        if (allImages.length > 0) {
          await supabase.from('properties').update({ cover_image_url: allImages[0] }).eq('id', pid)
        }
      } else {
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
      }

      toast(isEdit ? 'Property updated' : 'Property listed successfully!', 'success')
      navigate('/admin')
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }

  if (loadingData) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-[600px] w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{isEdit ? 'Edit property' : 'Ingress a listing'}</h1>
        <p className="text-sm text-zinc-500 mt-2">
          {isEdit
            ? 'Update fields below. Images can be added or removed.'
            : 'Public cards show only county / town / area_label. Estate, address, coords &amp; owner phone stay admin-only.'}
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

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer hover:text-white transition-colors">
            <input type="checkbox" checked={form.furnished} onChange={(e) => setForm({ ...form, furnished: e.target.checked })} className="accent-cyan-500" />
            Furnished
          </label>
          <input
            type="number"
            className="input-ht"
            placeholder="Size (m²)"
            value={form.size_sqm}
            onChange={(e) => setForm({ ...form, size_sqm: e.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <select
            className="input-ht"
            required
            value={form.county}
            onChange={(e) => setForm({ ...form, county: e.target.value, town: '' })}
          >
            <option value="">Select county</option>
            {['Nairobi', 'Kiambu', 'Machakos', 'Kajiado', 'Kisumu', 'Mombasa', 'Nakuru', 'Eldoret', 'Nyeri', 'Meru', 'Tharaka Nithi', 'Laikipia', 'Uasin Gishu', 'Kilifi', 'Kwale', 'Taita Taveta', 'Muranga', 'Kirinyaga', 'Embu', 'Makueni', 'Kitui', 'Nandi', 'Kericho', 'Bomet', 'Trans Nzoia', 'Bungoma', 'Busia', 'Siaya', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira', 'Vihiga', 'Kakamega', 'Lamu', 'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Turkana', 'Samburu', 'Isiolo', 'West Pokot', 'Elgeyo Marakwet', 'Narok', 'Tana River', 'Lamu', 'Taita Taveta'].sort().filter((v, i, a) => a.indexOf(v) === i).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className="input-ht capitalize"
            required
            value={form.town}
            onChange={(e) => setForm({ ...form, town: e.target.value })}
          >
            <option value="">Select town/area</option>
            {TOWNS_BY_COUNTY[form.county]?.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            className="input-ht"
            placeholder="Area label (e.g. Northern Kiambu corridor)"
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
          <p className="text-xs text-zinc-500 mb-2">Amenity chips</p>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => (
              <button
                key={a}
                type="button"
                className={`rounded-full px-3 py-1 text-xs border transition-all duration-150 ${
                  form.amenities.includes(a)
                    ? 'bg-violet-500/30 border-violet-400/50 text-white'
                    : 'border-white/10 text-zinc-400 hover:border-white/30'
                }`}
                onClick={() => toggleAmenity(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Existing images */}
        {existingImages.length > 0 && (
          <div>
            <p className="text-xs text-zinc-500 mb-2">Current images ({existingImages.length})</p>
            <div className="flex flex-wrap gap-2">
              {existingImages.map((url) => (
                <div key={url} className="relative group">
                  <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(url)}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border border-white/10 rounded-xl p-4 space-y-2">
          <p className="text-xs text-zinc-500 mb-2">
            {isEdit ? 'Add more images' : 'Imagery uploads (Supabase bucket `property-images`)'}
          </p>
          <input
            type="file"
            accept="image/*"
            multiple
            className="text-xs text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-white hover:file:bg-white/20 transition file:cursor-pointer"
            onChange={(e) => setFiles(e.target.files)}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={aiBusy}
            className="inline-flex items-center gap-2 rounded-xl border border-violet-400/40 bg-violet-500/10 px-4 py-2 text-sm text-violet-100 hover:bg-violet-500/20 transition-colors"
            onClick={() => runGemini()}
          >
            <Sparkles className="h-4 w-4" /> {aiBusy ? 'Drafting narrative...' : 'Gemini prose layer'}
          </button>
          {aiText && <span className="text-xs text-zinc-500 self-center">{aiText.length} chars drafted</span>}
        </div>
        {aiText && <textarea readOnly value={aiText} className="input-ht min-h-[120px]" />}

        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2 text-zinc-300 cursor-pointer hover:text-white transition-colors">
            <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} className="accent-cyan-500" />
            Listed as available
          </label>
          <label className="flex items-center gap-2 text-zinc-300 cursor-pointer hover:text-white transition-colors">
            <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="accent-violet-500" />
            Publish to public mosaic
          </label>
        </div>

        <div className="flex gap-3">
          <button
            disabled={busy}
            type="submit"
            className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 py-3 text-sm font-bold text-trace-dusk disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {busy ? 'Saving...' : isEdit ? 'Update property' : 'Save listing'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="rounded-xl border border-white/15 px-6 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
        </div>
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
          transition: border-color 0.2s;
        }
        .input-ht:focus {
          outline: none;
          border-color: rgb(34 211 238 / 0.5);
        }
        .input-ht::placeholder { color: rgb(161 161 170); }
      `}</style>
    </div>
  )
}
