import { createAdminClient } from '@/utils/supabase/admin'
import OverviewClient from './OverviewClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createAdminClient()

  // Concurrently fetch counts and recent users
  const [
    { count: totalUsers },
    { count: totalRoutes },
    { count: totalMatches },
    { count: verifiedDrivers },
    { count: pendingApprovals },
    { data: recentProfiles }
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('routes').select('id', { count: 'exact', head: true }),
    supabase.from('matches').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_verified_driver', true),
    supabase.from('verifications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('id, full_name, phone, city_region, verification_status, created_at, avatar_url').order('created_at', { ascending: false }).limit(6)
  ])

  return (
    <OverviewClient
      stats={{
        totalUsers: totalUsers ?? 0,
        totalRoutes: totalRoutes ?? 0,
        totalMatches: totalMatches ?? 0,
        verifiedDrivers: verifiedDrivers ?? 0,
        pendingApprovals: pendingApprovals ?? 0,
      }}
      recentUsers={recentProfiles || []}
    />
  )
}
