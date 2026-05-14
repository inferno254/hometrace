import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { MapPin, Phone, Menu, X } from 'lucide-react'
import { env } from '../lib/env'

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-trace-dusk">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-trace-dusk/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="font-display text-xl font-bold tracking-tight text-white">
            Home<span className="text-gradient">Trace</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-zinc-300">
            <Link to="/browse" className="hover:text-white transition-colors">
              Browse
            </Link>
            <a
              href={env.whatsappUrl || '#'}
              className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-200 hover:bg-cyan-400/20 transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              WhatsApp
            </a>
          </nav>
          <button
            className="sm:hidden text-zinc-400 hover:text-white transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-white/10 bg-trace-dusk/95 backdrop-blur-xl sm:hidden animate-fade-in">
            <nav className="flex flex-col gap-2 px-4 py-4 text-sm font-medium text-zinc-300">
              <Link
                to="/browse"
                className="rounded-xl px-3 py-2 hover:bg-white/5 hover:text-white transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Browse homes
              </Link>
              {env.whatsappUrl && env.whatsappUrl !== '#' && (
                <a
                  href={env.whatsappUrl}
                  className="rounded-xl px-3 py-2 text-cyan-200 hover:bg-white/5 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  WhatsApp us
                </a>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-white/10 py-10 text-center text-sm text-zinc-500">
        <p className="font-display text-white/80 mb-2">Exact pins stay offline — you reach real homes through us.</p>
        <p className="flex flex-wrap justify-center gap-4 items-center">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4 text-trace-violet" /> Serving Kenya-wide listings
          </span>
          {env.publicPhone && (
            <a href={`tel:${env.publicPhone.replace(/\s/g, '')}`} className="text-trace-cyan hover:underline">
              Call {env.publicPhone}
            </a>
          )}
        </p>
      </footer>
    </div>
  )
}
