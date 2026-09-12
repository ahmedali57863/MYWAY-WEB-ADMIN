import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// This client uses the service role key and bypasses RLS.
// It is STRICTLY for server-side code (Server Actions, Route Handlers).
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing')
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
