'use client'

import { useState } from 'react'
import { adminReviewStudentVerification } from './actions'

type Verification = {
  id: string
  full_name: string
  university_name: string
  card_signed_url: string | null
  submitted_at: string
  profiles?: {
    full_name: string
    phone: string
  }
}

export type ActiveStudent = {
  id: string
  full_name: string | null
  phone: string | null
  verification_expiry_date: string | null
  created_at: string | null
}

export default function StudentVerificationsClient({ 
  verifications, 
  activeStudents 
}: { 
  verifications: Verification[]
  activeStudents: ActiveStudent[] 
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending')

  const handleApprove = async (id: string) => {
    setLoadingId(id)
    try {
      await adminReviewStudentVerification(id, 'approved')
    } catch (err: any) {
      alert(err.message || 'Error approving application')
    } finally {
      setLoadingId(null)
    }
  }

  const handleReject = async (id: string) => {
    if (!rejectReason) {
      alert('Please provide a rejection reason')
      return
    }
    setLoadingId(id)
    try {
      await adminReviewStudentVerification(id, 'rejected', rejectReason)
      setRejectingId(null)
      setRejectReason('')
    } catch (err: any) {
      alert(err.message || 'Error rejecting application')
    } finally {
      setLoadingId(null)
    }
  }

  const getTimeRemaining = (expiryDate: string | null) => {
    if (!expiryDate) return { text: 'No Expiry Set', color: 'text-gray-500', bg: 'bg-gray-100' }
    
    const now = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return { text: 'Expired', color: 'text-rose-700', bg: 'bg-rose-100' }
    } else if (diffDays < 30) {
      return { text: `${diffDays} days left`, color: 'text-amber-700', bg: 'bg-amber-100' }
    } else {
      const months = Math.floor(diffDays / 30)
      const days = diffDays % 30
      return { text: `${months} months ${days} days left`, color: 'text-emerald-700', bg: 'bg-emerald-100' }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>Pending Approvals</span>
          {verifications.length > 0 && (
            <span className="bg-rose-100 text-rose-700 py-0.5 px-2 rounded-full text-[10px] font-black">
              {verifications.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'active'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>Active Students (Time Limits)</span>
          <span className="bg-gray-100 text-gray-700 py-0.5 px-2 rounded-full text-[10px] font-black">
            {activeStudents.length}
          </span>
        </button>
      </div>

      {activeTab === 'pending' && (
        <div className="space-y-6">
          {verifications.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l9-5-9-5-9 5 9 5z" />
              </svg>
              <p className="text-gray-500 text-base font-medium">No pending student verifications.</p>
            </div>
          ) : (
            verifications.map((v) => (
              <div key={v.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{v.full_name}</h3>
                      <p className="text-xs text-gray-500 mt-1">Submitted: {new Date(v.submitted_at).toLocaleString()}</p>
                      <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2">
                        <div className="bg-white p-3 rounded-xl border border-gray-200">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">University Name</span>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5">{v.university_name}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-gray-200">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Account Phone</span>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5">{v.profiles?.phone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {rejectingId === v.id ? (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <input
                            type="text"
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-xl px-3 py-2 w-full sm:w-64 focus:outline-none focus:border-indigo-500 placeholder-gray-400 font-medium"
                            placeholder="Reason for rejection..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                          />
                          <button
                            onClick={() => handleReject(v.id)}
                            disabled={loadingId === v.id}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all shadow-sm"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => {
                              setRejectingId(null)
                              setRejectReason('')
                            }}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold rounded-xl disabled:opacity-50 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <button
                            onClick={() => setRejectingId(v.id)}
                            disabled={loadingId === v.id}
                            className="flex-1 sm:flex-none px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApprove(v.id)}
                            disabled={loadingId === v.id}
                            className="flex-1 sm:flex-none px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md transition-all disabled:opacity-50"
                          >
                            {loadingId === v.id ? 'Approving...' : 'Approve'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Student Card / Fee Challan Document</h4>
                  <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 inline-block">
                    {v.card_signed_url ? (
                      <img 
                        src={v.card_signed_url} 
                        alt="Student Card" 
                        className="max-h-96 object-contain rounded-xl"
                      />
                    ) : (
                      <div className="p-8 text-sm text-gray-400">Image not available</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'active' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Student Name</th>
                  <th className="py-4 px-6">Phone Number</th>
                  <th className="py-4 px-6">Verification Date</th>
                  <th className="py-4 px-6">Time Limit (6 Months)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-800">
                {activeStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-400 font-normal">
                      No active student verifications found.
                    </td>
                  </tr>
                ) : (
                  activeStudents.map((student) => {
                    const timeRemaining = getTimeRemaining(student.verification_expiry_date)
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-6 font-semibold text-gray-900">
                          {student.full_name || 'Unnamed Student'}
                        </td>
                        <td className="py-3.5 px-6 font-mono text-gray-700">
                          {student.phone || 'N/A'}
                        </td>
                        <td className="py-3.5 px-6 text-gray-600 text-xs">
                          {student.created_at ? new Date(student.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3.5 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${timeRemaining.bg} ${timeRemaining.color}`}>
                            {timeRemaining.text}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
