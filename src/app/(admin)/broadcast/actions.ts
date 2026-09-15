'use server'

import { createClient } from '@/utils/supabase/server'

export async function broadcastNotification(title: string, body: string) {
  const supabase = await createClient()

  // Use the exact same logic as the mobile app: invoke the Edge Function
  const { data, error } = await supabase.functions.invoke('broadcast-notification', {
    body: {
      title: title.trim(),
      body: body.trim(),
    }
  })

  if (error) {
    throw new Error(error.message || 'Failed to send broadcast.')
  }

  return data
}
