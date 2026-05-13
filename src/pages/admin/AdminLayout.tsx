import { Link, Navigate, Outlet } from 'react-router-dom'
import { LayoutDashboard, Map, PlusCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export function AdminLayout() {
  const { loading, role, signOut } = useAuth()

  if (!loading && role !== 'admin') {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <div className="min-h-screen bg-trace-dusk text-white">
      <header className="border-b border-white/10 px-4 py-4 flex flex-wrap items-center gap-6">
        <span className="font-display font-bold text-lg tracking-tight">
          Home<span className="text-gradient">Trace</span> <span className="text-zinc-500 text-sm font-normal">Admin</span>
        </span>
        <nav className="flex flex-wrap gap-4 text-sm text-zinc-400">
          <Link to="/admin" className="inline-flex items-center gap-1.5 hover:text-white">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
          <Link to="/admin/map" className="inline-flex items-center gap-1.5 hover:text-white">
            <Map className="h-4 w-4" /> Operations map
          </Link>
          <Link to="/admin/new" className="inline-flex items-center gap-1.5 text-cyan-300 hover:text-cyan-100">
            <PlusCircle className="h-4 w-4" /> Add house
          </Link>
          <Link to="/browse" className="hover:text-white">
            Preview public listings
          </Link>
        </nav>
        <button
          type="button"
          onClick={() => signOut()}
          className="ml-auto text-xs uppercase tracking-wide text-zinc-500 hover:text-white"
        >
          Sign out
        </button>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">
        {loading ? <p className="text-zinc-500">...</p> : <Outlet />}
      </div>
    </div>
  )
}
