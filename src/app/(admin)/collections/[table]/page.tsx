import { createAdminClient, getSignedUrlsBatch } from '@/utils/supabase/admin'
import RoutesCollectionClient, { EnrichedRoute } from '../components/RoutesCollectionClient'
import VehiclesCollectionClient, { EnrichedVehicle } from '../components/VehiclesCollectionClient'
import RideDemandCollectionClient, { EnrichedRideDemand } from '../components/RideDemandCollectionClient'
import MatchesCollectionClient, { EnrichedMatch } from '../components/MatchesCollectionClient'
import NotificationsCollectionClient, { EnrichedNotification } from '../components/NotificationsCollectionClient'
import GenericCollectionClient from '../components/GenericCollectionClient'

export const dynamic = 'force-dynamic'

export default async function CollectionPage({ params }: { params: Promise<{ table: string }> }) {
  const resolvedParams = await params
  const table = resolvedParams?.table ? decodeURIComponent(resolvedParams.table) : ''

  if (!table) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-bold text-rose-600 mb-4">No collection specified</h2>
        <p className="text-gray-600">Please choose a valid collection from the sidebar.</p>
      </div>
    )
  }

  const supabase = createAdminClient()

  const fetchProfiles = () =>
    supabase.from('profiles').select('id, full_name, phone, avatar_url')

  const buildProfilesMap = (profilesData: any[] | null) => {
    const map = new Map<string, { full_name: string; phone: string | null; avatar_url: string | null }>()
    if (profilesData) {
      profilesData.forEach((p) => {
        map.set(p.id, {
          full_name: p.full_name || 'Unnamed User',
          phone: p.phone || null,
          avatar_url: p.avatar_url || null,
        })
      })
    }
    return map
  }

  // Specialized view: ROUTES
  if (table === 'routes') {
    const [{ data: profilesData }, { data: rawRoutes, error }] = await Promise.all([
      fetchProfiles(),
      supabase.from('routes').select('*').order('created_at', { ascending: false }).limit(200)
    ])

    if (error) {
      return <div className="p-6 text-rose-600 font-bold">Error loading routes: {error.message}</div>
    }

    const profilesMap = buildProfilesMap(profilesData)

    const enrichedRoutes: EnrichedRoute[] = (rawRoutes || []).map((r) => {
      const profile = profilesMap.get(r.user_id)
      return {
        id: r.id,
        user_id: r.user_id,
        user_name: profile?.full_name || 'Unknown User',
        user_phone: profile?.phone || null,
        user_avatar: profile?.avatar_url || null,
        start_address: r.start_address || 'Unspecified origin',
        end_address: r.end_address || 'Unspecified destination',
        departure_time: r.departure_time || '00:00:00',
        days_of_week: r.days_of_week || null,
        role: r.role || 'either',
        monthly_cost_estimate: r.monthly_cost_estimate || null,
        is_active: r.is_active ?? true,
        created_at: r.created_at || new Date().toISOString(),
        raw_data: r,
      }
    })

    return <RoutesCollectionClient routes={enrichedRoutes} />
  }

  // Specialized view: VEHICLES
  if (table === 'vehicles') {
    const [{ data: profilesData }, { data: rawVehicles, error: vehiclesError }, { data: driverApps }] =
      await Promise.all([
        fetchProfiles(),
        supabase.from('vehicles').select('*').order('created_at', { ascending: false }).limit(200),
        supabase
          .from('driver_applications')
          .select('vehicle_id, user_id, registration_doc_url, license_doc_url, status')
          .order('submitted_at', { ascending: false }),
      ])

    if (vehiclesError) {
      return <div className="p-6 text-rose-600 font-bold">Error loading vehicles: {vehiclesError.message}</div>
    }

    const profilesMap = buildProfilesMap(profilesData)

    // Map driver applications by vehicle_id and user_id fallback
    const appByVehicleId = new Map<string, any>()
    const appByUserId = new Map<string, any>()
    if (driverApps) {
      driverApps.forEach((app) => {
        if (app.vehicle_id && !appByVehicleId.has(app.vehicle_id)) {
          appByVehicleId.set(app.vehicle_id, app)
        }
        if (app.user_id && !appByUserId.has(app.user_id)) {
          appByUserId.set(app.user_id, app)
        }
      })
    }

    // Collect document paths to batch sign in ONE storage call
    const docPaths: string[] = []
    ;(rawVehicles || []).forEach((v) => {
      const app = appByVehicleId.get(v.id) || appByUserId.get(v.user_id)
      if (app?.registration_doc_url) docPaths.push(app.registration_doc_url)
      if (app?.license_doc_url) docPaths.push(app.license_doc_url)
    })

    const signedUrlsMap = await getSignedUrlsBatch(docPaths)

    const enrichedVehicles: EnrichedVehicle[] = (rawVehicles || []).map((v) => {
      const profile = profilesMap.get(v.user_id)
      const app = appByVehicleId.get(v.id) || appByUserId.get(v.user_id)
      const registration_doc_url = app?.registration_doc_url || null
      const license_doc_url = app?.license_doc_url || null

      const registration_doc_signed_url = registration_doc_url
        ? signedUrlsMap.get(registration_doc_url) || null
        : null
      const license_doc_signed_url = license_doc_url
        ? signedUrlsMap.get(license_doc_url) || null
        : null

      return {
        id: v.id,
        user_id: v.user_id,
        driver_name: profile?.full_name || 'Unassigned Driver',
        driver_phone: profile?.phone || null,
        driver_avatar: profile?.avatar_url || null,
        reg_number: v.reg_number || 'UNKNOWN',
        brand: v.brand || 'Vehicle',
        variant: v.variant || null,
        type: v.type || 'car',
        color: v.color || 'Standard',
        model_year: v.model_year || 2022,
        capacity: v.capacity || 4,
        has_ac: v.has_ac ?? false,
        is_active: v.is_active ?? true,
        created_at: v.created_at || new Date().toISOString(),
        registration_doc_url,
        registration_doc_signed_url,
        license_doc_url,
        license_doc_signed_url,
        application_status: app?.status || null,
        raw_data: v,
      }
    })

    return <VehiclesCollectionClient vehicles={enrichedVehicles} />
  }

  // Specialized view: RIDE DEMAND
  if (table === 'ride_demand') {
    const [{ data: profilesData }, { data: rawDemands, error }] = await Promise.all([
      fetchProfiles(),
      supabase.from('ride_demand').select('*').order('created_at', { ascending: false }).limit(200)
    ])

    if (error) {
      return <div className="p-6 text-rose-600 font-bold">Error loading ride demand: {error.message}</div>
    }

    const profilesMap = buildProfilesMap(profilesData)

    const enrichedDemands: EnrichedRideDemand[] = (rawDemands || []).map((d) => {
      const profile = profilesMap.get(d.user_id)
      return {
        id: d.id,
        user_id: d.user_id,
        rider_name: profile?.full_name || 'Unknown Passenger',
        rider_phone: profile?.phone || null,
        rider_avatar: profile?.avatar_url || null,
        pickup_address: d.pickup_address || 'Unspecified pickup',
        dropoff_address: d.dropoff_address || 'Unspecified dropoff',
        schedule_type: d.schedule_type || 'daily',
        days_of_week: d.days_of_week || null,
        specific_date: d.specific_date || null,
        time_window_start: d.time_window_start || '00:00:00',
        time_window_end: d.time_window_end || null,
        is_fulfilled: d.is_fulfilled ?? false,
        created_at: d.created_at || new Date().toISOString(),
        raw_data: d,
      }
    })

    return <RideDemandCollectionClient demands={enrichedDemands} />
  }

  // Specialized view: MATCHES
  if (table === 'matches') {
    const [{ data: profilesData }, { data: rawMatches, error }] = await Promise.all([
      fetchProfiles(),
      supabase.from('matches').select('*').order('created_at', { ascending: false }).limit(200)
    ])

    if (error) {
      return <div className="p-6 text-rose-600 font-bold">Error loading matches: {error.message}</div>
    }

    const profilesMap = buildProfilesMap(profilesData)

    const enrichedMatches: EnrichedMatch[] = (rawMatches || []).map((m) => {
      const userA = profilesMap.get(m.user_a_id)
      const userB = profilesMap.get(m.user_b_id)
      return {
        id: m.id,
        user_a_id: m.user_a_id,
        user_a_name: userA?.full_name || 'Passenger / Sender',
        user_a_phone: userA?.phone || null,
        user_a_avatar: userA?.avatar_url || null,
        user_b_id: m.user_b_id,
        user_b_name: userB?.full_name || 'Driver / Receiver',
        user_b_phone: userB?.phone || null,
        user_b_avatar: userB?.avatar_url || null,
        route_a_id: m.route_a_id || null,
        route_b_id: m.route_b_id || null,
        demand_id: m.demand_id || null,
        proposed_fare: m.proposed_fare || null,
        status: m.status || 'pending',
        created_at: m.created_at || new Date().toISOString(),
        raw_data: m,
      }
    })

    return <MatchesCollectionClient matches={enrichedMatches} />
  }

  // Specialized view: NOTIFICATIONS
  if (table === 'notifications') {
    const [{ data: profilesData }, { data: rawNotifs, error }] = await Promise.all([
      fetchProfiles(),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(200)
    ])

    if (error) {
      return <div className="p-6 text-rose-600 font-bold">Error loading notifications: {error.message}</div>
    }

    const profilesMap = buildProfilesMap(profilesData)

    const enrichedNotifications: EnrichedNotification[] = (rawNotifs || []).map((n) => {
      const profile = profilesMap.get(n.user_id)
      return {
        id: n.id,
        user_id: n.user_id,
        user_name: profile?.full_name || 'User Account',
        user_phone: profile?.phone || null,
        user_avatar: profile?.avatar_url || null,
        type: n.type || 'system_alert',
        title: n.title || 'System Notification',
        message: n.message || '',
        related_entity_id: n.related_entity_id || null,
        related_entity_type: n.related_entity_type || null,
        is_read: n.is_read ?? false,
        created_at: n.created_at || new Date().toISOString(),
        raw_data: n,
      }
    })

    return <NotificationsCollectionClient notifications={enrichedNotifications} />
  }

  // Fallback for any generic table
  let { data, error } = await supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error && (error.message?.includes('created_at') || error.code === '42703')) {
    const fallback = await supabase
      .from(table)
      .select('*')
      .limit(100)
    data = fallback.data
    error = fallback.error
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-rose-800 mb-2 capitalize">Error loading {table.replace(/_/g, ' ')}</h2>
          <p className="text-sm text-rose-600 font-mono">{error.message}</p>
        </div>
      </div>
    )
  }

  return <GenericCollectionClient table={table} data={data || []} />
}
