'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function login(formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const password = (formData.get('password') as string)?.trim()

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  if (email === 'admin' && password === 'admin123') {
    const cookieStore = await cookies();
    cookieStore.set('hardcoded_admin', 'true', { 
      httpOnly: false, 
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });
    return { success: true }
  }

  return { error: `Invalid admin credentials.` }
}

export async function logoutAdmin() {
  (await cookies()).delete('hardcoded_admin')
  redirect('/login')
}

export async function requestPasswordReset(email: string, clientOrigin?: string) {
  const normalizedEmail = email?.trim().toLowerCase()
  if (!normalizedEmail) {
    return { error: 'Please provide a valid email address.' }
  }

  const adminSupabase = createAdminClient()

  // 1. Check if user is an administrator
  const { data: authUsers } = await adminSupabase.auth.admin.listUsers()
  const targetUser = authUsers?.users?.find(
    (u) => u.email?.toLowerCase() === normalizedEmail
  )

  if (!targetUser) {
    return { error: 'No user account found with this email.' }
  }

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('is_admin')
    .eq('id', targetUser.id)
    .single()

  if (!profile?.is_admin) {
    return { error: 'Access denied: Only administrators can use the admin password recovery tool.' }
  }

  const origin = clientOrigin || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const redirectUrl = `${origin}/login?mode=update-password`

  // 2. Generate direct recovery link via Admin API
  const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
    type: 'recovery',
    email: normalizedEmail,
    options: {
      redirectTo: redirectUrl,
    },
  })

  if (linkError) {
    return { error: linkError.message }
  }

  // 3. Also trigger standard email dispatch (non-blocking if rate-limited)
  const supabase = await createClient()
  try {
    await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: redirectUrl,
    })
  } catch (err: unknown) {
    console.warn('Standard email reset rate limit or warning:', err)
  }

  return {
    success: true,
    message: 'Password recovery initiated successfully.',
    recoveryLink: linkData?.properties?.action_link || null,
  }
}

export async function updateAdminPassword(password: string) {
  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true, message: 'Your password has been successfully updated.' }
}

export async function instantAdminPasswordReset(email: string, newPass: string) {
  const normalizedEmail = email?.trim().toLowerCase()
  if (!normalizedEmail || !newPass || newPass.length < 6) {
    return { error: 'Please enter a valid email and new password (min 6 chars).' }
  }

  const adminSupabase = createAdminClient()
  const { data: authUsers } = await adminSupabase.auth.admin.listUsers()
  const targetUser = authUsers?.users?.find(
    (u) => u.email?.toLowerCase() === normalizedEmail
  )

  if (!targetUser) {
    return { error: 'No administrator account found with this email.' }
  }

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('is_admin')
    .eq('id', targetUser.id)
    .single()

  if (!profile?.is_admin) {
    return { error: 'Security restriction: Account is not an administrator.' }
  }

  const { error } = await adminSupabase.auth.admin.updateUserById(targetUser.id, {
    password: newPass,
  })

  if (error) {
    return { error: error.message }
  }

  return {
    success: true,
    message: `Password updated successfully for ${normalizedEmail}. You can now login.`,
  }
}
