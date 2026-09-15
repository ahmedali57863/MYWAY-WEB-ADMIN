import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { LogoutButton } from './LogoutButton'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Use the admin client to bypass RLS and fetch the profile.
  // Actually, wait: we can just use the regular server client to fetch the user's own profile.
  // Assuming the user has RLS access to read their own profile.
  // If not, we can use the admin client. The prompt implies profiles.is_admin is standard.
  // Let's use the admin client to ensure we can read it if RLS is strict, or just the normal client.
  // Using the admin client here is a good demonstration of server-only usage.
  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/not-authorized')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-indigo-900 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Admin Portal</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link
            href="/pending-approvals"
            className="block px-4 py-2 rounded-md hover:bg-indigo-800 transition-colors"
          >
            Pending Approvals
          </Link>
          <Link
            href="/support"
            className="block px-4 py-2 rounded-md hover:bg-indigo-800 transition-colors"
          >
            Support Inbox
          </Link>
          <Link
            href="/broadcast"
            className="block px-4 py-2 rounded-md hover:bg-indigo-800 transition-colors"
          >
            Broadcast Notification
          </Link>
        </nav>
        <div className="p-4 border-t border-indigo-800">
          <div className="mb-4 text-sm text-indigo-300 truncate">
            {user.email}
          </div>
          <LogoutButton />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
