import { useState } from 'react'
import { Link, Navigate, Outlet } from 'react-router-dom'
import { LayoutDashboard, Map, PlusCircle, Menu, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export function AdminLayout() {
  const { loading, role, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  if (!loading && role !== 'admin') {
    return <Navigate to="/admin/login" replace />
  }

  const navLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/map', label: 'Operations map', icon: Map },
    { to: '/admin/new', label: 'Add house', icon: PlusCircle, accent: true },
  ]

  return (
    <div className="min-h-screen bg-trace-dusk text-white">
      <header className="border-b border-white/10 px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-6">
          <span className="font-display font-bold text-lg tracking-tight shrink-0">
            Home<span className="text-gradient">Trace</span> <span className="text-zinc-500 text-sm font-normal">Admin</span>
          </span>
          <nav className="hidden md:flex flex-wrap gap-4 text-sm text-zinc-400">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`inline-flex items-center gap-1.5 hover:text-white transition-colors ${
                  l.accent ? 'text-cyan-300' : ''
                }`}
              >
                <l.icon className="h-4 w-4" /> {l.label}
              </Link>
            ))}
            <a href="/browse" className="hover:text-white transition-colors">
              Preview public
            </a>
          </nav>
          <button
            type="button"
            onClick={() => signOut()}
            className="hidden md:block ml-auto text-xs uppercase tracking-wide text-zinc-500 hover:text-white transition-colors"
          >
            Sign out
          </button>
          <button
            className="md:hidden ml-auto text-zinc-400 hover:text-white transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-white/10 mt-4 pt-4 md:hidden animate-fade-in">
            <nav className="flex flex-col gap-2 text-sm text-zinc-400">
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMenuOpen(false)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white/5 transition-colors ${
                    l.accent ? 'text-cyan-300' : ''
                  }`}
                >
                  <l.icon className="h-4 w-4" /> {l.label}
                </Link>
              ))}
              <a
                href="/browse"
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white/5 transition-colors"
              >
                Preview public listings
              </a>
              <button
                type="button"
                onClick={() => { signOut(); setMenuOpen(false) }}
                className="text-left rounded-xl px-3 py-2 text-zinc-500 hover:bg-white/5 transition-colors"
              >
                Sign out
              </button>
            </nav>
          </div>
        )}
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">
        {loading ? <p className="text-zinc-500">...</p> : <Outlet />}
      </div>
    </div>
  )
}
