'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function adminReviewStudentVerification(id: string, status: string, reason?: string) {
  const { createAdminClient } = await import('@/utils/supabase/admin')
  const supabase = createAdminClient()
  
  const { data: verif, error: fetchErr } = await supabase.from('student_verifications').select('user_id').eq('id', id).single()
  if (fetchErr) throw new Error(fetchErr.message)

  const { error } = await supabase.from('student_verifications').update({ 
    status, 
    rejection_reason: reason || null, 
    reviewed_at: new Date().toISOString() 
  }).eq('id', id)
  
  if (error) throw new Error(error.message)

  if (status === 'approved') {
    const expiry = new Date()
    expiry.setMonth(expiry.getMonth() + 6)
    await supabase.from('profiles').update({ 
      verification_tier: 'student', 
      verification_expiry_date: expiry.toISOString() 
    }).eq('id', verif.user_id)
  }

  revalidatePath('/student-verifications')
}

// Signed URL helper
export async function getSignedUrl(path: string) {
  if (!path) return null
  const { createAdminClient } = await import('@/utils/supabase/admin')
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from('verification-documents')
    .createSignedUrl(path, 300) // 5 minutes
  if (error) {
    console.error('Error generating signed URL:', error)
    return null
  }
  return data?.signedUrl
}
