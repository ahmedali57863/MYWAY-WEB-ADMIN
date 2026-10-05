'use client'

import { useState, useMemo } from 'react'
import { deleteCollectionRecord } from '../actions'

export type EnrichedMatch = {
  id: string
  user_a_id: string
  user_a_name: string
  user_a_phone: string | null
  user_a_avatar: string | null
  user_b_id: string
  user_b_name: string
  user_b_phone: string | null
  user_b_avatar: string | null
  route_a_id: string | null
  route_b_id: string | null
  demand_id: string | null
  proposed_fare: number | null
  status: 'pending' | 'accepted' | 'declined' | string
  created_at: string
  raw_data?: any
}

export default function MatchesCollectionClient({ matches: initialMatches }: { matches: EnrichedMatch[] }) {
  const [matches, setMatches] = useState<EnrichedMatch[]>(initialMatches)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [showRawMap, setShowRawMap] = useState<Record<string, boolean>>({})

  const totalCount = matches.length
  const pendingCount = matches.filter((m) => m.status === 'pending').length
  const acceptedCount = matches.filter((m) => m.status === 'accepted').length
  const declinedCount = matches.filter((m) => m.status === 'declined').length

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        m.user_a_name.toLowerCase().includes(q) ||
        m.user_b_name.toLowerCase().includes(q) ||
        (m.user_a_phone && m.user_a_phone.toLowerCase().includes(q)) ||
        (m.user_b_phone && m.user_b_phone.toLowerCase().includes(q)) ||
        m.id.toLowerCase().includes(q)
      )
    })
  }, [matches, statusFilter, search])

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
    if (!confirm('Are you sure you want to permanently delete this match record from the database?')) {
      return
    }
    setDeletingId(id)
    try {
      await deleteCollectionRecord('matches', id)
      setMatches((prev) => prev.filter((m) => m.id !== id))
    } catch (err: any) {
      alert(err.message || 'Failed to delete match')
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Accepted Match
          </span>
        )
      case 'declined':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Declined
          </span>
        )
      case 'pending':
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Pending Response
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800">
              Carpool Matches Engine
            </span>
            <span className="text-xs text-gray-500 font-mono">public.matches</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight mt-1">Ride Connections & Matches</h2>
          <p className="text-sm text-gray-500">Pairs formed between drivers and riders with confirmation status and agreed fares</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Total Matches</p>
            <p className="text-xl font-black text-gray-900">{totalCount}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 shadow-sm">
            <p className="text-[10px] font-bold text-emerald-700 uppercase">Accepted</p>
            <p className="text-xl font-black text-emerald-900">{acceptedCount}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 shadow-sm">
            <p className="text-[10px] font-bold text-amber-800 uppercase">Pending</p>
            <p className="text-xl font-black text-amber-900">{pendingCount}</p>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('accepted')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'accepted' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:text-emerald-700'
            }`}
          >
            Accepted ({acceptedCount})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-600 hover:text-amber-700'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('declined')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'declined' ? 'bg-rose-600 text-white shadow-sm' : 'text-gray-600 hover:text-rose-700'
            }`}
          >
            Declined ({declinedCount})
          </button>
        </div>

        <div className="relative sm:w-72">
          <input
            type="text"
            placeholder="Search either rider or driver name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Matches Cards List */}
      <div className="space-y-3">
        {filteredMatches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <p className="text-gray-400 text-sm font-medium">No matches found matching filter criteria.</p>
          </div>
        ) : (
          filteredMatches.map((match) => {
            const isExpanded = expandedId === match.id
            const isDeleting = deletingId === match.id

            return (
              <div
                key={match.id}
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden ${
                  isExpanded ? 'border-emerald-500 ring-2 ring-emerald-500/10 shadow-md' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  onClick={() => toggleExpand(match.id)}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-50/50"
                >
                  {/* User A (Initiator) vs User B (Receiver) Bridge */}
                  <div className="flex items-center gap-3 sm:gap-6 flex-wrap sm:flex-nowrap flex-1">
                    {/* Initiator */}
                    <div className="flex items-center gap-3 min-w-[180px]">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center font-black text-sm shadow-sm overflow-hidden">
                        {match.user_a_avatar ? (
                          <img src={match.user_a_avatar} alt={match.user_a_name} className="w-full h-full object-cover" />
                        ) : (
                          (match.user_a_name?.[0] || 'A').toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-gray-900 text-sm">{match.user_a_name}</p>
                          <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded">Sender</span>
                        </div>
                        <p className="text-xs text-gray-400 font-mono">{match.user_a_phone || 'No phone'}</p>
                      </div>
                    </div>

                    {/* Connection Arrow & Fare Pill */}
                    <div className="flex flex-col items-center justify-center px-2 min-w-[120px]">
                      {match.proposed_fare ? (
                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full mb-1">
                          Rs. {match.proposed_fare}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-gray-400 mb-1">Standard Share</span>
                      )}
                      <div className="flex items-center gap-1 text-gray-400">
                        <span className="h-0.5 w-6 bg-gray-300"></span>
                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                    </div>

                    {/* Receiver */}
                    <div className="flex items-center gap-3 min-w-[180px]">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-sm shadow-sm overflow-hidden">
                        {match.user_b_avatar ? (
                          <img src={match.user_b_avatar} alt={match.user_b_name} className="w-full h-full object-cover" />
                        ) : (
                          (match.user_b_name?.[0] || 'B').toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-gray-900 text-sm">{match.user_b_name}</p>
                          <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded">Receiver</span>
                        </div>
                        <p className="text-xs text-gray-400 font-mono">{match.user_b_phone || 'No phone'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge & Actions */}
                  <div className="flex items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100">
                    <div>{getStatusBadge(match.status)}</div>

                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Created</p>
                      <p className="text-xs font-semibold text-gray-700">
                        {new Date(match.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>

                    {/* Delete Action Button */}
                    <button
                      onClick={(e) => handleDelete(match.id, e)}
                      disabled={isDeleting}
                      title="Delete Match from Database"
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>{isDeleting ? '...' : 'Delete'}</span>
                    </button>

                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 transition-transform">
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-emerald-600' : ''}`}
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
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <div>
                          <h4 className="text-sm font-black text-white uppercase tracking-wider">Carpool Match Linkage & Dispatch</h4>
                          <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                            <span>ID: {match.id}</span>
                            <button
                              onClick={(e) => copyToClipboard(match.id, `match-${match.id}`, e)}
                              className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold underline"
                            >
                              {copiedKey === `match-${match.id}` ? '✓ Copied' : 'Copy'}
                            </button>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => handleDelete(match.id, e)}
                          disabled={isDeleting}
                          className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>{isDeleting ? 'Deleting...' : 'Delete Match Permanently'}</span>
                        </button>
                        <span className="text-xs text-slate-400 font-mono hidden md:inline">
                          Initiated: {new Date(match.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Metric Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-[#1C2541] p-4 rounded-2xl border border-slate-700/60 shadow-inner">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">Agreed Match Status</span>
                          <span className="text-base">🤝</span>
                        </div>
                        <div className="mt-2">{getStatusBadge(match.status)}</div>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">Recorded in Postgres engine</p>
                      </div>

                      <div className="bg-[#1C2541] p-4 rounded-2xl border border-slate-700/60 shadow-inner">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">Proposed Fare</span>
                          <span className="text-base">💵</span>
                        </div>
                        <p className="text-2xl font-black text-emerald-400 mt-1">
                          {match.proposed_fare ? `Rs. ${match.proposed_fare}` : 'No counter-fare set'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Compensation per commute</p>
                      </div>

                      <div className="bg-[#1C2541] p-4 rounded-2xl border border-slate-700/60 shadow-inner">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">Linked Target</span>
                          <span className="text-base">🔗</span>
                        </div>
                        <p className="text-sm font-bold text-cyan-400 mt-1">
                          {match.demand_id ? 'Passenger Demand' : match.route_b_id ? 'Driver Commute Route' : 'Direct Offer'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono truncate">
                          {match.demand_id || match.route_b_id || 'Direct linkage'}
                        </p>
                      </div>
                    </div>

                    {/* Two-Party Linkage Showcase */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Sender Details */}
                      <div className="bg-[#1C2541] rounded-2xl border border-slate-700/60 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Sender (Party A)</span>
                          <span className="text-[11px] font-mono text-slate-400">User ID</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-white">{match.user_a_name}</p>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">{match.user_a_phone || 'No phone'}</p>
                          </div>
                          <button
                            onClick={(e) => copyToClipboard(match.user_a_id, `a-${match.id}`, e)}
                            className="text-xs text-indigo-400 hover:underline font-mono"
                          >
                            {copiedKey === `a-${match.id}` ? '✓ Copied' : 'Copy UUID'}
                          </button>
                        </div>
                        {match.route_a_id && (
                          <div className="pt-2 border-t border-slate-700/40 text-[11px] text-slate-400 font-mono flex items-center justify-between">
                            <span>Origin Route ID:</span>
                            <span className="text-slate-300">{match.route_a_id.slice(0, 12)}...</span>
                          </div>
                        )}
                      </div>

                      {/* Receiver Details */}
                      <div className="bg-[#1C2541] rounded-2xl border border-slate-700/60 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Receiver (Party B)</span>
                          <span className="text-[11px] font-mono text-slate-400">User ID</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-white">{match.user_b_name}</p>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">{match.user_b_phone || 'No phone'}</p>
                          </div>
                          <button
                            onClick={(e) => copyToClipboard(match.user_b_id, `b-${match.id}`, e)}
                            className="text-xs text-emerald-400 hover:underline font-mono"
                          >
                            {copiedKey === `b-${match.id}` ? '✓ Copied' : 'Copy UUID'}
                          </button>
                        </div>
                        {(match.route_b_id || match.demand_id) && (
                          <div className="pt-2 border-t border-slate-700/40 text-[11px] text-slate-400 font-mono flex items-center justify-between">
                            <span>Target Entity ID:</span>
                            <span className="text-slate-300">{(match.route_b_id || match.demand_id)?.slice(0, 12)}...</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Developer Raw JSON Toggle */}
                    {match.raw_data && (
                      <div className="pt-2">
                        <button
                          onClick={(e) => toggleRaw(match.id, e)}
                          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/80 transition"
                        >
                          <span>{showRawMap[match.id] ? '▼ Hide Developer JSON' : '▶ Show Developer JSON & Schema'}</span>
                        </button>

                        {showRawMap[match.id] && (
                          <div className="bg-[#050B14] p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-60 mt-3 shadow-inner">
                            <pre>{JSON.stringify(match.raw_data, null, 2)}</pre>
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
