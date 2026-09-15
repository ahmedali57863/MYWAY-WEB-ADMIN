'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function replyToSupportMessage(userId: string, content: string) {
  const supabase = await createClient()

  // Use the exact same logic as the mobile app: insert an admin reply to "resolve" the thread
  const { error } = await supabase
    .from('support_messages')
    .insert({
      user_id: userId,
      sender_role: 'admin',
      content: content.trim()
    })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/support')
}
