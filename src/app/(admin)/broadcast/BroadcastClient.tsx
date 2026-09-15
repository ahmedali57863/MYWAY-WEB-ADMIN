'use client'

import { useState } from 'react'
import { broadcastNotification } from './actions'

type BroadcastSummary = {
  attempted: number
  succeeded: number
  failed: number
  staleRemoved: number
  optedOut: number
  totalRegistered: number
}

export default function BroadcastClient() {
  const [heading, setHeading] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [summary, setSummary] = useState<BroadcastSummary | null>(null)

  const handleSend = async () => {
    if (!heading.trim() || !message.trim()) {
      alert('Please enter both heading and message.')
      return
    }

    if (!confirm('Are you sure you want to send this push notification to ALL users? This action is irreversible.')) {
      return
    }

    setSending(true)
    setSummary(null)
    
    try {
      const data = await broadcastNotification(heading, message)
      setSummary(data)
      setHeading('')
      setMessage('')
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="space-y-4">
          <div>
            <label htmlFor="heading" className="block text-sm font-semibold text-gray-700 mb-1">
              Heading
            </label>
            <input
              id="heading"
              type="text"
              className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="e.g., New Feature Alert!"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              maxLength={60}
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-1">
              Message
            </label>
            <textarea
              id="message"
              className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              rows={5}
              placeholder="Enter the notification body here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleSend}
              disabled={sending || !heading.trim() || !message.trim()}
              className="w-full py-3 px-4 bg-indigo-600 text-white rounded-md font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex justify-center items-center"
            >
              {sending ? 'Sending...' : 'Send to All Users'}
            </button>
          </div>
        </div>
      </div>

      {summary && (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">Broadcast Summary</h3>
          <p className="text-gray-600 text-sm text-center mb-6 italic">
            Sent to {summary.attempted} of {summary.totalRegistered} registered devices ({summary.optedOut} opted out).
          </p>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <span className="text-gray-600">Total Attempted:</span>
              <span className="font-bold text-gray-900">{summary.attempted}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <span className="text-gray-600">Succeeded:</span>
              <span className="font-bold text-green-600">{summary.succeeded}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <span className="text-gray-600">Failed:</span>
              <span className="font-bold text-red-600">{summary.failed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Stale Tokens Removed:</span>
              <span className="font-bold text-gray-900">{summary.staleRemoved}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
