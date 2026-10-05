import { createAdminClient } from '@/utils/supabase/admin'
import StudentVerificationsClient from './StudentVerificationsClient'
import { getSignedUrl } from './actions'

export const dynamic = 'force-dynamic'

export default async function StudentVerificationsPage() {
  const supabase = createAdminClient()

  // Fetch pending student verifications
  const { data: verifications, error: verificationsError } = await supabase
    .from('student_verifications')
    .select(`
      *,
      profiles:user_id (
        full_name,
        phone
      )
    `)
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })

  if (verificationsError) {
    console.error('Error fetching student verifications:', verificationsError)
  }

  // Fetch active students from profiles table
  const { data: activeStudents, error: activeStudentsError } = await supabase
    .from('profiles')
    .select('id, full_name, phone, verification_expiry_date, created_at')
    .eq('verification_tier', 'student')
    .order('verification_expiry_date', { ascending: true })

  if (activeStudentsError) {
    console.error('Error fetching active students:', activeStudentsError)
  }

  // Pre-fetch signed URLs
  const enhancedVerifications = await Promise.all((verifications || []).map(async (v) => {
    return {
      ...v,
      card_signed_url: await getSignedUrl(v.student_card_url),
    }
  }))

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between pb-6 border-b border-gray-200">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Student Verifications</h2>
          <p className="text-sm text-gray-500 mt-1">Review student ID cards and track active student time limits</p>
        </div>
      </div>
      <StudentVerificationsClient 
        verifications={enhancedVerifications}
        activeStudents={activeStudents || []}
      />
    </main>
  )
}
