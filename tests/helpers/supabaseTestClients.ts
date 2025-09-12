import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load env from local files when running tests
dotenv.config({ path: '.env.local' })
dotenv.config()

const url = process.env.VITE_SUPABASE_URL || ''
const anon = process.env.VITE_SUPABASE_ANON_KEY || ''

export const createAnonClient = (): SupabaseClient => createClient(url, anon)

export async function signInAs(email: string, password: string): Promise<{ client: SupabaseClient }> {
  const client = createAnonClient()
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  return { client }
}


