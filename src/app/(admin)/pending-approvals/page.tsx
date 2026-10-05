import { createAdminClient } from '@/utils/supabase/admin'
import PendingApprovalsClient from './PendingApprovalsClient'
import { getSignedUrl } from './actions'

export const dynamic = 'force-dynamic'

export default async function PendingApprovalsPage() {
  const supabase = createAdminClient()

  // Fetch pending identity verifications
  const { data: verifications, error: verificationsError } = await supabase
    .from('verifications')
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
    console.error('Error fetching verifications:', verificationsError)
  }

  // Pre-fetch signed URLs for identity verifications concurrently
  const enhancedVerifications = await Promise.all(
    (verifications || []).map(async (v) => {
      const [selfie_signed_url, cnic_front_signed_url, cnic_back_signed_url] = await Promise.all([
        getSignedUrl(v.selfie_url),
        getSignedUrl(v.cnic_front_url),
        getSignedUrl(v.cnic_back_url),
      ])
      return {
        ...v,
        selfie_signed_url,
        cnic_front_signed_url,
        cnic_back_signed_url,
      }
    })
  )

  // Fetch pending driver applications
  const { data: driverApps, error: driverAppsError } = await supabase
    .from('driver_applications')
    .select(`
      *,
      profiles:user_id (full_name),
      vehicles:vehicle_id (*)
    `)
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })

  if (driverAppsError) {
    console.error('Error fetching driver applications:', driverAppsError)
  }

  // Pre-fetch signed URLs for driver applications concurrently
  const enhancedDriverApps = await Promise.all(
    (driverApps || []).map(async (app) => {
      const [license_signed_url, registration_signed_url] = await Promise.all([
        getSignedUrl(app.license_doc_url),
        getSignedUrl(app.registration_doc_url),
      ])
      return {
        ...app,
        license_signed_url,
        registration_signed_url,
      }
    })
  )

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between pb-6 border-b border-gray-200">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Pending Approvals</h2>
          <p className="text-sm text-gray-500 mt-1">Review and action identity verifications and driver requests</p>
        </div>
      </div>
      <PendingApprovalsClient 
        verifications={enhancedVerifications} 
        driverApplications={enhancedDriverApps} 
      />
    </main>
  )
}
