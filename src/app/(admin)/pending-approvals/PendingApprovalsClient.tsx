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
    <div>
      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        <button
          className={`py-2 px-4 font-semibold ${activeTab === 'identity' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('identity')}
        >
          Identity ({verifications.length})
        </button>
        <button
          className={`py-2 px-4 font-semibold ${activeTab === 'driver' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('driver')}
        >
          Driver ({driverApplications.length})
        </button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'identity' && (
          verifications.length === 0 ? (
            <p className="text-gray-500">No pending identity verifications.</p>
          ) : (
            verifications.map((v) => (
              <div key={v.id} className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{v.full_name}</h3>
                    <p className="text-sm text-gray-500">Submitted: {new Date(v.submitted_at).toLocaleString()}</p>
                    <span className="inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 uppercase">
                      Tier: {v.tier}
                    </span>
                  </div>
                  <div className="space-x-3">
                    <button
                      disabled={processingId === v.id}
                      onClick={() => openRejectModal(v.id, 'identity')}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 font-semibold disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      disabled={processingId === v.id}
                      onClick={() => handleApproveIdentity(v.id)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-semibold disabled:opacity-50"
                    >
                      {processingId === v.id ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Email / Phone</p>
                    <p>{v.email} / {v.profiles?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">CNIC Number</p>
                    <p>{v.cnic_number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Physical Address</p>
                    <p>{v.physical_address}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Emergency Contact</p>
                    <p>{v.emergency_contact}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Documents (Click to view)</p>
                  <div className="flex space-x-4 overflow-x-auto">
                    {[
                      { label: 'Live Selfie', url: v.selfie_signed_url },
                      { label: 'CNIC Front', url: v.cnic_front_signed_url },
                      { label: 'CNIC Back', url: v.cnic_back_signed_url }
                    ].map((doc, idx) => (
                      <div key={idx} className="cursor-pointer group" onClick={() => openImageModal(doc.url)}>
                        <p className="text-xs text-gray-500 mb-1">{doc.label}</p>
                        {doc.url ? (
                          <div className="w-32 h-32 bg-gray-100 rounded border border-gray-200 overflow-hidden group-hover:opacity-80">
                            <img src={doc.url} alt={doc.label} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-32 h-32 bg-gray-50 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-400">
                            No Image
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
            <p className="text-gray-500">No pending driver applications.</p>
          ) : (
            driverApplications.map((app) => (
              <div key={app.id} className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{app.profiles?.full_name || 'Unknown User'}</h3>
                    <p className="text-sm text-gray-500">Submitted: {new Date(app.submitted_at).toLocaleString()}</p>
                  </div>
                  <div className="space-x-3">
                    <button
                      disabled={processingId === app.id}
                      onClick={() => openRejectModal(app.id, 'driver')}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 font-semibold disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      disabled={processingId === app.id}
                      onClick={() => handleApproveDriver(app.id)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-semibold disabled:opacity-50"
                    >
                      {processingId === app.id ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Vehicle</p>
                    <p>{app.vehicles?.type}: {app.vehicles?.brand} {app.vehicles?.variant}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Color & Year</p>
                    <p>{app.vehicles?.color} ({app.vehicles?.model_year})</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Registration Plate</p>
                    <p className="font-mono bg-gray-100 px-2 py-1 rounded inline-block">{app.vehicles?.reg_number}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Documents (Click to view)</p>
                  <div className="flex space-x-4 overflow-x-auto">
                    {[
                      { label: 'License', url: app.license_signed_url },
                      { label: 'Registration', url: app.registration_signed_url }
                    ].map((doc, idx) => (
                      <div key={idx} className="cursor-pointer group" onClick={() => openImageModal(doc.url)}>
                        <p className="text-xs text-gray-500 mb-1">{doc.label}</p>
                        {doc.url ? (
                          <div className="w-32 h-32 bg-gray-100 rounded border border-gray-200 overflow-hidden group-hover:opacity-80">
                            <img src={doc.url} alt={doc.label} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-32 h-32 bg-gray-50 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-400">
                            No Image
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Reject Application</h3>
            <p className="text-sm text-gray-600 mb-4">Provide a reason for the user to fix their submission.</p>
            <textarea
              className="w-full border border-gray-300 rounded p-2 mb-4"
              rows={4}
              placeholder="e.g. ID is blurry, Name mismatch"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button 
                onClick={confirmReject}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4"
          onClick={() => setImageModalOpen(false)}
        >
          <div className="relative max-w-full max-h-full">
            <img 
              src={modalImageUrl} 
              alt="Document Full View" 
              className="max-w-full max-h-[90vh] object-contain rounded" 
              onClick={(e) => e.stopPropagation()} 
            />
            <button 
              className="absolute top-4 right-4 bg-white rounded-full p-2 text-black hover:bg-gray-200"
              onClick={() => setImageModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
