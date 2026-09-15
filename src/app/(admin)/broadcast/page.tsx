import BroadcastClient from './BroadcastClient'

export const dynamic = 'force-dynamic'

export default function BroadcastPage() {
  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Broadcast Notification</h2>
      <p className="text-gray-600 mb-8">Send a push notification alert to all registered users.</p>
      
      <BroadcastClient />
    </main>
  )
}
