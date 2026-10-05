'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { replyToSupportMessage } from './actions'

type Thread = {
  user_id: string
  full_name: string
  avatar_url: string | null
  last_message: string
  last_message_time: string
  is_admin_reply: boolean
}

function buildThreads(data: any[]): Thread[] {
  const uniqueThreads = new Map<string, Thread>()
  data.forEach((msg: any) => {
    if (!uniqueThreads.has(msg.user_id)) {
      uniqueThreads.set(msg.user_id, {
        user_id: msg.user_id,
        full_name: msg.profiles?.full_name || 'Unknown User',
        avatar_url: msg.profiles?.avatar_url,
        last_message: msg.content,
        last_message_time: msg.created_at,
        is_admin_reply: msg.sender_role === 'admin',
      })
    }
  })
  return Array.from(uniqueThreads.values())
}

export default function SupportClient() {
  const supabase = createClient()
  const [threads, setThreads] = useState<Thread[]>([])
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchThreads = async () => {
    const { data, error } = await supabase
      .from('support_messages')
      .select(`
        id,
        user_id,
        sender_role,
        content,
        created_at,
        profiles!inner (
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching support messages:', error)
      return
    }

    if (data) {
      setThreads(buildThreads(data))
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchThreads()

    // Subscribe to Realtime changes on support_messages
    const channel = supabase
      .channel('support-inbox-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages',
        },
        (payload) => {
          console.log('[Realtime: support_messages] Received payload:', JSON.stringify(payload, null, 2));
          // Re-fetch the full thread list on any change
          fetchThreads()
        }
      )
      .subscribe((status: string) => {
        console.log('[Realtime: support_messages] Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const pendingThreads = threads.filter(t => !t.is_admin_reply)
  const resolvedThreads = threads.filter(t => t.is_admin_reply)

  const handleSendReply = async () => {
    if (!selectedThread || !replyText.trim()) return

    setSending(true)
    try {
      await replyToSupportMessage(selectedThread.user_id, replyText)
      setReplyText('')
      setSelectedThread(null)
      // No need for alert — Realtime will update the list automatically
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <p className="text-gray-500">Loading support messages...</p>
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Pending Responses ({pendingThreads.length})</h3>
        {pendingThreads.length === 0 ? (
          <p className="text-gray-500 italic">No pending support messages.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingThreads.map(thread => (
              <div key={thread.user_id} className="bg-white p-5 rounded-lg shadow-sm border border-orange-200 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-900">{thread.full_name}</h4>
                  <span className="text-xs text-gray-500">{new Date(thread.last_message_time).toLocaleString()}</span>
                </div>
                <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                  &quot;{thread.last_message}&quot;
                </p>
                <button
                  onClick={() => setSelectedThread(thread)}
                  className="w-full py-2 bg-indigo-50 text-indigo-700 font-medium rounded hover:bg-indigo-100"
                >
                  Reply &amp; Resolve
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Recently Resolved ({resolvedThreads.length})</h3>
        {resolvedThreads.length === 0 ? (
          <p className="text-gray-500 italic">No resolved messages yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {resolvedThreads.map(thread => (
              <div key={thread.user_id} className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-900">{thread.full_name}</h4>
                  <span className="text-xs text-gray-500">{new Date(thread.last_message_time).toLocaleString()}</span>
                </div>
                <p className="text-gray-500 text-sm italic mb-4 line-clamp-3">
                  You: &quot;{thread.last_message}&quot;
                </p>
                <button
                  onClick={() => setSelectedThread(thread)}
                  className="w-full py-2 bg-gray-200 text-gray-700 font-medium rounded hover:bg-gray-300"
                >
                  Send Another Reply
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {selectedThread && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-2">Reply to {selectedThread.full_name}</h3>
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
              <span className="font-semibold text-gray-900 block mb-1">Their last message:</span>
              &quot;{selectedThread.last_message}&quot;
            </div>
            
            <textarea
              className="w-full border border-gray-300 rounded p-3 mb-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              rows={5}
              placeholder="Type your response here. This will be sent as an admin message."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setSelectedThread(null)
                  setReplyText('')
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleSendReply}
                disabled={sending || !replyText.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium disabled:opacity-50 flex items-center"
              >
                {sending ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
