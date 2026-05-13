import { FormEvent, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function AdminLoginPage() {
  const { signInEmail, loading, role, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!loading && role === 'admin' && user) {
    return <Navigate to="/admin" replace />
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    const { error } = await signInEmail(email.trim(), password)
    setBusy(false)
    if (error) {
      setErr(error.message)
      return
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-trace-dusk px-4 py-14">
      <div className="mx-auto w-full max-w-md glass-card p-8">
        <p className="font-display text-sm font-semibold text-trace-violet uppercase tracking-[0.2em] mb-2">HomeTrace</p>
        <h1 className="font-display text-2xl font-bold text-white mb-6">Admin sign in</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Email</label>
            <input
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {err && <p className="text-xs text-red-400">{err}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 py-2.5 text-sm font-bold text-trace-dusk disabled:opacity-50"
          >
            {busy ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-xs text-zinc-600 leading-relaxed">
          First deploy: create a user in Supabase Auth, confirm email, run{' '}
          <code className="text-zinc-400">update profiles set role = &apos;admin&apos; where ...</code> to elevate.
          Public visitors never authenticate for listings.
        </p>
        <Link to="/" className="mt-8 block text-center text-sm text-cyan-300 hover:underline">
          Back to site
        </Link>
      </div>
    </div>
  )
}
