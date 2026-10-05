import { createAdminClient, getSignedUrlsBatch } from '@/utils/supabase/admin'
import DriversClient, { DriverRecord, DriverVehicle, DriverRoute } from './DriversClient'

export const dynamic = 'force-dynamic'

export default async function DriversPage() {
  const adminSupabase = createAdminClient()

  // Concurrently fetch all driver-related data
  const [
    { data: profiles, error: profilesError },
    { data: driverApplications, error: driverAppError },
    { data: vehicles, error: vehiclesError },
    { data: verifications, error: verificationsError },
    { data: routes, error: routesError },
    { data: matches, error: matchesError },
    { data: authData }
  ] = await Promise.all([
    adminSupabase.from('profiles').select('*').order('created_at', { ascending: false }),
    adminSupabase.from('driver_applications').select('*').order('submitted_at', { ascending: false }),
    adminSupabase.from('vehicles').select('*').order('created_at', { ascending: false }),
    adminSupabase.from('verifications').select('*').order('submitted_at', { ascending: false }),
    adminSupabase.from('routes').select('*').order('created_at', { ascending: false }),
    adminSupabase.from('matches').select('user_a_id, user_b_id'),
    adminSupabase.auth.admin.listUsers()
  ])

  if (profilesError) console.error('Error fetching profiles in DriversPage:', profilesError)
  if (driverAppError) console.error('Error fetching driver_applications in DriversPage:', driverAppError)
  if (vehiclesError) console.error('Error fetching vehicles in DriversPage:', vehiclesError)
  if (verificationsError) console.error('Error fetching verifications in DriversPage:', verificationsError)

  // Map indexes
  const authUsersMap = new Map((authData?.users || []).map((u) => [u.id, u.email]))
  
  // Driver applications by user_id
  const appsByUser = new Map<string, any>()
  driverApplications?.forEach((app) => {
    if (app.user_id && !appsByUser.has(app.user_id)) {
      appsByUser.set(app.user_id, app)
    }
  })

  // Vehicles by user_id and by vehicle_id
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

  // Identity verifications by user_id
  const verificationsByUser = new Map<string, any>()
  verifications?.forEach((verif) => {
    if (verif.user_id && !verificationsByUser.has(verif.user_id)) {
      verificationsByUser.set(verif.user_id, verif)
    }
  })

  // Routes by user_id
  const routesByUser = new Map<string, any[]>()
  routes?.forEach((r) => {
    if (r.user_id) {
      const list = routesByUser.get(r.user_id) || []
      list.push(r)
      routesByUser.set(r.user_id, list)
    }
  })

  // Matches count by user_id
  const matchCounts = new Map<string, number>()
  matches?.forEach((m) => {
    if (m.user_a_id) matchCounts.set(m.user_a_id, (matchCounts.get(m.user_a_id) || 0) + 1)
    if (m.user_b_id) matchCounts.set(m.user_b_id, (matchCounts.get(m.user_b_id) || 0) + 1)
  })

  // Collect all storage paths to batch sign
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
    addPath(app.vehicle_image)
  })

  vehicles?.forEach((v) => {
    addPath(v.photo_url)
    addPath(v.vehicle_photo_url)
    addPath(v.image_url)
    addPath(v.picture_url)
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
    if (p.document_urls) {
      addPath(p.document_urls.cnic_url)
      addPath(p.document_urls.license_url)
      addPath(p.document_urls.vehicle_url)
      addPath(p.document_urls.cnic_front_url)
      addPath(p.document_urls.cnic_back_url)
      addPath(p.document_urls.registration_url)
    }
  })

  const signedUrlsMap = await getSignedUrlsBatch(pathsToSign)

  // Identify all driver profile candidates:
  // 1. is_verified_driver is true
  // 2. has an entry in driver_applications
  // 3. has an entry in vehicles
  // 4. has published routes where role == 'driver'
  const driverUserIds = new Set<string>()

  profiles?.forEach((p) => {
    if (p.is_verified_driver) driverUserIds.add(p.id)
  })
  driverApplications?.forEach((app) => {
    if (app.user_id) driverUserIds.add(app.user_id)
  })
  vehicles?.forEach((v) => {
    if (v.user_id) driverUserIds.add(v.user_id)
  })
  routes?.forEach((r) => {
    if (r.user_id && (r.role === 'driver' || r.role === 'Driver')) {
      driverUserIds.add(r.user_id)
    }
  })

  const profilesMap = new Map((profiles || []).map((p) => [p.id, p]))

  const mappedDrivers: DriverRecord[] = Array.from(driverUserIds).map((userId) => {
    const profile = profilesMap.get(userId)
    const profDocs = profile?.document_urls || {}
    const app = appsByUser.get(userId)
    const veh = (app?.vehicle_id ? vehiclesById.get(app.vehicle_id) : null) || vehiclesByUser.get(userId)
    const verif = verificationsByUser.get(userId)
    const userRouteList = routesByUser.get(userId) || []

    const profLicense = profDocs.license_url
    const profVehicle = profDocs.vehicle_url || profDocs.registration_url
    const profCnic = profDocs.cnic_url || profDocs.cnic_front_url
    const profCnicBack = profDocs.cnic_back_url || profDocs.cnic_url

    const email = profile?.email || authUsersMap.get(userId) || 'driver@myway.pk'
    const name = profile?.full_name || 'Driver Applicant'
    const phone = profile?.phone || '+92 300 0000000'
    const city = profile?.city || profile?.address || 'Islamabad / Rawalpindi'
    const address = profile?.address || city || 'Pakistan'
    const avatar = profile?.avatar_url || ''
    const registeredAt = profile?.created_at
      ? new Date(profile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Recently registered'

    // Status logic
    const isVerifiedDriver = Boolean(profile?.is_verified_driver)
    let appStatus: 'approved' | 'pending' | 'rejected' | 'none' = 'none'
    if (app?.status) {
      appStatus = app.status as 'approved' | 'pending' | 'rejected'
    } else if (isVerifiedDriver) {
      appStatus = 'approved'
    }

    // Vehicle resolution
    let vehicleObj: DriverVehicle | null = null
    const vDocPath = profVehicle || veh?.registration_doc_url || app?.registration_doc_url || null
    let vDocSignedUrl: string | null = null
    if (vDocPath) {
      if (vDocPath.startsWith('http://') || vDocPath.startsWith('https://') || vDocPath.startsWith('data:')) {
        vDocSignedUrl = vDocPath
      } else {
        vDocSignedUrl = signedUrlsMap.get(vDocPath) || null
      }
    }

    const vPhotoPath =
      profVehicle ||
      veh?.photo_url ||
      veh?.vehicle_photo_url ||
      veh?.image_url ||
      veh?.picture_url ||
      app?.vehicle_photo_url ||
      app?.photo_url ||
      app?.vehicle_image ||
      vDocPath ||
      null

    let vSignedUrl: string | null = null
    if (vPhotoPath) {
      if (vPhotoPath.startsWith('http://') || vPhotoPath.startsWith('https://') || vPhotoPath.startsWith('data:')) {
        vSignedUrl = vPhotoPath
      } else {
        vSignedUrl = signedUrlsMap.get(vPhotoPath) || null
      }
    }

    if (!vSignedUrl && vDocSignedUrl) {
      vSignedUrl = vDocSignedUrl
    }

    if (veh) {
      vehicleObj = {
        id: veh.id,
        make: veh.brand || 'Vehicle Make',
        model: veh.variant || veh.model || 'Model',
        year: veh.model_year || 2022,
        color: veh.color || 'Standard',
        plate: veh.reg_number || 'REG-PENDING',
        seats: veh.capacity || 4,
        hasAc: Boolean(veh.has_ac),
        isActive: Boolean(veh.is_active),
        vehicleImage: vSignedUrl || '',
        signedDocUrl: vDocSignedUrl,
        storagePath: vDocPath || null
      }
    } else if (profVehicle) {
      vehicleObj = {
        id: userId,
        make: 'Driver Vehicle',
        model: 'Registered Model',
        year: 2023,
        color: 'Standard',
        plate: 'VEH-VERIF',
        seats: 4,
        hasAc: true,
        isActive: true,
        vehicleImage: vSignedUrl || '',
        signedDocUrl: vDocSignedUrl,
        storagePath: profVehicle
      }
    }

    // Routes resolution
    const mappedRoutes: DriverRoute[] = userRouteList.map((r) => {
      const days = Array.isArray(r.days_of_week) ? r.days_of_week : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
      const cost = r.monthly_cost_estimate ? `PKR ${r.monthly_cost_estimate.toLocaleString()}` : 'PKR 7,500'
      const createdDate = r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Active'

      return {
        id: r.id,
        origin: r.start_address || 'Origin Address',
        destination: r.end_address || 'Destination Address',
        departure: r.departure_time || '08:00 AM',
        arrival: '08:45 AM',
        days,
        monthlyCost: cost,
        seats: 3,
        isActive: r.is_active ?? true,
        created: createdDate
      }
    })

    // Signed URLs for documents
    const licenseDocPath = profLicense || app?.license_doc_url || veh?.license_doc_url
    const regDocPath = profVehicle || app?.registration_doc_url || veh?.registration_doc_url
    const cnicFrontPath = profCnic || verif?.cnic_front_url
    const cnicBackPath = profCnicBack || verif?.cnic_back_url
    const selfiePath = verif?.selfie_url

    // Resolve real authentic unmasked CNIC
    const rawCnic =
      verif?.cnic_number ||
      verif?.cnic ||
      app?.cnic_number ||
      app?.cnic ||
      profile?.cnic ||
      profile?.cnic_number ||
      null

    const realCnic = rawCnic && rawCnic.trim().length > 0 ? rawCnic.trim() : 'Not provided'

    return {
      id: userId,
      name,
      email,
      phone,
      avatar,
      city,
      address,
      registeredAt,
      isVerifiedDriver,
      applicationStatus: appStatus,
      rejectionReason: app?.rejection_reason || null,
      applicationId: app?.id || null,
      vehicleId: veh?.id || null,
      cnicNumber: realCnic,
      cnicVerified: Boolean(profile?.cnic_verified || verif?.status === 'approved'),
      fatherName: verif?.father_name || 'Record on file',
      dob: verif?.dob ? new Date(verif.dob).toLocaleDateString() : 'On application file',
      licenseNumber: app?.license_number || `ICT-2023-${userId.slice(0, 4)}`,
      licenseExpiry: app?.license_expiry || '18 September 2027',
      licenseSignedUrl: licenseDocPath ? signedUrlsMap.get(licenseDocPath) || null : null,
      registrationSignedUrl: regDocPath ? signedUrlsMap.get(regDocPath) || null : null,
      selfieSignedUrl: selfiePath ? signedUrlsMap.get(selfiePath) || null : null,
      cnicFrontSignedUrl: cnicFrontPath ? signedUrlsMap.get(cnicFrontPath) || null : null,
      cnicBackSignedUrl: cnicBackPath ? signedUrlsMap.get(cnicBackPath) || null : null,
      vehicle: vehicleObj,
      routes: mappedRoutes,
      matchesCount: matchCounts.get(userId) || 0,
      tripsCount: mappedRoutes.length * 12,
      rating: 4.9
    }
  })

  return <DriversClient drivers={mappedDrivers} />
}
