'use client'

import { useState, useMemo } from 'react'
import { deleteCollectionRecord } from '../actions'

export type EnrichedNotification = {
  id: string
  user_id: string
  user_name: string
  user_phone: string | null
  user_avatar: string | null
  type: string
  title: string
  message: string
  related_entity_id: string | null
  related_entity_type: string | null
  is_read: boolean
  created_at: string
  raw_data?: any
}

export default function NotificationsCollectionClient({ notifications: initialNotifications }: { notifications: EnrichedNotification[] }) {
  const [notifications, setNotifications] = useState<EnrichedNotification[]>(initialNotifications)
  const [search, setSearch] = useState('')
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [showRawMap, setShowRawMap] = useState<Record<string, boolean>>({})

  const totalCount = notifications.length
  const readCount = notifications.filter((n) => n.is_read).length
  const unreadCount = notifications.filter((n) => !n.is_read).length

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (readFilter === 'unread' && n.is_read) return false
      if (readFilter === 'read' && !n.is_read) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        n.user_name.toLowerCase().includes(q) ||
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        n.type.toLowerCase().includes(q) ||
        (n.user_phone && n.user_phone.toLowerCase().includes(q))
      )
    })
  }, [notifications, readFilter, search])

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const copyToClipboard = (text: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const toggleRaw = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setShowRawMap((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to permanently delete this notification record from the database?')) {
      return
    }
    setDeletingId(id)
    try {
      await deleteCollectionRecord('notifications', id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (err: any) {
      alert(err.message || 'Failed to delete notification')
    } finally {
      setDeletingId(null)
    }
  }

  const getTypeBadge = (type: string) => {
    if (type.includes('approved')) {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">Approval</span>
    }
    if (type.includes('rejected')) {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 uppercase">Rejection</span>
    }
    if (type.includes('request')) {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 uppercase">Ride Request</span>
    }
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 uppercase">{type.replace('_', ' ')}</span>
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-rose-100 text-rose-800">
              Notification Push Telemetry
            </span>
            <span className="text-xs text-gray-500 font-mono">public.notifications</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight mt-1">Push Notifications Audit</h2>
          <p className="text-sm text-gray-500">History of user alerts, ride updates, verification notifications and read receipts</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Total Sent</p>
            <p className="text-xl font-black text-gray-900">{totalCount}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 shadow-sm">
            <p className="text-[10px] font-bold text-emerald-700 uppercase">Read</p>
            <p className="text-xl font-black text-emerald-900">{readCount}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 shadow-sm">
            <p className="text-[10px] font-bold text-amber-800 uppercase">Unread</p>
            <p className="text-xl font-black text-amber-900">{unreadCount}</p>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setReadFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              readFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setReadFilter('unread')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              readFilter === 'unread' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-600 hover:text-amber-700'
            }`}
          >
            <span>🔔</span>
            <span>Unread ({unreadCount})</span>
          </button>
          <button
            onClick={() => setReadFilter('read')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              readFilter === 'read' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:text-emerald-700'
            }`}
          >
            <span>✓</span>
            <span>Read ({readCount})</span>
          </button>
        </div>

        <div className="relative sm:w-72">
          <input
            type="text"
            placeholder="Search recipient, title, message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <p className="text-gray-400 text-sm font-medium">No notification events match your criteria.</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isExpanded = expandedId === notif.id
            const isDeleting = deletingId === notif.id

            return (
              <div
                key={notif.id}
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden ${
                  isExpanded ? 'border-rose-500 ring-2 ring-rose-500/10 shadow-md' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  onClick={() => toggleExpand(notif.id)}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-50/50"
                >
                  {/* Recipient info */}
                  <div className="flex items-center gap-3.5 min-w-[200px]">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center font-black text-sm shadow-sm overflow-hidden">
                      {notif.user_avatar ? (
                        <img src={notif.user_avatar} alt={notif.user_name} className="w-full h-full object-cover" />
                      ) : (
                        (notif.user_name?.[0] || 'U').toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 text-sm">{notif.user_name}</p>
                      </div>
                      <p className="text-xs text-gray-400 font-mono">{notif.user_phone || 'No phone'}</p>
                    </div>
                  </div>

                  {/* Title & Message Description */}
                  <div className="flex-1 max-w-2xl">
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeBadge(notif.type)}
                      <h4 className="font-bold text-gray-900 text-sm truncate">{notif.title}</h4>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-1">{notif.message}</p>
                  </div>

                  {/* Read Status, Sent Date & Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                    <div className="flex items-center gap-2">
                      {notif.is_read ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                          <span>✓</span> Read
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Unread
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Sent</p>
                      <p className="text-xs font-semibold text-gray-700">
                        {new Date(notif.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>

                    {/* Delete Action Button */}
                    <button
                      onClick={(e) => handleDelete(notif.id, e)}
                      disabled={isDeleting}
                      title="Delete Notification from Database"
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>{isDeleting ? '...' : 'Delete'}</span>
                    </button>

                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 transition-transform">
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-rose-600' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* PREMIUM DETAILED TELEMETRY DRAWER */}
                {isExpanded && (
                  <div className="bg-[#0B132B] text-slate-100 p-6 border-t border-slate-800 space-y-6">
                    {/* Top Action Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
                        <div>
                          <h4 className="text-sm font-black text-white uppercase tracking-wider">Push Notification Envelope & Delivery</h4>
                          <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                            <span>ID: {notif.id}</span>
                            <button
                              onClick={(e) => copyToClipboard(notif.id, `notif-${notif.id}`, e)}
                              className="text-[10px] text-rose-400 hover:text-rose-300 font-bold underline"
                            >
                              {copiedKey === `notif-${notif.id}` ? '✓ Copied' : 'Copy'}
                            </button>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => handleDelete(notif.id, e)}
                          disabled={isDeleting}
                          className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>{isDeleting ? 'Deleting...' : 'Delete Notification Permanently'}</span>
                        </button>
                        <span className="text-xs text-slate-400 font-mono hidden md:inline">
                          Dispatched: {new Date(notif.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Notification Mobile Push Banner Mockup */}
                    <div className="bg-[#1C2541] rounded-2xl border border-slate-700/60 p-5 space-y-3">
                      <div className="flex items-center justify-between text-slate-400 text-xs pb-2 border-b border-slate-700/40">
                        <span className="font-bold uppercase tracking-wider text-[10px]">Mobile Push Notification Banner Mockup</span>
                        <span>{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-start gap-3 pt-1">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md flex-shrink-0">
                          🚗
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white">Carpool App</span>
                            <span className="text-[10px] text-slate-400">&bull; now</span>
                          </div>
                          <p className="text-sm font-bold text-amber-400 mt-1">{notif.title}</p>
                          <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">{notif.message}</p>
                        </div>
                      </div>
                    </div>

                    {/* Metric Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-[#1C2541] p-3.5 rounded-xl border border-slate-700/60">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Recipient Account</span>
                        <p className="font-bold text-white mt-1">{notif.user_name}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                          <span className="truncate">{notif.user_id}</span>
                          <button
                            onClick={(e) => copyToClipboard(notif.user_id, `u-${notif.id}`, e)}
                            className="text-rose-400 hover:underline flex-shrink-0"
                          >
                            {copiedKey === `u-${notif.id}` ? '✓' : 'Copy'}
                          </button>
                        </p>
                      </div>

                      <div className="bg-[#1C2541] p-3.5 rounded-xl border border-slate-700/60">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Associated Entity Linkage</span>
                        <p className="font-semibold text-white mt-1 capitalize">
                          {notif.related_entity_type || 'System Broadcast'}
                        </p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                          {notif.related_entity_id || 'Global Alert'}
                        </p>
                      </div>

                      <div className="bg-[#1C2541] p-3.5 rounded-xl border border-slate-700/60">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Read Status & Confirmation</span>
                        <p className="font-bold mt-1 text-emerald-400 flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${notif.is_read ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                          {notif.is_read ? 'Confirmed Read by User' : 'Pending in User Device Tray'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Recorded by Supabase notification schema</p>
                      </div>
                    </div>

                    {/* Developer Raw JSON Toggle */}
                    {notif.raw_data && (
                      <div className="pt-2">
                        <button
                          onClick={(e) => toggleRaw(notif.id, e)}
                          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/80 transition"
                        >
                          <span>{showRawMap[notif.id] ? '▼ Hide Developer JSON' : '▶ Show Developer JSON & Payload'}</span>
                        </button>

                        {showRawMap[notif.id] && (
                          <div className="bg-[#050B14] p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-rose-400 overflow-x-auto max-h-60 mt-3 shadow-inner">
                            <pre>{JSON.stringify(notif.raw_data, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
