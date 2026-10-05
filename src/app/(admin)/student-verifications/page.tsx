import { createAdminClient, getSignedUrlsBatch } from '@/utils/supabase/admin'
import StudentVerificationsClient from './StudentVerificationsClient'

export const dynamic = 'force-dynamic'

export default async function StudentVerificationsPage() {
  const supabase = createAdminClient()

  // Concurrently fetch pending student verifications, active students, and auth users
  const [
    { data: verifications, error: verificationsError },
    { data: activeStudents, error: activeStudentsError },
    { data: authData }
  ] = await Promise.all([
    supabase
      .from('student_verifications')
      .select(`
        *,
        profiles:user_id (
          full_name,
          phone
        )
      `)
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true }),
    supabase
      .from('profiles')
      .select('id, full_name, phone, verification_expiry_date, created_at')
      .eq('verification_tier', 'student')
      .order('verification_expiry_date', { ascending: true }),
    supabase.auth.admin.listUsers()
  ])

  const authPhoneMap = new Map((authData?.users || []).map((u) => [u.id, u.phone || '']))

  if (verificationsError) {
    console.error('Error fetching student verifications:', verificationsError)
  }
  if (activeStudentsError) {
    console.error('Error fetching active students:', activeStudentsError)
  }

  // Pre-fetch signed URLs in a single batch
  const cardPaths = (verifications || []).map((v) => v.student_card_url).filter(Boolean)
  const signedUrlsMap = await getSignedUrlsBatch(cardPaths)

  const enhancedVerifications = (verifications || []).map((v) => ({
    ...v,
    card_signed_url: v.student_card_url ? signedUrlsMap.get(v.student_card_url) || null : null,
    profiles: v.profiles ? {
      ...v.profiles,
      phone: v.profiles.phone || authPhoneMap.get(v.user_id) || ''
    } : undefined
  }))

  const enhancedActiveStudents = (activeStudents || []).map((s) => ({
    ...s,
    phone: s.phone || authPhoneMap.get(s.id) || null
  }))

  return (
    <StudentVerificationsClient 
      verifications={enhancedVerifications}
      activeStudents={enhancedActiveStudents}
    />
  )
}
