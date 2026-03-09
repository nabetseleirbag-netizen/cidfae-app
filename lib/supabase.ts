import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL    ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

// createBrowserClient (de @supabase/ssr) guarda la sesión en COOKIES,
// no en localStorage — así el proxy del servidor puede leerla correctamente.
export const supabase = createBrowserClient(
  supabaseUrl    || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
)
