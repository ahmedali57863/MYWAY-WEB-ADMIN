import SupportClient from './SupportClient'

export const dynamic = 'force-dynamic'

export default function SupportPage() {
  return (
    <main className="p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Support Inbox</h2>
      <SupportClient />
    </main>
  )
}
