import { createAdminClient } from '@/utils/supabase/admin'
import UsersClient, { UserProfile } from './UsersClient'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const adminSupabase = createAdminClient()

  // Fetch all profiles from Supabase using admin client
  const { data: profiles, error: profilesError } = await adminSupabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (profilesError) {
    console.error('Error fetching users/profiles:', profilesError)
  }

  // Fetch verifications to map status
  const { data: verifications } = await adminSupabase
    .from('verifications')
    .select('user_id, status')

  const { data: driverApps } = await adminSupabase
    .from('driver_applications')
    .select('user_id, status')

  const { data: studentVerifs } = await adminSupabase
    .from('student_verifications')
    .select('user_id, status')

  const { data: routes } = await adminSupabase.from('routes').select('user_id')
  const { data: demands } = await adminSupabase.from('ride_demand').select('user_id')
  const { data: matches } = await adminSupabase.from('matches').select('user_a_id, user_b_id')

  const { data: authData } = await adminSupabase.auth.admin.listUsers()

  const userStats = new Map<string, { routes: number, demands: number, matches: number }>()
  
  routes?.forEach(r => {
    if (!userStats.has(r.user_id)) userStats.set(r.user_id, { routes: 0, demands: 0, matches: 0 })
    userStats.get(r.user_id)!.routes += 1
  })
  
  demands?.forEach(d => {
    if (!userStats.has(d.user_id)) userStats.set(d.user_id, { routes: 0, demands: 0, matches: 0 })
    userStats.get(d.user_id)!.demands += 1
  })
  
  matches?.forEach(m => {
    if (m.user_a_id) {
      if (!userStats.has(m.user_a_id)) userStats.set(m.user_a_id, { routes: 0, demands: 0, matches: 0 })
      userStats.get(m.user_a_id)!.matches += 1
    }
    if (m.user_b_id) {
      if (!userStats.has(m.user_b_id)) userStats.set(m.user_b_id, { routes: 0, demands: 0, matches: 0 })
      userStats.get(m.user_b_id)!.matches += 1
    }
  })

  const verificationMap = new Map((verifications || []).map((v) => [v.user_id, v.status]))
  const driverMap = new Map((driverApps || []).map((d) => [d.user_id, d.status]))
  const studentMap = new Map((studentVerifs || []).map((s) => [s.user_id, s.status]))
  const authUsersMap = new Map((authData?.users || []).map((u) => [u.id, u.email]))

  type ProfileRow = {
    id: string
    full_name?: string | null
    email?: string | null
    phone?: string | null
    avatar_url?: string | null
    is_admin?: boolean | null
    created_at?: string | null
    updated_at?: string | null
    city?: string | null
    city_region?: string | null
    address?: string | null
    verification_status?: string | null
    is_pro?: boolean | null
    is_verified_driver?: boolean | null
    verification_tier?: string | null
    cnic_verified?: boolean | null
  }

  const mappedUsers: UserProfile[] = ((profiles as ProfileRow[] | null) || []).map((p) => {
    // Map identity status properly based on profiles table
    let identityStatus = p.verification_status || 'unverified'
    if (identityStatus === 'unverified' && verificationMap.get(p.id)) {
      identityStatus = verificationMap.get(p.id)!
    }
    
    // Capitalize first letter
    identityStatus = identityStatus.charAt(0).toUpperCase() + identityStatus.slice(1)

    // Map driver status properly
    const driverStatus = p.is_verified_driver ? 'Verified' : (driverMap.get(p.id) || 'None')

    return {
      id: p.id,
      email: p.email || authUsersMap.get(p.id) || null,
      full_name: p.full_name || 'Unnamed User',
      phone: p.phone || null,
      avatar_url: p.avatar_url || null,
      is_admin: p.is_admin || false,
      created_at: p.created_at || null,
      updated_at: p.updated_at || null,
      city: p.city || p.address || null,
      city_region: p.city_region || null,
      address: p.address || null,
      identity_status: identityStatus,
      driver_status: driverStatus,
      student_status: studentMap.get(p.id) || 'None',
      verification_status: p.verification_status || 'unverified',
      is_pro: p.is_pro || false,
      is_verified_driver: p.is_verified_driver || false,
      verification_tier: p.verification_tier || 'standard',
      cnic_verified: p.cnic_verified || false,
      routes_published: userStats.get(p.id)?.routes || 0,
      ride_demands: userStats.get(p.id)?.demands || 0,
      matches_found: userStats.get(p.id)?.matches || 0,
    }
  })

  return (
    <main className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-gray-200 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Users Management</h2>
          <p className="text-sm text-gray-500 mt-1">View, inspect detailed profiles, and manage registered account details</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-2 flex items-center gap-3">
          <span className="text-xs font-bold text-indigo-700 uppercase">Total Accounts</span>
          <span className="text-lg font-black text-indigo-900">{mappedUsers.length}</span>
        </div>
      </div>

      <UsersClient users={mappedUsers} />
    </main>
  )
}
