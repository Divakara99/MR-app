import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  ''
).trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null

export type RemoteAccountRow = {
  role: 'seeker' | 'recruiter'
  name: string
  mobile: string
  email: string
  has_password?: boolean | null
  profile?: Record<string, unknown> | null
  created_at?: string | null
}

export type RemoteCandidateRow = {
  candidate_id: string
  candidate_code: string
  profile: Record<string, unknown>
}

export type RemotePurchaseRow = {
  id: string
  role: 'seeker' | 'recruiter'
  name: string
  mobile: string
  email: string
  plan: string
  amount_inr: number | string
  method: string
  status: string
  transaction_id: string
  purchased_at: string
  expires_at: string | null
}
