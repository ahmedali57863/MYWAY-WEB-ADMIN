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

export async function getSignedUrlsBatch(
  paths: (string | null | undefined)[],
  bucket: string = 'verification-documents',
  expiresIn: number = 3600
): Promise<Map<string, string>> {
  const validPaths = Array.from(
    new Set(paths.filter((p): p is string => Boolean(p && !p.startsWith('http'))))
  )
  const urlMap = new Map<string, string>()

  if (validPaths.length === 0) {
    return urlMap
  }

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.storage.from(bucket).createSignedUrls(validPaths, expiresIn)
    if (!error && data) {
      data.forEach((item) => {
        if (item.path && item.signedUrl) {
          urlMap.set(item.path, item.signedUrl)
        }
      })
    }
  } catch (err) {
    console.error('Error batch signing URLs:', err)
  }

  return urlMap
}
