'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function approveIdentityVerification(id: string) {
  const { createAdminClient } = await import('@/utils/supabase/admin')
  const supabase = createAdminClient()

  const { data: verif, error: fetchErr } = await supabase.from('verifications').select('user_id').eq('id', id).single()
  if (fetchErr) throw new Error(fetchErr.message)

  const { error } = await supabase.from('verifications').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)

  await supabase.from('profiles').update({ verification_status: 'approved', cnic_verified: true }).eq('id', verif.user_id)
  revalidatePath('/pending-approvals')
}

export async function rejectIdentityVerification(id: string, reason: string) {
  const { createAdminClient } = await import('@/utils/supabase/admin')
  const supabase = createAdminClient()
  
  const { data: verif, error: fetchErr } = await supabase.from('verifications').select('user_id').eq('id', id).single()
  if (fetchErr) throw new Error(fetchErr.message)

  const { error } = await supabase.from('verifications').update({ status: 'rejected', rejection_reason: reason, reviewed_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)

  await supabase.from('profiles').update({ verification_status: 'unverified', cnic_verified: false }).eq('id', verif.user_id)
  revalidatePath('/pending-approvals')
}

export async function approveDriverApplication(id: string) {
  const { createAdminClient } = await import('@/utils/supabase/admin')
  const supabase = createAdminClient()

  const { data: app, error: fetchErr } = await supabase.from('driver_applications').select('user_id, vehicle_id').eq('id', id).single()
  if (fetchErr) throw new Error(fetchErr.message)

  const { error } = await supabase.from('driver_applications').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)

  await supabase.from('profiles').update({ is_verified_driver: true }).eq('id', app.user_id)
  await supabase.from('vehicles').update({ is_active: true }).eq('id', app.vehicle_id)
  revalidatePath('/pending-approvals')
}

export async function rejectDriverApplication(id: string, reason: string) {
  const { createAdminClient } = await import('@/utils/supabase/admin')
  const supabase = createAdminClient()
  
  const { error } = await supabase.from('driver_applications').update({ status: 'rejected', rejection_reason: reason, reviewed_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
  
  revalidatePath('/pending-approvals')
}

// Signed URL helper (Part B) - using normal client
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
