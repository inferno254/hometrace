import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'

type Toast = {
  id: string
  message: string
  type: ToastType
}

type ToastCtx = {
  toasts: Toast[]
  toast: (message: string, type?: ToastType) => void
}

const Ctx = createContext<ToastCtx | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const value = useMemo(() => ({ toasts, toast }), [toasts, toast])

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto animate-slide-in rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur-xl ${
              t.type === 'success'
                ? 'border-green-400/30 bg-green-500/15 text-green-200'
                : t.type === 'error'
                  ? 'border-red-400/30 bg-red-500/15 text-red-200'
                  : 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
