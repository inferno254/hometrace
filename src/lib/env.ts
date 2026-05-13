export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  geminiKey: import.meta.env.VITE_GEMINI_API_KEY ?? '',
  publicPhone: import.meta.env.VITE_HOMETRACE_PUBLIC_PHONE ?? '',
  whatsappUrl: import.meta.env.VITE_HOMETRACE_WHATSAPP_URL ?? '',
}

export function supabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey)
}
