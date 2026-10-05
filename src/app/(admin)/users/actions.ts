'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/admin'

export async function updateUserProfile(userId: string, data: {
  full_name?: string
  phone?: string
  avatar_url?: string
  is_admin?: boolean
  verification_status?: string
  is_pro?: boolean
  is_verified_driver?: boolean
  cnic_verified?: boolean
  verification_tier?: string
}) {
  const supabase = createAdminClient()

  const profileUpdates: Record<string, string | boolean | null> = {}
  if (data.full_name !== undefined) profileUpdates.full_name = data.full_name
  if (data.phone !== undefined) profileUpdates.phone = data.phone
  if (data.avatar_url !== undefined) profileUpdates.avatar_url = data.avatar_url
  if (data.is_admin !== undefined) profileUpdates.is_admin = data.is_admin
  if (data.verification_status !== undefined) {
    const rawStatus = data.verification_status.toLowerCase().trim()
    if (rawStatus === 'verified' || rawStatus === 'approved') {
      profileUpdates.verification_status = 'verified'
    } else if (rawStatus === 'pending') {
      profileUpdates.verification_status = 'pending'
    } else {
      profileUpdates.verification_status = 'unverified'
    }
  }

  if (data.is_pro !== undefined) {
    profileUpdates.is_pro = data.is_pro
    if (data.is_pro === true) {
      const expiryDate = new Date()
      expiryDate.setMonth(expiryDate.getMonth() + 6)
      profileUpdates.pro_expiry_date = expiryDate.toISOString()
    } else {
      profileUpdates.pro_expiry_date = null
    }
  }

  if (data.is_verified_driver !== undefined) profileUpdates.is_verified_driver = data.is_verified_driver
  if (data.cnic_verified !== undefined) profileUpdates.cnic_verified = data.cnic_verified

  if (data.verification_tier !== undefined) {
    const rawTier = data.verification_tier.toLowerCase().trim()
    if (rawTier === 'student') {
      profileUpdates.verification_tier = 'student'
      const expiryDate = new Date()
      expiryDate.setMonth(expiryDate.getMonth() + 6)
      profileUpdates.verification_expiry_date = expiryDate.toISOString()
    } else if (rawTier === 'pro') {
      profileUpdates.verification_tier = 'pro'
    } else {
      profileUpdates.verification_tier = 'none'
      profileUpdates.verification_expiry_date = null
    }
  }

  if (Object.keys(profileUpdates).length > 0) {
    const { error } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', userId)

    if (error) {
      throw new Error(error.message)
    }
  }

  revalidatePath('/users')
  revalidatePath('/student-verifications')
}

export async function deleteUserAccount(userId: string) {
  const supabase = createAdminClient()

  // 1. Unlink administrative review references to prevent FK constraint violations
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

  // 2. Cascade delete dependent child records created by this user
  // Must be done sequentially in order of dependencies (e.g. matches -> routes -> vehicles)
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
    console.error('Error deleting profile:', profileError)
    throw new Error(`Profile deletion failed: ${profileError.message}`)
  }

  // 4. Delete auth user via admin auth api
  const { error: authError } = await supabase.auth.admin.deleteUser(userId)
  if (authError) {
    // If the auth user was already deleted or doesn't exist, we don't need to crash
    if (!authError.message.includes('User not found')) {
      console.error('Error deleting auth user:', authError)
      throw new Error(`Auth deletion failed: ${authError.message}`)
    }
  }

  revalidatePath('/users')
}
