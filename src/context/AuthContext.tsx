import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type Role = 'customer' | 'admin' | null

type AuthState = {
  session: Session | null
  user: User | null
  role: Role
  loading: boolean
  signOut: () => Promise<void>
  refreshRole: () => Promise<void>
  signInEmail: (email: string, password: string) => Promise<{ error: Error | null }>
}

const AuthCtx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role>(null)
  const [loading, setLoading] = useState(true)

  const refreshRole = useCallback(async () => {
    if (!supabase || !session?.user?.id) {
      setRole(null)
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle()

    const r = data?.role === 'admin' ? 'admin' : data?.role === 'customer' ? 'customer' : null
    setRole(r)
  }, [session?.user?.id])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setUser(next?.user ?? null)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    void refreshRole()
  }, [refreshRole])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setRole(null)
  }, [])

  const signInEmail = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? new Error(error.message) : null }
  }, [])

  const value = useMemo(
    () => ({
      session,
      user,
      role,
      loading,
      signOut,
      refreshRole,
      signInEmail,
    }),
    [session, user, role, loading, signOut, refreshRole, signInEmail],
  )

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
