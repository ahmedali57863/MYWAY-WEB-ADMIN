export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Sidebar from './Sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const isHardcodedAdmin = cookieStore.get('hardcoded_admin')?.value === 'true'

  if (!isHardcodedAdmin) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-gray-900 antialiased">
      <Sidebar userEmail="Admin User" />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </div>
    </div>
  )
}
