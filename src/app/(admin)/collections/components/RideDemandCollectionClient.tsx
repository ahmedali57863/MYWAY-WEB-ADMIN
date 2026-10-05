'use client'

import { useState, useMemo } from 'react'
import { deleteCollectionRecord } from '../actions'

export type EnrichedRideDemand = {
  id: string
  user_id: string
  rider_name: string
  rider_phone: string | null
  rider_avatar: string | null
  pickup_address: string
  dropoff_address: string
  schedule_type: string
  days_of_week: number[] | null
  specific_date: string | null
  time_window_start: string
  time_window_end: string | null
  is_fulfilled: boolean
  created_at: string
  raw_data?: any
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function RideDemandCollectionClient({ demands: initialDemands }: { demands: EnrichedRideDemand[] }) {
  const [demands, setDemands] = useState<EnrichedRideDemand[]>(initialDemands)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'fulfilled'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [showRawMap, setShowRawMap] = useState<Record<string, boolean>>({})

  const totalCount = demands.length
  const pendingCount = demands.filter((d) => !d.is_fulfilled).length
  const fulfilledCount = demands.filter((d) => d.is_fulfilled).length

  const filteredDemands = useMemo(() => {
    return demands.filter((d) => {
      if (statusFilter === 'pending' && d.is_fulfilled) return false
      if (statusFilter === 'fulfilled' && !d.is_fulfilled) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        d.rider_name.toLowerCase().includes(q) ||
        (d.rider_phone && d.rider_phone.toLowerCase().includes(q)) ||
        d.pickup_address.toLowerCase().includes(q) ||
        d.dropoff_address.toLowerCase().includes(q) ||
        d.schedule_type.toLowerCase().includes(q)
      )
    })
  }, [demands, statusFilter, search])

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
    if (!confirm('Are you sure you want to permanently delete this ride demand request from the database?')) {
      return
    }
    setDeletingId(id)
    try {
      await deleteCollectionRecord('ride_demand', id)
      setDemands((prev) => prev.filter((d) => d.id !== id))
    } catch (err: any) {
      alert(err.message || 'Failed to delete ride demand')
    } finally {
      setDeletingId(null)
    }
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '--:--'
    try {
      const parts = timeStr.split(':')
      const h = parseInt(parts[0], 10)
      const m = parts[1] || '00'
      const ampm = h >= 12 ? 'PM' : 'AM'
      const formattedH = h % 12 || 12
      return `${formattedH}:${m} ${ampm}`
    } catch {
      return timeStr
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-purple-100 text-purple-800">
              Passenger Marketplace
            </span>
            <span className="text-xs text-gray-500 font-mono">public.ride_demand</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight mt-1">Passenger Ride Demand</h2>
          <p className="text-sm text-gray-500">Unfulfilled ride requests and active recurring passenger commute demand</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Total Requests</p>
            <p className="text-xl font-black text-gray-900">{totalCount}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 shadow-sm">
            <p className="text-[10px] font-bold text-amber-800 uppercase">Awaiting Driver</p>
            <p className="text-xl font-black text-amber-900">{pendingCount}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 shadow-sm">
            <p className="text-[10px] font-bold text-emerald-800 uppercase">Fulfilled</p>
            <p className="text-xl font-black text-emerald-900">{fulfilledCount}</p>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Demands ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-600 hover:text-amber-700'
            }`}
          >
            <span>⏳</span>
            <span>Awaiting Match ({pendingCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('fulfilled')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === 'fulfilled' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:text-emerald-700'
            }`}
          >
            <span>✓</span>
            <span>Fulfilled ({fulfilledCount})</span>
          </button>
        </div>

        <div className="relative sm:w-72">
          <input
            type="text"
            placeholder="Search rider, pickup, dropoff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Demand Cards List */}
      <div className="space-y-3">
        {filteredDemands.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <p className="text-gray-400 text-sm font-medium">No ride demand records match your search criteria.</p>
          </div>
        ) : (
          filteredDemands.map((demand) => {
            const isExpanded = expandedId === demand.id
            const isDeleting = deletingId === demand.id

            return (
              <div
                key={demand.id}
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden ${
                  isExpanded ? 'border-purple-500 ring-2 ring-purple-500/10 shadow-md' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  onClick={() => toggleExpand(demand.id)}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-50/50"
                >
                  {/* Rider Identity */}
                  <div className="flex items-center gap-3.5 min-w-[220px]">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm overflow-hidden">
                      {demand.rider_avatar ? (
                        <img src={demand.rider_avatar} alt={demand.rider_name} className="w-full h-full object-cover" />
                      ) : (
                        (demand.rider_name?.[0] || 'R').toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 text-sm">{demand.rider_name}</p>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          Rider
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{demand.rider_phone || 'No phone'}</p>
                    </div>
                  </div>

                  {/* Trip Endpoints */}
                  <div className="flex-1 max-w-xl">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0 shadow-sm"></span>
                        <div className="overflow-hidden">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Pickup Location</p>
                          <p className="text-xs font-semibold text-gray-800 truncate" title={demand.pickup_address}>
                            {demand.pickup_address}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0 shadow-sm"></span>
                        <div className="overflow-hidden">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Dropoff Location</p>
                          <p className="text-xs font-semibold text-gray-800 truncate" title={demand.dropoff_address}>
                            {demand.dropoff_address}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Schedule, Status & Actions */}
                  <div className="flex items-center justify-between lg:justify-end gap-5 border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100">
                    <div className="text-left lg:text-right">
                      <div className="flex items-center gap-1.5 lg:justify-end">
                        <span className="text-xs font-black text-gray-900">
                          {formatTime(demand.time_window_start)}
                          {demand.time_window_end ? ` - ${formatTime(demand.time_window_end)}` : ''}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-gray-500 capitalize mt-0.5">
                        {demand.schedule_type.replace('_', ' ')}
                      </p>
                    </div>

                    {/* Status Pill */}
                    <div>
                      {demand.is_fulfilled ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Fulfilled
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          Looking for Driver
                        </span>
                      )}
                    </div>

                    {/* Delete Action Button */}
                    <button
                      onClick={(e) => handleDelete(demand.id, e)}
                      disabled={isDeleting}
                      title="Delete Ride Demand from Database"
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>{isDeleting ? '...' : 'Delete'}</span>
                    </button>

                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 transition-transform">
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-purple-600' : ''}`}
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
                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                        <div>
                          <h4 className="text-sm font-black text-white uppercase tracking-wider">Ride Demand Specifications</h4>
                          <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                            <span>ID: {demand.id}</span>
                            <button
                              onClick={(e) => copyToClipboard(demand.id, `demand-${demand.id}`, e)}
                              className="text-[10px] text-purple-400 hover:text-purple-300 font-bold underline"
                            >
                              {copiedKey === `demand-${demand.id}` ? '✓ Copied' : 'Copy'}
                            </button>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => handleDelete(demand.id, e)}
                          disabled={isDeleting}
                          className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>{isDeleting ? 'Deleting...' : 'Delete Demand Permanently'}</span>
                        </button>
                        <span className="text-xs text-slate-400 font-mono hidden md:inline">
                          Requested: {new Date(demand.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Metric Cards Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-[#1C2541] p-4 rounded-2xl border border-slate-700/60 shadow-inner">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">Demand Type</span>
                          <span className="text-base">📅</span>
                        </div>
                        <p className="text-lg font-black text-purple-400 mt-1 capitalize">{demand.schedule_type.replace('_', ' ')}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Passenger commute pattern</p>
                      </div>

                      <div className="bg-[#1C2541] p-4 rounded-2xl border border-slate-700/60 shadow-inner">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">Time Window</span>
                          <span className="text-base">⏰</span>
                        </div>
                        <p className="text-lg font-black text-white mt-1">{formatTime(demand.time_window_start)}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                          {demand.time_window_end ? `Until ${formatTime(demand.time_window_end)}` : 'Strict Departure'}
                        </p>
                      </div>

                      <div className="bg-[#1C2541] p-4 rounded-2xl border border-slate-700/60 shadow-inner">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">Operating Days</span>
                          <span className="text-base">📆</span>
                        </div>
                        <p className="text-lg font-black text-cyan-400 mt-1">
                          {demand.days_of_week && demand.days_of_week.length > 0
                            ? demand.days_of_week.map((d) => DAY_NAMES[d] || d).join(', ')
                            : demand.specific_date || 'Standard Daily'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Weekly schedule</p>
                      </div>

                      <div className="bg-[#1C2541] p-4 rounded-2xl border border-slate-700/60 shadow-inner">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">Match Status</span>
                          <span className="text-base">🎯</span>
                        </div>
                        <p className="text-lg font-black text-emerald-400 mt-1">
                          {demand.is_fulfilled ? 'Fulfilled' : 'Active Request'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                          {demand.is_fulfilled ? 'Driver matched' : 'Broadcasting on Radar'}
                        </p>
                      </div>
                    </div>

                    {/* Detailed Addresses Box */}
                    <div className="bg-[#1C2541] rounded-2xl border border-slate-700/60 p-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                          A
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">Passenger Pickup Point</span>
                            <button
                              onClick={(e) => copyToClipboard(demand.pickup_address, `pickup-${demand.id}`, e)}
                              className="text-[11px] text-slate-400 hover:text-white font-medium"
                            >
                              {copiedKey === `pickup-${demand.id}` ? '✓ Copied' : 'Copy Address'}
                            </button>
                          </div>
                          <p className="text-sm font-semibold text-white mt-1 leading-relaxed">{demand.pickup_address}</p>
                        </div>
                      </div>

                      <div className="h-px bg-slate-700/60 ml-11"></div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                          B
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-wider">Passenger Dropoff Destination</span>
                            <button
                              onClick={(e) => copyToClipboard(demand.dropoff_address, `drop-${demand.id}`, e)}
                              className="text-[11px] text-slate-400 hover:text-white font-medium"
                            >
                              {copiedKey === `drop-${demand.id}` ? '✓ Copied' : 'Copy Address'}
                            </button>
                          </div>
                          <p className="text-sm font-semibold text-white mt-1 leading-relaxed">{demand.dropoff_address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Rider Account Ownership */}
                    <div className="bg-[#1C2541] rounded-2xl border border-slate-700/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
                          👤
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase">Passenger Requester</p>
                          <p className="text-sm font-bold text-white mt-0.5">{demand.rider_name}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">Phone: {demand.rider_phone || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Rider Account UUID</p>
                        <p className="text-xs font-mono text-slate-300 mt-0.5 flex items-center sm:justify-end gap-1.5">
                          <span>{demand.user_id}</span>
                          <button
                            onClick={(e) => copyToClipboard(demand.user_id, `rider-${demand.user_id}`, e)}
                            className="text-purple-400 hover:underline text-[10px]"
                          >
                            {copiedKey === `rider-${demand.user_id}` ? '✓' : 'Copy'}
                          </button>
                        </p>
                      </div>
                    </div>

                    {/* Developer Raw JSON Toggle */}
                    {demand.raw_data && (
                      <div className="pt-2">
                        <button
                          onClick={(e) => toggleRaw(demand.id, e)}
                          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/80 transition"
                        >
                          <span>{showRawMap[demand.id] ? '▼ Hide Developer JSON' : '▶ Show Developer JSON & GIS Coordinates'}</span>
                        </button>

                        {showRawMap[demand.id] && (
                          <div className="bg-[#050B14] p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-purple-400 overflow-x-auto max-h-60 mt-3 shadow-inner">
                            <pre>{JSON.stringify(demand.raw_data, null, 2)}</pre>
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
