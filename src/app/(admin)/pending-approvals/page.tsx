import { createClient } from '@/utils/supabase/server'
import PendingApprovalsClient from './PendingApprovalsClient'
import { getSignedUrl } from './actions'

export const dynamic = 'force-dynamic'

export default async function PendingApprovalsPage() {
  const supabase = await createClient()

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

  // Pre-fetch signed URLs for identity verifications
  const enhancedVerifications = await Promise.all((verifications || []).map(async (v) => {
    return {
      ...v,
      selfie_signed_url: await getSignedUrl(v.selfie_url),
      cnic_front_signed_url: await getSignedUrl(v.cnic_front_url),
      cnic_back_signed_url: await getSignedUrl(v.cnic_back_url),
    }
  }))

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

  // Pre-fetch signed URLs for driver applications
  const enhancedDriverApps = await Promise.all((driverApps || []).map(async (app) => {
    return {
      ...app,
      license_signed_url: await getSignedUrl(app.license_doc_url),
      registration_signed_url: await getSignedUrl(app.registration_doc_url),
    }
  }))

  return (
    <main className="p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Pending Approvals</h2>
      <PendingApprovalsClient 
        verifications={enhancedVerifications} 
        driverApplications={enhancedDriverApps} 
      />
    </main>
  )
}
