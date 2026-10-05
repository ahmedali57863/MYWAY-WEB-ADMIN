import { createAdminClient, getSignedUrlsBatch } from '@/utils/supabase/admin'
import PendingApprovalsClient from './PendingApprovalsClient'

export const dynamic = 'force-dynamic'

export default async function PendingApprovalsPage() {
  const supabase = createAdminClient()

  // Concurrently fetch all relevant tables without brittle PostgREST nested joins
  const [
    { data: profiles, error: profilesError },
    { data: driverApplications, error: driverAppError },
    { data: vehicles, error: vehiclesError },
    { data: verifications, error: verificationsError },
    { data: authData }
  ] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('driver_applications').select('*').order('submitted_at', { ascending: false }),
    supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
    supabase.from('verifications').select('*').order('submitted_at', { ascending: false }),
    supabase.auth.admin.listUsers()
  ])

  if (profilesError) console.error('Error fetching profiles in PendingApprovalsPage:', profilesError)
  if (driverAppError) console.error('Error fetching driver_applications in PendingApprovalsPage:', driverAppError)
  if (vehiclesError) console.error('Error fetching vehicles in PendingApprovalsPage:', vehiclesError)
  if (verificationsError) console.error('Error fetching verifications in PendingApprovalsPage:', verificationsError)

  // Map lookups
  const authUsersMap = new Map((authData?.users || []).map((u) => [u.id, u.email]))
  const profilesMap = new Map((profiles || []).map((p) => [p.id, p]))

  const vehiclesByUser = new Map<string, any>()
  const vehiclesById = new Map<string, any>()
  vehicles?.forEach((v) => {
    if (v.user_id && !vehiclesByUser.has(v.user_id)) {
      vehiclesByUser.set(v.user_id, v)
    }
    if (v.id) {
      vehiclesById.set(v.id, v)
    }
  })

  // Collect all storage paths for batch signed URLs
  const pathsToSign: string[] = []
  const addPath = (p: string | null | undefined) => {
    if (p && typeof p === 'string' && !p.startsWith('http') && !p.startsWith('data:')) {
      pathsToSign.push(p)
    }
  }

  driverApplications?.forEach((app) => {
    addPath(app.license_doc_url)
    addPath(app.registration_doc_url)
    addPath(app.vehicle_photo_url)
    addPath(app.photo_url)
  })

  vehicles?.forEach((v) => {
    addPath(v.photo_url)
    addPath(v.vehicle_photo_url)
    addPath(v.registration_doc_url)
    addPath(v.license_doc_url)
  })

  verifications?.forEach((v) => {
    addPath(v.selfie_url)
    addPath(v.cnic_front_url)
    addPath(v.cnic_back_url)
  })

  profiles?.forEach((p) => {
    addPath(p.avatar_url)
  })

  const signedUrlsMap = await getSignedUrlsBatch(pathsToSign)

  // Enrich driver applications
  const enrichedDriverApps = (driverApplications || []).map((app) => {
    const prof = profilesMap.get(app.user_id) || {}
    const email = prof.email || authUsersMap.get(app.user_id) || null
    const veh = (app.vehicle_id ? vehiclesById.get(app.vehicle_id) : null) || vehiclesByUser.get(app.user_id) || null

    const regDocSignedUrl = app.registration_doc_url
      ? signedUrlsMap.get(app.registration_doc_url) || null
      : veh?.registration_doc_url
      ? signedUrlsMap.get(veh.registration_doc_url) || null
      : null

    const licenseDocSignedUrl = app.license_doc_url
      ? signedUrlsMap.get(app.license_doc_url) || null
      : veh?.license_doc_url
      ? signedUrlsMap.get(veh.license_doc_url) || null
      : null

    const photoSignedUrl =
      (app.vehicle_photo_url && signedUrlsMap.get(app.vehicle_photo_url)) ||
      (app.photo_url && signedUrlsMap.get(app.photo_url)) ||
      (veh?.photo_url && signedUrlsMap.get(veh.photo_url)) ||
      (veh?.vehicle_photo_url && signedUrlsMap.get(veh.vehicle_photo_url)) ||
      regDocSignedUrl ||
      null

    const avatarSignedUrl = prof.avatar_url ? signedUrlsMap.get(prof.avatar_url) || prof.avatar_url : null

    return {
      ...app,
      profiles: {
        id: app.user_id,
        full_name: prof.full_name || 'Driver Applicant',
        phone: prof.phone || null,
        email: email,
        avatar_url: avatarSignedUrl,
        cnic_number: prof.cnic_number || prof.cnic || null,
      },
      vehicles: veh,
      license_signed_url: licenseDocSignedUrl,
      registration_signed_url: regDocSignedUrl,
      vehicle_photo_signed_url: photoSignedUrl,
    }
  })

  // Separate Driver Applications by status
  const pendingDriverApps = enrichedDriverApps.filter(
    (a) => {
      const s = (a.status || '').toLowerCase()
      return s === 'pending' || s === 'submitted' || s === 'under_review'
    }
  )

  const approvedDriverApps = enrichedDriverApps.filter(
    (a) => (a.status || '').toLowerCase() === 'approved'
  )

  const rejectedDriverApps = enrichedDriverApps.filter(
    (a) => (a.status || '').toLowerCase() === 'rejected'
  )

  // Enrich Identity Verifications
  const seenVerifUserIds = new Set<string>()
  const enrichedVerifications = (verifications || []).map((v) => {
    if (v.user_id) seenVerifUserIds.add(v.user_id)
    const prof = profilesMap.get(v.user_id) || {}
    const email = prof.email || authUsersMap.get(v.user_id) || null
    const avatarSignedUrl = prof.avatar_url ? signedUrlsMap.get(prof.avatar_url) || prof.avatar_url : null

    return {
      ...v,
      profiles: {
        id: v.user_id,
        full_name: prof.full_name || v.full_name || 'Identity Applicant',
        phone: prof.phone || v.phone || null,
        email: email,
        avatar_url: avatarSignedUrl,
        cnic_number: v.cnic_number || prof.cnic_number || prof.cnic || null,
      },
      selfie_signed_url: v.selfie_url ? signedUrlsMap.get(v.selfie_url) || null : null,
      cnic_front_signed_url: v.cnic_front_url ? signedUrlsMap.get(v.cnic_front_url) || null : null,
      cnic_back_signed_url: v.cnic_back_url ? signedUrlsMap.get(v.cnic_back_url) || null : null,
    }
  })

  // Also catch any profiles with pending verification status that don't have a verifications row
  profiles?.forEach((p) => {
    if (
      p.verification_status?.toLowerCase() === 'pending' &&
      !seenVerifUserIds.has(p.id)
    ) {
      const email = p.email || authUsersMap.get(p.id) || null
      const avatarSignedUrl = p.avatar_url ? signedUrlsMap.get(p.avatar_url) || p.avatar_url : null
      enrichedVerifications.push({
        id: p.id,
        user_id: p.id,
        status: 'pending',
        submitted_at: p.updated_at || p.created_at,
        profiles: {
          id: p.id,
          full_name: p.full_name || 'Identity Applicant',
          phone: p.phone || null,
          email: email,
          avatar_url: avatarSignedUrl,
          cnic_number: p.cnic_number || p.cnic || null,
        },
        selfie_signed_url: null,
        cnic_front_signed_url: null,
        cnic_back_signed_url: null,
      })
    }
  })

  // Filter verifications by status
  const pendingVerifications = enrichedVerifications.filter(
    (v) => (v.status || '').toLowerCase() === 'pending' || (v.status || '').toLowerCase() === 'submitted'
  )

  return (
    <PendingApprovalsClient 
      verifications={pendingVerifications} 
      driverApplications={pendingDriverApps}
      approvedDriverApplications={approvedDriverApps}
      rejectedDriverApplications={rejectedDriverApps}
    />
  )
}

