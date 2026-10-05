'use client'

import { useState, useMemo } from 'react'
import { deleteCollectionRecord } from '../actions'

export type EnrichedRoute = {
  id: string
  user_id: string
  user_name: string
  user_phone: string | null
  user_avatar: string | null
  start_address: string
  end_address: string
  departure_time: string
  days_of_week: string[] | null
  role: string
  monthly_cost_estimate: number | null
  is_active: boolean
  created_at: string
  raw_data?: any
}

export default function RoutesCollectionClient({ routes: initialRoutes }: { routes: EnrichedRoute[] }) {
  const [routes, setRoutes] = useState<EnrichedRoute[]>(initialRoutes)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'driver' | 'rider'>('all')
  const [activeOnly, setActiveOnly] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [showRawMap, setShowRawMap] = useState<Record<string, boolean>>({})

  // Metrics
  const totalCount = routes.length
  const driverCount = routes.filter((r) => r.role === 'driver').length
  const riderCount = routes.filter((r) => r.role === 'rider').length
  const activeCount = routes.filter((r) => r.is_active).length

  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      if (roleFilter !== 'all' && r.role !== roleFilter) return false
      if (activeOnly && !r.is_active) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        r.user_name.toLowerCase().includes(q) ||
        (r.user_phone && r.user_phone.toLowerCase().includes(q)) ||
        r.start_address.toLowerCase().includes(q) ||
        r.end_address.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      )
    })
  }, [routes, roleFilter, activeOnly, search])

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
    if (!confirm('Are you sure you want to permanently delete this route from the database? This action cannot be undone.')) {
      return
    }
    setDeletingId(id)
    try {
      await deleteCollectionRecord('routes', id)
      setRoutes((prev) => prev.filter((r) => r.id !== id))
    } catch (err: any) {
      alert(err.message || 'Failed to delete route')
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

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return null
    const totalMinutes = Math.round(seconds / 60)
    if (totalMinutes < 60) return `${totalMinutes} mins`
    const hrs = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60
    return `${hrs} hr ${mins} mins`
  }

  const extractDistanceKm = (rawData?: any) => {
    if (!rawData) return null
    if (rawData.route_steps && Array.isArray(rawData.route_steps) && rawData.route_steps.length > 0) {
      const lastStep = rawData.route_steps[rawData.route_steps.length - 1]
      if (lastStep?.distance_m) {
        return (lastStep.distance_m / 1000).toFixed(1) + ' km'
      }
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-100 text-blue-800">
              Live Fleet Dispatch
            </span>
            <span className="text-xs text-gray-500 font-mono">public.routes</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight mt-1">Published Routes</h2>
          <p className="text-sm text-gray-500">Commute paths published by drivers and riders for automated matching</p>
        </div>

        {/* Quick Stats Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-white border border-gray-200 rounded-xl px-3.5 py-2 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Total Routes</p>
            <p className="text-lg font-black text-gray-900">{totalCount}</p>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl px-3.5 py-2 shadow-sm">
            <p className="text-[10px] font-bold text-emerald-700 uppercase">Driver Routes</p>
            <p className="text-lg font-black text-emerald-900">{driverCount}</p>
          </div>
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl px-3.5 py-2 shadow-sm">
            <p className="text-[10px] font-bold text-indigo-700 uppercase">Rider Routes</p>
            <p className="text-lg font-black text-indigo-900">{riderCount}</p>
          </div>
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl px-3.5 py-2 shadow-sm">
            <p className="text-[10px] font-bold text-amber-700 uppercase">Active Now</p>
            <p className="text-lg font-black text-amber-900">{activeCount}</p>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm">
        {/* Role Segment Tabs */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              roleFilter === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setRoleFilter('driver')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              roleFilter === 'driver'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-emerald-700'
            }`}
          >
            <span>🚗</span>
            <span>Drivers ({driverCount})</span>
          </button>
          <button
            onClick={() => setRoleFilter('rider')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              roleFilter === 'rider'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-indigo-700'
            }`}
          >
            <span>🧍</span>
            <span>Riders ({riderCount})</span>
          </button>
        </div>

        {/* Search Input & Active Toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer select-none bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-xl border border-gray-200 transition">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span>Active Only</span>
          </label>

          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Search user, origin, destination..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Routes List Container */}
      <div className="space-y-3">
        {filteredRoutes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <p className="text-gray-400 text-sm font-medium">No matching routes found.</p>
          </div>
        ) : (
          filteredRoutes.map((route) => {
            const isExpanded = expandedId === route.id
            const isDriver = route.role === 'driver'
            const isDeleting = deletingId === route.id
            const raw = route.raw_data || {}
            const vehicleType = raw.vehicle_type || 'car'
            const durationFormatted = formatDuration(raw.total_duration_seconds)
            const distanceFormatted = extractDistanceKm(raw)
            const waypointCount = raw.route_steps?.length || 0

            return (
              <div
                key={route.id}
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden ${
                  isExpanded ? 'border-indigo-500 ring-2 ring-indigo-500/10 shadow-md' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Main Row Header */}
                <div
                  onClick={() => toggleExpand(route.id)}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-50/50"
                >
                  {/* Driver / Rider Identity */}
                  <div className="flex items-center gap-3.5 min-w-[240px]">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-sm shadow-sm overflow-hidden">
                        {route.user_avatar ? (
                          <img src={route.user_avatar} alt={route.user_name} className="w-full h-full object-cover" />
                        ) : (
                          (route.user_name?.[0] || 'U').toUpperCase()
                        )}
                      </div>
                      <span
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black ${
                          route.is_active ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white'
                        }`}
                        title={route.is_active ? 'Active' : 'Inactive'}
                      >
                        {route.is_active ? '✓' : '×'}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 text-sm leading-snug">{route.user_name}</p>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            isDriver
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          {route.role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{route.user_phone || 'No phone recorded'}</p>
                    </div>
                  </div>

                  {/* Route Visualizer (Origin -> Destination) */}
                  <div className="flex-1 max-w-xl">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0 shadow-sm shadow-emerald-500/50"></span>
                        <div className="overflow-hidden">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Start Origin</p>
                          <p className="text-xs font-semibold text-gray-800 truncate" title={route.start_address}>
                            {route.start_address}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0 shadow-sm shadow-rose-500/50"></span>
                        <div className="overflow-hidden">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Stop Destination</p>
                          <p className="text-xs font-semibold text-gray-800 truncate" title={route.end_address}>
                            {route.end_address}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timings, Cost & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100">
                    <div className="text-left lg:text-right">
                      <div className="flex items-center gap-1.5 lg:justify-end">
                        <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-black text-gray-900">{formatTime(route.departure_time)}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 flex-wrap lg:justify-end">
                        {route.days_of_week && route.days_of_week.length > 0 ? (
                          route.days_of_week.map((day) => (
                            <span
                              key={day}
                              className="text-[9px] font-bold uppercase bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                            >
                              {day.slice(0, 3)}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">Daily commute</span>
                        )}
                      </div>
                    </div>

                    {route.monthly_cost_estimate ? (
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Estimate</p>
                        <p className="text-sm font-extrabold text-emerald-700">Rs. {route.monthly_cost_estimate}</p>
                      </div>
                    ) : null}

                    {/* Delete Action Button */}
                    <button
                      onClick={(e) => handleDelete(route.id, e)}
                      disabled={isDeleting}
                      title="Delete Route from Database"
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>{isDeleting ? '...' : 'Delete'}</span>
                    </button>

                    {/* Expand Chevron Icon */}
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 transition-transform">
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-indigo-600' : ''}`}
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
                          <h4 className="text-sm font-black text-white uppercase tracking-wider">Route Telemetry & GIS Engine</h4>
                          <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                            <span>ID: {route.id}</span>
                            <button
                              onClick={(e) => copyToClipboard(route.id, `route-${route.id}`, e)}
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline"
                            >
                              {copiedKey === `route-${route.id}` ? '✓ Copied' : 'Copy'}
                            </button>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => handleDelete(route.id, e)}
                          disabled={isDeleting}
                          className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>{isDeleting ? 'Deleting...' : 'Delete Route Permanently'}</span>
                        </button>
                        <span className="text-xs text-slate-400 font-mono hidden md:inline">
                          Published: {new Date(route.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Metric Cards Grid (Uber Style Key Metrics) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Vehicle Type Card */}
                      <div className="bg-[#1C2541] p-4 rounded-2xl border border-slate-700/60 shadow-inner">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">Transport Mode</span>
                          <span className="text-base">{vehicleType === 'bike' ? '🏍️' : '🚗'}</span>
                        </div>
                        <p className="text-lg font-black text-white mt-1 capitalize">{vehicleType}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Eligible for ride matching</p>
                      </div>

                      {/* Travel Distance Card */}
                      <div className="bg-[#1C2541] p-4 rounded-2xl border border-slate-700/60 shadow-inner">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">Trip Distance</span>
                          <span className="text-base">📍</span>
                        </div>
                        <p className="text-lg font-black text-emerald-400 mt-1">{distanceFormatted || 'N/A'}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">GIS Calculated Route</p>
                      </div>

                      {/* Duration Estimate Card */}
                      <div className="bg-[#1C2541] p-4 rounded-2xl border border-slate-700/60 shadow-inner">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">Est. Duration</span>
                          <span className="text-base">⏱️</span>
                        </div>
                        <p className="text-lg font-black text-cyan-400 mt-1">{durationFormatted || 'N/A'}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{waypointCount} route waypoints</p>
                      </div>

                      {/* Schedule & Timing Card */}
                      <div className="bg-[#1C2541] p-4 rounded-2xl border border-slate-700/60 shadow-inner">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">Schedule</span>
                          <span className="text-base">📅</span>
                        </div>
                        <p className="text-lg font-black text-amber-400 mt-1 capitalize">{raw.schedule_type || 'Daily'}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                          Departs: {formatTime(raw.departure_time_start || route.departure_time)}
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
                            <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">Pickup / Starting Point</span>
                            <button
                              onClick={(e) => copyToClipboard(route.start_address, `start-${route.id}`, e)}
                              className="text-[11px] text-slate-400 hover:text-white font-medium"
                            >
                              {copiedKey === `start-${route.id}` ? '✓ Copied' : 'Copy Address'}
                            </button>
                          </div>
                          <p className="text-sm font-semibold text-white mt-1 leading-relaxed">{route.start_address}</p>
                        </div>
                      </div>

                      <div className="h-px bg-slate-700/60 ml-11"></div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                          B
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-wider">Dropoff / Destination</span>
                            <button
                              onClick={(e) => copyToClipboard(route.end_address, `end-${route.id}`, e)}
                              className="text-[11px] text-slate-400 hover:text-white font-medium"
                            >
                              {copiedKey === `end-${route.id}` ? '✓ Copied' : 'Copy Address'}
                            </button>
                          </div>
                          <p className="text-sm font-semibold text-white mt-1 leading-relaxed">{route.end_address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Account Ownership & Parameters */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-[#1C2541] p-3.5 rounded-xl border border-slate-700/60">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Account Owner</span>
                        <p className="font-bold text-white mt-1">{route.user_name}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                          <span className="truncate">{route.user_id}</span>
                          <button
                            onClick={(e) => copyToClipboard(route.user_id, `user-${route.id}`, e)}
                            className="text-indigo-400 hover:underline flex-shrink-0"
                          >
                            {copiedKey === `user-${route.id}` ? '✓' : 'Copy'}
                          </button>
                        </p>
                      </div>

                      <div className="bg-[#1C2541] p-3.5 rounded-xl border border-slate-700/60">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Operational Status</span>
                        <p className="font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          {route.is_active ? 'Active on Match Radar' : 'Archived / Inactive'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Auto-matches compatible commute requests</p>
                      </div>

                      <div className="bg-[#1C2541] p-3.5 rounded-xl border border-slate-700/60">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Monthly Fare Estimate</span>
                        <p className="font-black text-amber-400 mt-1 text-base">
                          {route.monthly_cost_estimate ? `Rs. ${route.monthly_cost_estimate}` : 'Flexible / Split Fare'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Based on calculated commute distance</p>
                      </div>
                    </div>

                    {/* Expandable Developer Raw JSON Toggle */}
                    {route.raw_data && (
                      <div className="pt-2">
                        <button
                          onClick={(e) => toggleRaw(route.id, e)}
                          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/80 transition"
                        >
                          <span>{showRawMap[route.id] ? '▼ Hide Developer JSON' : '▶ Show Developer JSON & GIS Coordinates'}</span>
                        </button>

                        {showRawMap[route.id] && (
                          <div className="bg-[#050B14] p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-60 mt-3 shadow-inner">
                            <pre>{JSON.stringify(route.raw_data, null, 2)}</pre>
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
