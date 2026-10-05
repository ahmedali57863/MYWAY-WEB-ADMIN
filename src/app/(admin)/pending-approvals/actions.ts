'use server'

import { revalidatePath } from 'next/cache'

export async function approveIdentityVerification(id: string) {
  const { createAdminClient } = await import('@/utils/supabase/admin')
  const supabase = createAdminClient()

  // Find verification row or profile row
  const { data: verif } = await supabase.from('verifications').select('user_id').eq('id', id).maybeSingle()
  const userId = verif?.user_id || id

  await supabase
    .from('verifications')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .or(`id.eq.${id},user_id.eq.${userId}`)

  // profiles.verification_status constraint is ('unverified', 'pending', 'verified')
  const { error: profError } = await supabase
    .from('profiles')
    .update({ verification_status: 'verified', cnic_verified: true })
    .eq('id', userId)

  if (profError) {
    console.error('Error updating profile in approveIdentityVerification:', profError)
    throw new Error(profError.message)
  }

  revalidatePath('/pending-approvals')
  revalidatePath('/users')
}

export async function rejectIdentityVerification(id: string, reason: string) {
  const { createAdminClient } = await import('@/utils/supabase/admin')
  const supabase = createAdminClient()
  
  const { data: verif } = await supabase.from('verifications').select('user_id').eq('id', id).maybeSingle()
  const userId = verif?.user_id || id

  await supabase
    .from('verifications')
    .update({ status: 'rejected', rejection_reason: reason, reviewed_at: new Date().toISOString() })
    .or(`id.eq.${id},user_id.eq.${userId}`)

  const { error: profError } = await supabase
    .from('profiles')
    .update({ verification_status: 'unverified', cnic_verified: false })
    .eq('id', userId)

  if (profError) {
    console.error('Error updating profile in rejectIdentityVerification:', profError)
    throw new Error(profError.message)
  }

  revalidatePath('/pending-approvals')
  revalidatePath('/users')
}

export async function approveDriverApplication(id: string) {
  const { createAdminClient } = await import('@/utils/supabase/admin')
  const supabase = createAdminClient()

  const { data: app } = await supabase
    .from('driver_applications')
    .select('id, user_id, vehicle_id')
    .or(`id.eq.${id},user_id.eq.${id}`)
    .maybeSingle()

  const userId = app?.user_id || id
  const vehicleId = app?.vehicle_id

  if (app?.id) {
    await supabase
      .from('driver_applications')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', app.id)
  }

  const { error: profError } = await supabase
    .from('profiles')
    .update({ is_verified_driver: true })
    .eq('id', userId)

  if (profError) {
    console.error('Error updating profile in approveDriverApplication:', profError)
    throw new Error(profError.message)
  }

  if (vehicleId) {
    await supabase.from('vehicles').update({ is_active: true }).eq('id', vehicleId)
  } else {
    await supabase.from('vehicles').update({ is_active: true }).eq('user_id', userId)
  }

  revalidatePath('/pending-approvals')
  revalidatePath('/drivers')
}

export async function rejectDriverApplication(id: string, reason: string) {
  const { createAdminClient } = await import('@/utils/supabase/admin')
  const supabase = createAdminClient()
  
  const { data: app } = await supabase
    .from('driver_applications')
    .select('id, user_id')
    .or(`id.eq.${id},user_id.eq.${id}`)
    .maybeSingle()

  const userId = app?.user_id || id

  if (app?.id) {
    await supabase
      .from('driver_applications')
      .update({ status: 'rejected', rejection_reason: reason, reviewed_at: new Date().toISOString() })
      .eq('id', app.id)
  }

  await supabase.from('profiles').update({ is_verified_driver: false }).eq('id', userId)
  
  revalidatePath('/pending-approvals')
  revalidatePath('/drivers')
}

// Signed URL helper
export async function getSignedUrl(path: string) {
  if (!path) return null
  const { createAdminClient } = await import('@/utils/supabase/admin')
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from('verification-documents')
    .createSignedUrl(path, 300)
  if (error) {
    console.error('Error generating signed URL:', error)
    return null
  }
  return data?.signedUrl
}

