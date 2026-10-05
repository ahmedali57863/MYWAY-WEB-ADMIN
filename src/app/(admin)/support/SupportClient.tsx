'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { replyToSupportMessage } from './actions'
import { Header, Button, Icon, Badge } from '@/components/ui/FigmaUI'

type SupportMessage = {
  id: string
  user_id: string
  sender_role: 'user' | 'admin' | string
  content: string
  created_at: string
  profiles?: {
    full_name: string | null
    avatar_url: string | null
    phone?: string | null
  }
}

type Thread = {
  user_id: string
  full_name: string
  avatar_url: string | null
  phone: string | null
  last_message: string
  last_message_time: string
  is_admin_reply: boolean
  unread_count: number
  all_messages: SupportMessage[]
}

export default function SupportClient() {
  const supabase = createClient()
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('support_messages')
      .select(`
        id,
        user_id,
        sender_role,
        content,
        created_at,
        profiles (
          full_name,
          avatar_url,
          phone
        )
      `)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching support messages:', error)
      setLoading(false)
      return
    }

    if (data) {
      setMessages(data as any[])
      if (!selectedUserId && data.length > 0) {
        // Default to the user with the most recent message
        const lastMsg = data[data.length - 1]
        setSelectedUserId(lastMsg.user_id)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMessages()

    const channel = supabase
      .channel('support-inbox-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages',
        },
        () => {
          fetchMessages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, selectedUserId])

  // Group messages into threads
  const threadsMap = new Map<string, Thread>()
  messages.forEach((msg) => {
    const existing = threadsMap.get(msg.user_id)
    const isUserSender = msg.sender_role !== 'admin'
    if (!existing) {
      threadsMap.set(msg.user_id, {
        user_id: msg.user_id,
        full_name: msg.profiles?.full_name || 'User #' + msg.user_id.slice(0, 5),
        avatar_url: msg.profiles?.avatar_url || null,
        phone: msg.profiles?.phone || null,
        last_message: msg.content,
        last_message_time: msg.created_at,
        is_admin_reply: !isUserSender,
        unread_count: isUserSender ? 1 : 0,
        all_messages: [msg]
      })
    } else {
      existing.last_message = msg.content
      existing.last_message_time = msg.created_at
      existing.is_admin_reply = !isUserSender
      if (isUserSender) {
        existing.unread_count += 1
      } else {
        existing.unread_count = 0
      }
      existing.all_messages.push(msg)
    }
  })

  const threadList = Array.from(threadsMap.values()).sort(
    (a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
  )

  const filteredThreads = threadList.filter(t => 
    t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeThread = threadList.find(t => t.user_id === selectedUserId) || threadList[0] || null

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeThread || !replyText.trim() || sending) return

    setSending(true)
    try {
      await replyToSupportMessage(activeThread.user_id, replyText.trim())
      setReplyText('')
      await fetchMessages()
    } catch (e: any) {
      alert(e.message || 'Error sending reply')
    } finally {
      setSending(false)
    }
  }

  const openCount = threadList.filter(t => !t.is_admin_reply).length

  return (
    <>
      <Header 
        title="Support inbox" 
        description="Respond to customer inquiries and manage live rider/driver support tickets."
      />

      <section className="support-shell">
        {/* Left Thread List */}
        <aside className="threads">
          <div className="thread-head">
            <h2>Conversations</h2>
            <Badge tone={openCount > 0 ? "warning" : "success"}>
              {openCount} pending
            </Badge>
          </div>

          <label className="search-box">
            <Icon name="search" />
            <input 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', maxHeight: '560px' }}>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                Loading conversations...
              </div>
            ) : filteredThreads.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                No conversations found.
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = activeThread?.user_id === thread.user_id
                const timeStr = formatRelativeTime(thread.last_message_time)
                return (
                  <button 
                    key={thread.user_id} 
                    className={`thread ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedUserId(thread.user_id)}
                  >
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: isSelected ? '#ffffff' : '#e0e7ff',
                      color: '#4f46e5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '14px',
                      flexShrink: 0
                    }}>
                      {thread.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span>
                      <b style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {thread.full_name}
                        {!thread.is_admin_reply && (
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: '#f59e0b',
                            display: 'inline-block'
                          }} />
                        )}
                      </b>
                      <small style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                        {thread.is_admin_reply ? `You: ${thread.last_message}` : thread.last_message}
                      </small>
                    </span>
                    <time>{timeStr}</time>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        {/* Right Active Conversation View */}
        <div className="conversation">
          {activeThread ? (
            <>
              <div className="conversation-head">
                <div className="user-cell">
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#e0e7ff',
                    color: '#4f46e5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '14px'
                  }}>
                    {activeThread.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <b>{activeThread.full_name}</b>
                    <small>
                      <i style={{ background: '#10b981' }} /> {activeThread.phone || 'Customer Account'}
                    </small>
                  </div>
                </div>
                <div>
                  <Badge tone={activeThread.is_admin_reply ? "success" : "warning"}>
                    {activeThread.is_admin_reply ? "Resolved" : "Awaiting Reply"}
                  </Badge>
                </div>
              </div>

              <div className="messages" style={{ minHeight: '340px', maxHeight: '440px', overflowY: 'auto' }}>
                {activeThread.all_messages.map((msg) => {
                  const isAdmin = msg.sender_role === 'admin'
                  const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  return (
                    <div key={msg.id} className={`message ${isAdmin ? 'outbound' : 'inbound'}`}>
                      <div>{msg.content}</div>
                      <time>{time}</time>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              <form className="composer" onSubmit={handleSendReply}>
                <textarea 
                  placeholder={`Reply directly to ${activeThread.full_name}...`} 
                  value={replyText} 
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendReply(e)
                    }
                  }}
                  rows={2}
                />
                <Button disabled={sending || !replyText.trim()}>
                  <Icon name="send" /> {sending ? 'Sending...' : 'Send response'}
                </Button>
              </form>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '48px', color: '#94a3b8' }}>
              <Icon name="mail" size={36} />
              <h3 style={{ marginTop: '12px', fontSize: '16px', fontWeight: 600, color: '#475569' }}>No conversation selected</h3>
              <p style={{ fontSize: '13px', margin: 0 }}>Select a ticket from the left panel to begin replying.</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

function formatRelativeTime(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d`
}
