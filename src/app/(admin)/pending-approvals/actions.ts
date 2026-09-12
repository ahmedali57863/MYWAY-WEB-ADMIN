'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function approveIdentityVerification(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('approve_identity_verification', { p_verification_id: id })
  if (error) throw new Error(error.message)
  revalidatePath('/pending-approvals')
}

export async function rejectIdentityVerification(id: string, reason: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('reject_identity_verification', {
    p_verification_id: id,
    p_reason: reason
  })
  if (error) throw new Error(error.message)
  revalidatePath('/pending-approvals')
}

export async function approveDriverApplication(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('approve_driver_application', { p_application_id: id })
  if (error) throw new Error(error.message)
  revalidatePath('/pending-approvals')
}

export async function rejectDriverApplication(id: string, reason: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('reject_driver_application', {
    p_application_id: id,
    p_reason: reason
  })
  if (error) throw new Error(error.message)
  revalidatePath('/pending-approvals')
}

// Signed URL helper (Part B) - using normal client
export async function getSignedUrl(path: string) {
  if (!path) return null
  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from('verification-documents')
    .createSignedUrl(path, 300) // 5 minutes
  if (error) {
    console.error('Error generating signed URL:', error)
    return null
  }
  return data?.signedUrl
}
