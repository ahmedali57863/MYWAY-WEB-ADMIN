'use client'

import { useState, useMemo } from 'react'
import { deleteCollectionRecord } from '../actions'

export type EnrichedVehicle = {
  id: string
  user_id: string
  driver_name: string
  driver_phone: string | null
  driver_avatar: string | null
  reg_number: string
  brand: string
  variant: string | null
  type: string
  color: string
  model_year: number
  capacity: number
  has_ac: boolean
  is_active: boolean
  created_at: string
  registration_doc_url?: string | null
  registration_doc_signed_url?: string | null
  license_doc_url?: string | null
  license_doc_signed_url?: string | null
  application_status?: string | null
  raw_data?: any
}

export default function VehiclesCollectionClient({ vehicles: initialVehicles }: { vehicles: EnrichedVehicle[] }) {
  const [vehicles, setVehicles] = useState<EnrichedVehicle[]>(initialVehicles)
  const [search, setSearch] = useState('')
  const [acFilter, setAcFilter] = useState<'all' | 'ac' | 'non_ac'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [showRawMap, setShowRawMap] = useState<Record<string, boolean>>({})

  // High-resolution lightbox modal state
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null)
  const [modalImageTitle, setModalImageTitle] = useState<string | null>(null)

  const totalCount = vehicles.length
  const activeCount = vehicles.filter((v) => v.is_active).length
  const acCount = vehicles.filter((v) => v.has_ac).length
  const withDocsCount = vehicles.filter((v) => v.registration_doc_signed_url).length

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (acFilter === 'ac' && !v.has_ac) return false
      if (acFilter === 'non_ac' && v.has_ac) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        v.driver_name.toLowerCase().includes(q) ||
        v.reg_number.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        (v.variant && v.variant.toLowerCase().includes(q)) ||
        (v.driver_phone && v.driver_phone.toLowerCase().includes(q))
      )
    })
  }, [vehicles, acFilter, search])

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
    if (!confirm('Are you sure you want to permanently delete this vehicle from the database? This action cannot be undone.')) {
      return
    }
    setDeletingId(id)
    try {
      await deleteCollectionRecord('vehicles', id)
      setVehicles((prev) => prev.filter((v) => v.id !== id))
    } catch (err: any) {
      alert(err.message || 'Failed to delete vehicle')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-900">
              Fleet Registry
            </span>
            <span className="text-xs text-gray-500 font-mono">public.vehicles</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight mt-1">Registered Vehicles</h2>
          <p className="text-sm text-gray-500">Verified and active vehicles in the driver pool with official registration document proofs</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-white border border-gray-200 rounded-xl px-3.5 py-2 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Total Fleet</p>
            <p className="text-lg font-black text-gray-900">{totalCount}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2 shadow-sm">
            <p className="text-[10px] font-bold text-emerald-700 uppercase">Active</p>
            <p className="text-lg font-black text-emerald-900">{activeCount}</p>
          </div>
          <div className="bg-cyan-50 border border-cyan-200 rounded-xl px-3.5 py-2 shadow-sm">
            <p className="text-[10px] font-bold text-cyan-700 uppercase">With AC</p>
            <p className="text-lg font-black text-cyan-900">{acCount}</p>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-3.5 py-2 shadow-sm">
            <p className="text-[10px] font-bold text-indigo-700 uppercase">Reg Docs On File</p>
            <p className="text-lg font-black text-indigo-900">{withDocsCount}</p>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setAcFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              acFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setAcFilter('ac')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              acFilter === 'ac' ? 'bg-cyan-600 text-white shadow-sm' : 'text-gray-600 hover:text-cyan-700'
            }`}
          >
            Air Conditioned ({acCount})
          </button>
          <button
            onClick={() => setAcFilter('non_ac')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              acFilter === 'non_ac' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Standard ({totalCount - acCount})
          </button>
        </div>

        <div className="relative sm:w-72">
          <input
            type="text"
            placeholder="Search driver, plate, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Vehicles Table / Card View */}
      <div className="space-y-3">
        {filteredVehicles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <p className="text-gray-400 text-sm font-medium">No vehicles found matching search criteria.</p>
          </div>
        ) : (
          filteredVehicles.map((vehicle) => {
            const isExpanded = expandedId === vehicle.id
            const isDeleting = deletingId === vehicle.id

            return (
              <div
                key={vehicle.id}
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden ${
                  isExpanded ? 'border-amber-500 ring-2 ring-amber-500/10 shadow-md' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  onClick={() => toggleExpand(vehicle.id)}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-50/50"
                >
                  {/* Driver Name & Phone */}
                  <div className="flex items-center gap-3.5 min-w-[220px]">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-black text-sm shadow-sm overflow-hidden">
                      {vehicle.driver_avatar ? (
                        <img src={vehicle.driver_avatar} alt={vehicle.driver_name} className="w-full h-full object-cover" />
                      ) : (
                        (vehicle.driver_name?.[0] || 'D').toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{vehicle.driver_name}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{vehicle.driver_phone || 'No phone recorded'}</p>
                    </div>
                  </div>

                  {/* License Plate Banner (Uber style plate badge) */}
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center border-2 border-slate-800 rounded-lg overflow-hidden shadow-sm bg-white">
                      <span className="bg-slate-900 text-amber-400 text-[9px] font-black px-1.5 py-1 tracking-wider uppercase">
                        PK
                      </span>
                      <span className="px-3 py-1 font-mono font-black text-sm text-slate-900 tracking-widest uppercase">
                        {vehicle.reg_number}
                      </span>
                    </div>

                    <div className="text-left">
                      <p className="text-xs font-black text-gray-900">
                        {vehicle.brand} {vehicle.variant || ''}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {vehicle.model_year} &bull; <span className="capitalize">{vehicle.color}</span>
                      </p>
                    </div>
                  </div>

                  {/* Specs Chips: Capacity, AC, Type & Registration Doc Pill */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 flex items-center gap-1">
                      <span>👥</span>
                      <span>{vehicle.capacity} Seats</span>
                    </span>
                    {vehicle.has_ac ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center gap-1">
                        <span>❄️</span>
                        <span>AC</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] text-gray-400 bg-gray-50">
                        No AC
                      </span>
                    )}

                    {/* Registration Document Direct Access Button */}
                    {vehicle.registration_doc_signed_url ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setModalImageUrl(vehicle.registration_doc_signed_url!)
                          setModalImageTitle(`Vehicle Registration - ${vehicle.reg_number} (${vehicle.brand})`)
                        }}
                        className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1 transition"
                        title="Click to view Registration Certificate"
                      >
                        <span>📑</span>
                        <span>Reg Doc</span>
                      </button>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] text-gray-400 bg-gray-50">
                        No Doc
                      </span>
                    )}
                  </div>

                  {/* Registration Date & Actions */}
                  <div className="flex items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Registered</p>
                      <p className="text-xs font-bold text-gray-700">{formatDate(vehicle.created_at)}</p>
                    </div>

                    {/* Delete Action Button */}
                    <button
                      onClick={(e) => handleDelete(vehicle.id, e)}
                      disabled={isDeleting}
                      title="Delete Vehicle from Database"
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>{isDeleting ? '...' : 'Delete'}</span>
                    </button>

                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 transition-transform">
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-amber-600' : ''}`}
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
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        <div>
                          <h4 className="text-sm font-black text-white uppercase tracking-wider">Fleet Vehicle Registry & Spec Sheet</h4>
                          <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                            <span>ID: {vehicle.id}</span>
                            <button
                              onClick={(e) => copyToClipboard(vehicle.id, `veh-${vehicle.id}`, e)}
                              className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline"
                            >
                              {copiedKey === `veh-${vehicle.id}` ? '✓ Copied' : 'Copy'}
                            </button>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => handleDelete(vehicle.id, e)}
                          disabled={isDeleting}
                          className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>{isDeleting ? 'Deleting...' : 'Delete Vehicle Permanently'}</span>
                        </button>
                        <span className="text-xs text-slate-400 font-mono hidden md:inline">
                          Added: {new Date(vehicle.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Spec Cards Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-[#1C2541] p-4 rounded-2xl border border-slate-700/60 shadow-inner">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">Registration Plate</span>
                          <span className="text-base">🏷️</span>
                        </div>
                        <p className="text-lg font-black text-amber-400 font-mono mt-1 tracking-wider uppercase">{vehicle.reg_number}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Verified Government Plate</p>
                      </div>

                      <div className="bg-[#1C2541] p-4 rounded-2xl border border-slate-700/60 shadow-inner">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">Make & Model</span>
                          <span className="text-base">🚘</span>
                        </div>
                        <p className="text-lg font-black text-white mt-1">{vehicle.brand} {vehicle.variant || ''}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{vehicle.model_year} Model</p>
                      </div>

                      <div className="bg-[#1C2541] p-4 rounded-2xl border border-slate-700/60 shadow-inner">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">Capacity & Comfort</span>
                          <span className="text-base">❄️</span>
                        </div>
                        <p className="text-lg font-black text-cyan-400 mt-1">{vehicle.capacity} Seats {vehicle.has_ac ? '+ AC' : ''}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Color: <span className="capitalize">{vehicle.color}</span></p>
                      </div>

                      <div className="bg-[#1C2541] p-4 rounded-2xl border border-slate-700/60 shadow-inner">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">Fleet Status</span>
                          <span className="text-base">🛡️</span>
                        </div>
                        <p className="text-lg font-black text-emerald-400 mt-1">{vehicle.is_active ? 'Active on Fleet' : 'Suspended'}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Class: <span className="capitalize">{vehicle.type}</span></p>
                      </div>
                    </div>

                    {/* OFFICIAL REGISTRATION DOCUMENT PROOF SHOWCASE */}
                    <div className="bg-[#1C2541] rounded-2xl border border-slate-700/60 p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-700/40">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
                          <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                            Vehicle Registration Document Proof (Excise & Taxation)
                          </h4>
                        </div>
                        {vehicle.application_status && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                            Application Status: {vehicle.application_status}
                          </span>
                        )}
                      </div>

                      {vehicle.registration_doc_signed_url ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                          {/* Photo Card with Zoom Overlay */}
                          <div
                            onClick={() => {
                              setModalImageUrl(vehicle.registration_doc_signed_url!)
                              setModalImageTitle(`Vehicle Registration - ${vehicle.reg_number} (${vehicle.brand})`)
                            }}
                            className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-950 aspect-[16/10] flex items-center justify-center cursor-pointer shadow-lg"
                          >
                            <img
                              src={vehicle.registration_doc_signed_url}
                              alt={`Vehicle Registration for ${vehicle.reg_number}`}
                              className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                            />
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4 text-center">
                              <span className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                </svg>
                                Click to Enlarge
                              </span>
                              <p className="text-[11px] text-slate-300 font-medium">Inspect chassis, engine number & official stamps</p>
                            </div>
                          </div>

                          {/* Details & Actions Card */}
                          <div className="bg-[#0F172A] rounded-xl border border-slate-800 p-4 flex flex-col justify-between space-y-3">
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400 font-medium">Document Type:</span>
                                <span className="font-bold text-white">Vehicle Registration Certificate</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400 font-medium">Assigned Plate:</span>
                                <span className="font-mono font-bold text-amber-400">{vehicle.reg_number}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400 font-medium">Registered Driver:</span>
                                <span className="font-bold text-white">{vehicle.driver_name}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400 font-medium">Driver Phone:</span>
                                <span className="font-mono text-slate-300">{vehicle.driver_phone || 'N/A'}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400 font-medium">Storage Path:</span>
                                <span className="font-mono text-[10px] text-slate-400 truncate max-w-[180px]" title={vehicle.registration_doc_url || ''}>
                                  {vehicle.registration_doc_url || 'verification-documents'}
                                </span>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-slate-800 flex items-center gap-2.5">
                              <button
                                onClick={() => {
                                  setModalImageUrl(vehicle.registration_doc_signed_url!)
                                  setModalImageTitle(`Vehicle Registration - ${vehicle.reg_number} (${vehicle.brand})`)
                                }}
                                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>Inspect Full Resolution</span>
                              </button>
                              <a
                                href={vehicle.registration_doc_signed_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition border border-slate-700"
                                title="Open full file in new tab"
                              >
                                ↗
                              </a>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#0F172A] rounded-xl border border-slate-800 p-6 text-center space-y-1.5">
                          <p className="text-sm font-semibold text-slate-300">No Registration Document Attached</p>
                          <p className="text-xs text-slate-500">
                            The driver application for this vehicle does not currently have a registration image uploaded in storage.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Driver Ownership Banner */}
                    <div className="bg-[#1C2541] rounded-2xl border border-slate-700/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                          👤
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase">Assigned Driver Account</p>
                          <p className="text-sm font-bold text-white mt-0.5">{vehicle.driver_name}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">Phone: {vehicle.driver_phone || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Driver UUID</p>
                        <p className="text-xs font-mono text-slate-300 mt-0.5 flex items-center sm:justify-end gap-1.5">
                          <span>{vehicle.user_id}</span>
                          <button
                            onClick={(e) => copyToClipboard(vehicle.user_id, `driver-${vehicle.user_id}`, e)}
                            className="text-amber-400 hover:underline text-[10px]"
                          >
                            {copiedKey === `driver-${vehicle.user_id}` ? '✓' : 'Copy'}
                          </button>
                        </p>
                      </div>
                    </div>

                    {/* Developer Raw JSON Toggle */}
                    {vehicle.raw_data && (
                      <div className="pt-2">
                        <button
                          onClick={(e) => toggleRaw(vehicle.id, e)}
                          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/80 transition"
                        >
                          <span>{showRawMap[vehicle.id] ? '▼ Hide Developer JSON' : '▶ Show Developer JSON & Schema'}</span>
                        </button>

                        {showRawMap[vehicle.id] && (
                          <div className="bg-[#050B14] p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-amber-400 overflow-x-auto max-h-60 mt-3 shadow-inner">
                            <pre>{JSON.stringify(vehicle.raw_data, null, 2)}</pre>
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

      {/* FULL-RESOLUTION DOCUMENT LIGHTBOX MODAL */}
      {modalImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setModalImageUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[92vh] flex flex-col items-center bg-[#0B132B] border border-slate-700 rounded-3xl p-4 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 px-2">
              <div>
                <h3 className="text-sm font-black text-white">{modalImageTitle || 'Document Inspection Preview'}</h3>
                <p className="text-xs text-slate-400 font-mono">Secure signed URL from verification-documents</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={modalImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl border border-slate-700 transition"
                >
                  Open in New Tab ↗
                </a>
                <button
                  onClick={() => setModalImageUrl(null)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white rounded-xl shadow transition"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Modal Image Display */}
            <div className="p-4 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={modalImageUrl}
                alt="Document Full View"
                className="max-w-full max-h-[72vh] object-contain rounded-xl border border-slate-800 shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
