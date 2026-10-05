'use client'

import { useState } from 'react'
import {
  approveIdentityVerification,
  rejectIdentityVerification,
  approveDriverApplication,
  rejectDriverApplication
} from './actions'

type Verification = any
type DriverApp = any

export default function PendingApprovalsClient({ 
  verifications, 
  driverApplications 
}: { 
  verifications: Verification[], 
  driverApplications: DriverApp[] 
}) {
  const [activeTab, setActiveTab] = useState<'identity' | 'driver'>('identity')
  const [processingId, setProcessingId] = useState<string | null>(null)
  
  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectingItem, setRejectingItem] = useState<{ id: string, type: 'identity' | 'driver' } | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // Image modal state
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null)

  const handleApproveIdentity = async (id: string) => {
    if (!confirm('Are you sure you want to approve this identity verification?')) return
    setProcessingId(id)
    try {
      await approveIdentityVerification(id)
    } catch (e: any) {
      alert(e.message)
    }
    setProcessingId(null)
  }

  const handleApproveDriver = async (id: string) => {
    if (!confirm('Are you sure you want to approve this driver application?')) return
    setProcessingId(id)
    try {
      await approveDriverApplication(id)
    } catch (e: any) {
      alert(e.message)
    }
    setProcessingId(null)
  }

  const openRejectModal = (id: string, type: 'identity' | 'driver') => {
    setRejectingItem({ id, type })
    setRejectReason('')
    setRejectModalOpen(true)
  }

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }
    if (!rejectingItem) return

    setProcessingId(rejectingItem.id)
    setRejectModalOpen(false)

    try {
      if (rejectingItem.type === 'identity') {
        await rejectIdentityVerification(rejectingItem.id, rejectReason.trim())
      } else {
        await rejectDriverApplication(rejectingItem.id, rejectReason.trim())
      }
    } catch (e: any) {
      alert(e.message)
    }
    
    setProcessingId(null)
    setRejectingItem(null)
  }

  const openImageModal = (url: string | null) => {
    if (!url) return
    setModalImageUrl(url)
    setImageModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-2 p-1.5 bg-gray-200/70 rounded-2xl border border-gray-300 w-fit">
        <button
          className={`py-2.5 px-5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
            activeTab === 'identity'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300/50'
          }`}
          onClick={() => setActiveTab('identity')}
        >
          <span>Identity Verifications</span>
          <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'identity' ? 'bg-indigo-400/30 text-white' : 'bg-gray-300 text-gray-700'}`}>
            {verifications.length}
          </span>
        </button>
        <button
          className={`py-2.5 px-5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
            activeTab === 'driver'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300/50'
          }`}
          onClick={() => setActiveTab('driver')}
        >
          <span>Driver Applications</span>
          <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'driver' ? 'bg-indigo-400/30 text-white' : 'bg-gray-300 text-gray-700'}`}>
            {driverApplications.length}
          </span>
        </button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'identity' && (
          verifications.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-base font-medium">No pending identity verifications.</p>
            </div>
          ) : (
            verifications.map((v) => (
              <div key={v.id} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 transition-all hover:shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 pb-6 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-gray-900">{v.full_name}</h3>
                      <span className="px-3 py-0.5 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                        Tier {v.tier}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Submitted: {new Date(v.submitted_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      disabled={processingId === v.id}
                      onClick={() => openRejectModal(v.id, 'identity')}
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      disabled={processingId === v.id}
                      onClick={() => handleApproveIdentity(v.id)}
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md transition-all disabled:opacity-50"
                    >
                      {processingId === v.id ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email / Phone</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{v.email}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{v.profiles?.phone || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">CNIC Number</p>
                    <p className="text-sm font-mono font-semibold text-gray-900">{v.cnic_number}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Physical Address</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{v.physical_address}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Emergency Contact</p>
                    <p className="text-sm font-semibold text-gray-900">{v.emergency_contact}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Verification Documents</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Live Selfie', url: v.selfie_signed_url },
                      { label: 'CNIC Front', url: v.cnic_front_signed_url },
                      { label: 'CNIC Back', url: v.cnic_back_signed_url }
                    ].map((doc, idx) => (
                      <div key={idx} className="cursor-pointer group" onClick={() => openImageModal(doc.url)}>
                        <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center justify-between">
                          <span>{doc.label}</span>
                          <span className="text-[10px] text-indigo-600 group-hover:underline">Click to expand</span>
                        </p>
                        {doc.url ? (
                          <div className="h-40 bg-gray-100 rounded-xl border border-gray-200 overflow-hidden group-hover:border-indigo-500 transition-all relative">
                            <img src={doc.url} alt={doc.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                        ) : (
                          <div className="h-40 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center text-xs text-gray-400">
                            No Image Available
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'driver' && (
          driverApplications.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-base font-medium">No pending driver applications.</p>
            </div>
          ) : (
            driverApplications.map((app) => (
              <div key={app.id} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 transition-all hover:shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 pb-6 border-b border-gray-100">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{app.profiles?.full_name || 'Unknown User'}</h3>
                    <p className="text-xs text-gray-500 mt-1">Submitted: {new Date(app.submitted_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      disabled={processingId === app.id}
                      onClick={() => openRejectModal(app.id, 'driver')}
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      disabled={processingId === app.id}
                      onClick={() => handleApproveDriver(app.id)}
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md transition-all disabled:opacity-50"
                    >
                      {processingId === app.id ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Vehicle Info</p>
                    <p className="text-sm font-semibold text-gray-900">{app.vehicles?.type}: {app.vehicles?.brand} {app.vehicles?.variant}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Color & Model Year</p>
                    <p className="text-sm font-semibold text-gray-900">{app.vehicles?.color} ({app.vehicles?.model_year})</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Registration Plate</p>
                    <span className="font-mono bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-bold border border-indigo-200 inline-block">
                      {app.vehicles?.reg_number}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Driver Documents</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Driving License', url: app.license_signed_url },
                      { label: 'Vehicle Registration', url: app.registration_signed_url }
                    ].map((doc, idx) => (
                      <div key={idx} className="cursor-pointer group" onClick={() => openImageModal(doc.url)}>
                        <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center justify-between">
                          <span>{doc.label}</span>
                          <span className="text-[10px] text-indigo-600 group-hover:underline">Click to expand</span>
                        </p>
                        {doc.url ? (
                          <div className="h-44 bg-gray-100 rounded-xl border border-gray-200 overflow-hidden group-hover:border-indigo-500 transition-all relative">
                            <img src={doc.url} alt={doc.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                        ) : (
                          <div className="h-44 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center text-xs text-gray-400">
                            No Image Available
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Reject Application</h3>
            <p className="text-xs text-slate-400 mb-4">Provide a reason for the user to fix their submission.</p>
            <textarea
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 mb-4 resize-none"
              rows={4}
              placeholder="e.g. ID image is blurry, Name mismatch"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl text-sm font-semibold transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-rose-600/30 transition-all"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imageModalOpen && modalImageUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4"
          onClick={() => setImageModalOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={modalImageUrl} 
              alt="Document Full View" 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-slate-800 shadow-2xl" 
              onClick={(e) => e.stopPropagation()} 
            />
            <button 
              className="absolute -top-12 right-0 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-all"
              onClick={() => setImageModalOpen(false)}
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
