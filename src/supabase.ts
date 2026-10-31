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
        // Supabase Auth is the only login/session source for Job Seeker,
        // Recruiter and Admin accounts. Profile/app data remains in public
        // tables linked to the authenticated user's ID.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null

export type RemoteAccountRow = {
  role: 'seeker' | 'recruiter'
  name: string
  mobile: string
  email: string
  auth_user_id?: string | null
  auth_linked?: boolean | null
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

export type RemoteUserStateRow = {
  payload: Record<string, unknown>
  updated_at?: string | null
}

export type RemoteAppSettingRow = {
  payload: Record<string, unknown>
  updated_at?: string | null
}

export type RemoteSyncRecordRow = {
  record_id: string
  record_position: number
  payload: Record<string, unknown>
  updated_at?: string | null
}
