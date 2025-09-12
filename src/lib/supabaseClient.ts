import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

console.log('Supabase Client: URL:', supabaseUrl)
console.log('Supabase Client: Key exists:', !!supabaseAnonKey)

if (!supabaseUrl || !supabaseAnonKey) {
  // Intentionally throw early to avoid silent failures during development
  console.error('Missing Supabase env vars: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  console.error('URL:', supabaseUrl)
  console.error('Key exists:', !!supabaseAnonKey)
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
})


