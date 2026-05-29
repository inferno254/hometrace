import { FormEvent, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Phone, Send, CheckCircle } from 'lucide-react'

type Props = {
  propertyId: string
  listingRef: string
}

export function InquiryForm({ propertyId, listingRef }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!supabase || !name.trim() || !phone.trim()) return
    setBusy(true)
    setErr('')
    try {
      const { error } = await supabase.rpc('submit_inquiry', {
        p_property_id: propertyId,
        p_name: name.trim(),
        p_phone: phone.trim(),
        p_message: message.trim() || null,
      })
      if (error) throw error
      setDone(true)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="glass-card rounded-xl p-5 text-center space-y-2">
        <CheckCircle className="h-8 w-8 text-green-400 mx-auto" />
        <p className="text-sm font-medium text-white">Inquiry sent!</p>
        <p className="text-xs text-zinc-500">We'll reach out about <span className="text-cyan-300">{listingRef}</span></p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="glass-card rounded-xl p-5 space-y-3">
      <h3 className="font-display text-sm font-semibold text-white flex items-center gap-2">
        <Phone className="h-4 w-4 text-cyan-400" /> Interested in this home?
      </h3>
      <p className="text-xs text-zinc-500">Leave your details and we'll call you back about {listingRef}.</p>
      <input
        required
        className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        required
        type="tel"
        className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
        placeholder="Phone number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <textarea
        className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white placeholder:text-zinc-600 min-h-[60px]"
        placeholder="Any questions? (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      {err && <p className="text-xs text-red-400">{err}</p>}
      <button
        type="submit"
        disabled={busy || !name.trim() || !phone.trim()}
        className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 py-2.5 text-sm font-bold text-trace-dusk disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
      >
        <Send className="h-4 w-4" /> {busy ? 'Sending...' : 'Send inquiry'}
      </button>
    </form>
  )
}
