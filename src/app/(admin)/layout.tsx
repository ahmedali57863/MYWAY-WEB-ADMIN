export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import AdminShell from './AdminShell'

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

  return <AdminShell userEmail="Admin User">{children}</AdminShell>
}
