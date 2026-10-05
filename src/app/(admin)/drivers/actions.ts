'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/admin'

export async function toggleDriverVerification(userId: string, isVerified: boolean) {
  const supabase = createAdminClient()

  // 1. Update profile is_verified_driver flag
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ is_verified_driver: isVerified })
    .eq('id', userId)

  if (profileError) {
    console.error('Error toggling driver verification:', profileError)
    throw new Error(profileError.message)
  }

  // 2. Also update associated vehicle active status if approving
  if (isVerified) {
    await supabase
      .from('vehicles')
      .update({ is_active: true })
      .eq('user_id', userId)
  }

  revalidatePath('/drivers')
  revalidatePath('/users')
  revalidatePath('/pending-approvals')
}

export async function approveDriverApplication(applicationId: string, userId: string, vehicleId?: string) {
  const supabase = createAdminClient()

  const { error: appError } = await supabase
    .from('driver_applications')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', applicationId)

  if (appError) {
    console.error('Error approving driver application:', appError)
    throw new Error(appError.message)
  }

  await supabase
    .from('profiles')
    .update({ is_verified_driver: true })
    .eq('id', userId)

  if (vehicleId) {
    await supabase
      .from('vehicles')
      .update({ is_active: true })
      .eq('id', vehicleId)
  } else {
    await supabase
      .from('vehicles')
      .update({ is_active: true })
      .eq('user_id', userId)
  }

  revalidatePath('/drivers')
  revalidatePath('/users')
  revalidatePath('/pending-approvals')
}

export async function rejectDriverApplication(applicationId: string, userId: string, reason: string) {
  const supabase = createAdminClient()

  const { error: appError } = await supabase
    .from('driver_applications')
    .update({ status: 'rejected', rejection_reason: reason, reviewed_at: new Date().toISOString() })
    .eq('id', applicationId)

  if (appError) {
    console.error('Error rejecting driver application:', appError)
    throw new Error(appError.message)
  }

  await supabase
    .from('profiles')
    .update({ is_verified_driver: false })
    .eq('id', userId)

  revalidatePath('/drivers')
  revalidatePath('/users')
  revalidatePath('/pending-approvals')
}

export async function updateDriverProfile(userId: string, data: {
  full_name?: string
  phone?: string
  city?: string
  is_verified_driver?: boolean
}) {
  const supabase = createAdminClient()

  const updates: Record<string, any> = {}
  if (data.full_name !== undefined) updates.full_name = data.full_name
  if (data.phone !== undefined) updates.phone = data.phone
  if (data.city !== undefined) {
    updates.city = data.city
    updates.address = data.city
  }
  if (data.is_verified_driver !== undefined) updates.is_verified_driver = data.is_verified_driver

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)

    if (error) {
      console.error('Error updating driver profile:', error)
      throw new Error(error.message)
    }
  }

  revalidatePath('/drivers')
  revalidatePath('/users')
}

export async function deleteDriverAccount(userId: string) {
  const supabase = createAdminClient()

  // 1. Unlink administrative review references
  const unlinkQueries = [
    { name: 'driver_applications', query: supabase.from('driver_applications').update({ reviewed_by: null }).eq('reviewed_by', userId) },
    { name: 'verifications', query: supabase.from('verifications').update({ reviewed_by: null }).eq('reviewed_by', userId) },
    { name: 'student_verifications', query: supabase.from('student_verifications').update({ reviewed_by: null }).eq('reviewed_by', userId) },
  ]

  for (const { name, query } of unlinkQueries) {
    const { error } = await query
    if (error) {
      console.error(`Failed to unlink review references in ${name}:`, error)
      throw new Error(`Failed to unlink references in ${name}: ${error.message}`)
    }
  }

  // 2. Cascade delete dependent child records
  const deleteQueries = [
    { name: 'matches', query: supabase.from('matches').delete().or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`) },
    { name: 'routes', query: supabase.from('routes').delete().eq('user_id', userId) },
    { name: 'ride_demand', query: supabase.from('ride_demand').delete().eq('user_id', userId) },
    { name: 'notifications', query: supabase.from('notifications').delete().eq('user_id', userId) },
    { name: 'support_messages', query: supabase.from('support_messages').delete().eq('user_id', userId) },
    { name: 'driver_applications', query: supabase.from('driver_applications').delete().eq('user_id', userId) },
    { name: 'student_verifications', query: supabase.from('student_verifications').delete().eq('user_id', userId) },
    { name: 'verifications', query: supabase.from('verifications').delete().eq('user_id', userId) },
    { name: 'recent_searches', query: supabase.from('recent_searches').delete().eq('user_id', userId) },
    { name: 'vehicles', query: supabase.from('vehicles').delete().eq('user_id', userId) },
  ]

  for (const { name, query } of deleteQueries) {
    const { error } = await query
    if (error) {
      console.error(`Failed to delete from ${name}:`, error)
      throw new Error(`Failed to delete dependent records in ${name}: ${error.message}`)
    }
  }

  // 3. Delete profile row
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (profileError) {
    console.error('Error deleting driver profile:', profileError)
    throw new Error(`Profile deletion failed: ${profileError.message}`)
  }

  // 4. Delete auth user
  const { error: authError } = await supabase.auth.admin.deleteUser(userId)
  if (authError && !authError.message.includes('User not found')) {
    console.error('Error deleting auth user:', authError)
    throw new Error(`Auth deletion failed: ${authError.message}`)
  }

  revalidatePath('/drivers')
  revalidatePath('/users')
}
