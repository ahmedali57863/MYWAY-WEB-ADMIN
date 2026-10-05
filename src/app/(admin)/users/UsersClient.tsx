'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserProfile, deleteUserAccount } from './actions'

export type UserProfile = {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  is_admin: boolean | null
  created_at?: string | null
  updated_at?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  city_region?: string | null
  identity_status?: string | null
  driver_status?: string | null
  student_status?: string | null
  verification_status?: string
  is_pro?: boolean
  is_verified_driver?: boolean
  verification_tier?: string
  cnic_verified?: boolean | null
  routes_published?: number
  ride_demands?: number
  matches_found?: number
}

export default function UsersClient({ users }: { users: UserProfile[] }) {
  const router = useRouter()
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'addresses' | 'verifications' | 'stats'>('info')

  // Edit form state
  const [editFullName, setEditFullName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editAvatarUrl, setEditAvatarUrl] = useState('')
  const [editIsAdmin, setEditIsAdmin] = useState(false)
  const [editVerificationStatus, setEditVerificationStatus] = useState('unverified')
  const [editIsPro, setEditIsPro] = useState(false)
  const [editIsVerifiedDriver, setEditIsVerifiedDriver] = useState(false)
  const [editCnicVerified, setEditCnicVerified] = useState(false)
  const [editVerificationTier, setEditVerificationTier] = useState('standard')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleOpenView = (user: UserProfile) => {
    setSelectedUser(user)
    setActiveTab('info')
    setViewModalOpen(true)
  }

  const handleOpenEdit = (user: UserProfile) => {
    setSelectedUser(user)
    setEditFullName(user.full_name || '')
    setEditPhone(user.phone || '')
    setEditAvatarUrl(user.avatar_url || '')
    setEditIsAdmin(!!user.is_admin)
    setEditVerificationStatus(user.verification_status || 'unverified')
    setEditIsPro(!!user.is_pro)
    setEditIsVerifiedDriver(!!user.is_verified_driver)
    setEditCnicVerified(!!user.cnic_verified)
    setEditVerificationTier(user.verification_tier || 'standard')
    setEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedUser) return
    setSaving(true)
    try {
      await updateUserProfile(selectedUser.id, {
        full_name: editFullName,
        phone: editPhone,
        avatar_url: editAvatarUrl,
        is_admin: editIsAdmin,
        verification_status: editVerificationStatus,
        is_pro: editIsPro,
        is_verified_driver: editIsVerifiedDriver,
        cnic_verified: editCnicVerified,
        verification_tier: editVerificationTier,
      })
      setEditModalOpen(false)
      setSelectedUser(null)
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update user profile'
      alert(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async (userToDelete?: UserProfile) => {
    const target = userToDelete || selectedUser
    if (!target) return
    if (!confirm(`Are you sure you want to delete user ${target.full_name || target.id}? This action cannot be undone.`)) {
      return
    }
    setDeleting(true)
    try {
      await deleteUserAccount(target.id)
      setViewModalOpen(false)
      setEditModalOpen(false)
      setSelectedUser(null)
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete user'
      alert(message)
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Not Available'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) + 
        ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-4">
      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-4 px-6">User</th>
                <th className="py-4 px-6">Phone Number</th>
                <th className="py-4 px-6">City / Region</th>
                <th className="py-4 px-6 text-center">Identity</th>
                <th className="py-4 px-6 text-center">CNIC</th>
                <th className="py-4 px-6 text-center">Driver</th>
                <th className="py-4 px-6">Registered On</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-800">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 font-normal">
                    No users found in database.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden">
                          {user.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.avatar_url} alt={user.full_name || 'User'} className="w-full h-full object-cover" />
                          ) : (
                            (user.full_name?.[0] || 'U').toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 leading-tight">{user.full_name || 'Unnamed User'}</p>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">{user.email || user.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-gray-700">
                      {user.phone || '+923000000000'}
                    </td>
                    <td className="py-3.5 px-6">
                      {user.city_region ? (
                        <span className="font-semibold text-sm text-gray-900">
                          {user.city_region}
                        </span>
                      ) : (
                        <span className="font-semibold text-xs px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                          Not Available
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                        user.identity_status?.toLowerCase() === 'verified' ? 'bg-blue-50 text-blue-700' : 'text-gray-600'
                      }`}>
                        {user.identity_status || '-'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      {user.cnic_verified ? (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Verified</span>
                      ) : (
                        <span className="text-xs font-semibold text-gray-500">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                        user.driver_status === 'Verified' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600'
                      }`}>
                        {user.driver_status || '-'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-gray-600 text-xs">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenView(user)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW USER DETAILS MODAL (Matching exact design pattern of screenshot) */}
      {viewModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-[#1E293B] text-slate-100 rounded-3xl w-full max-w-2xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header Bar */}
            <div className="px-6 py-4 bg-white/95 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Customer Details</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDeleteUser()}
                  disabled={deleting}
                  className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>{deleting ? 'Deleting...' : 'Delete User'}</span>
                </button>
                <button 
                  onClick={() => setViewModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* User Avatar & Key Stats Banner */}
              <div className="bg-[#0F172A] p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-inner">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full ring-4 ring-orange-500/30 overflow-hidden bg-slate-800 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg">
                    {selectedUser.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={selectedUser.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                        onClick={() => setEnlargedImage(selectedUser.avatar_url)}
                      />
                    ) : (
                      (selectedUser.full_name?.[0] || 'U').toUpperCase()
                    )}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white leading-tight">{selectedUser.full_name || 'Unnamed User'}</h4>
                    <span className={`inline-block mt-1 px-3 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider border ${
                      selectedUser.driver_status === 'Verified' 
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                        : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                    }`}>
                      {selectedUser.driver_status === 'Verified' ? 'DRIVER' : 'PASSENGER'}
                    </span>
                    <p className="text-xs text-slate-400 font-mono mt-1.5 flex items-center gap-1">
                      <span className="text-slate-500">ID:</span>
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-300">{selectedUser.id}</span>
                    </p>
                  </div>
                </div>

                {/* Ride Stats Widget */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl p-4 flex items-center gap-6 shadow-xl w-full md:w-auto justify-around">
                  <div className="text-center">
                    <p className="text-[10px] font-black tracking-wider uppercase opacity-90">DEMANDS</p>
                    <p className="text-2xl font-black mt-0.5">{selectedUser.ride_demands ?? 0}</p>
                  </div>
                  <div className="h-8 w-px bg-white/20"></div>
                  <div className="text-center">
                    <p className="text-[10px] font-black tracking-wider uppercase opacity-90">ROUTES</p>
                    <p className="text-2xl font-black mt-0.5">{selectedUser.routes_published ?? 0}</p>
                  </div>
                  <div className="h-8 w-px bg-white/20"></div>
                  <div className="text-center">
                    <p className="text-[10px] font-black tracking-wider uppercase opacity-90">MATCHES</p>
                    <p className="text-2xl font-black mt-0.5">{selectedUser.matches_found ?? 0}</p>
                  </div>
                </div>
              </div>

              {/* Sub Navigation Tabs inside Modal */}
              <div className="flex border-b border-slate-700 gap-2">
                {(
                  [
                    { id: 'info', label: 'Profile Info', icon: '👤' },
                    { id: 'addresses', label: 'Addresses', icon: '📍' },
                    { id: 'verifications', label: 'Verifications', icon: '🛡️' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                      activeTab === tab.id
                        ? 'border-orange-500 text-orange-400 bg-orange-500/10 rounded-t-lg'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              {activeTab === 'info' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#0F172A] p-4 rounded-2xl border border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Full Name</p>
                    <p className="text-sm font-semibold text-white mt-1">{selectedUser.full_name || 'N/A'}</p>
                  </div>
                  <div className="bg-[#0F172A] p-4 rounded-2xl border border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</p>
                    <p className="text-sm font-semibold text-white mt-1 font-mono">{selectedUser.phone || 'N/A'}</p>
                  </div>
                  <div className="bg-[#0F172A] p-4 rounded-2xl border border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                    <p className="text-sm font-semibold text-white mt-1">{selectedUser.email || 'N/A'}</p>
                  </div>
                  <div className="bg-[#0F172A] p-4 rounded-2xl border border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Admin Status</p>
                    <p className="text-sm font-semibold text-white mt-1">
                      {selectedUser.is_admin ? (
                        <span className="text-emerald-400 font-bold">Administrator</span>
                      ) : (
                        <span className="text-slate-400">Regular User</span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'addresses' && (
                <div className="space-y-4">
                  <div className="bg-[#0F172A] p-4 rounded-2xl border border-slate-800 flex items-start gap-3">
                    <span className="text-xl">📍</span>
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">MANUAL ADDRESS</p>
                      <p className="text-sm font-medium text-slate-200 mt-1">{selectedUser.address || selectedUser.city || 'No manual address specified'}</p>
                    </div>
                  </div>
                  <div className="bg-[#0F172A] p-4 rounded-2xl border border-slate-800 flex items-start gap-3">
                    <span className="text-xl">📍</span>
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">LAST KNOWN GPS ADDRESS</p>
                      <p className="text-sm font-medium text-slate-400 mt-1">No GPS coordinates recorded</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'verifications' && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-[#0F172A] p-4 rounded-2xl border border-slate-800 text-center">
                    <p className="text-xs text-slate-400 font-bold uppercase">Identity Status</p>
                    <p className="text-sm font-extrabold text-emerald-400 mt-2">{selectedUser.identity_status || 'Unverified'}</p>
                  </div>
                  <div className="bg-[#0F172A] p-4 rounded-2xl border border-slate-800 text-center">
                    <p className="text-xs text-slate-400 font-bold uppercase">CNIC Status</p>
                    <p className="text-sm font-extrabold text-emerald-400 mt-2">{selectedUser.cnic_verified ? 'Verified' : 'Unverified'}</p>
                  </div>
                  <div className="bg-[#0F172A] p-4 rounded-2xl border border-slate-800 text-center">
                    <p className="text-xs text-slate-400 font-bold uppercase">Driver Status</p>
                    <p className="text-sm font-extrabold text-indigo-400 mt-2">{selectedUser.driver_status || 'Not Applied'}</p>
                  </div>
                  <div className="bg-[#0F172A] p-4 rounded-2xl border border-slate-800 text-center">
                    <p className="text-xs text-slate-400 font-bold uppercase">Student Card</p>
                    <p className="text-sm font-extrabold text-amber-400 mt-2">{selectedUser.student_status || 'N/A'}</p>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Bottom Action */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-center">
              <button
                onClick={() => setViewModalOpen(false)}
                className="w-full max-w-xs py-3 bg-[#0F172A] hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-sm font-bold shadow-md transition-all"
              >
                Close Profile Details
              </button>
            </div>

          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md border border-gray-200 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Edit User Details</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>

            <div className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Avatar Image URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100 mt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Identity Status</label>
                  <select
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={editVerificationStatus}
                    onChange={(e) => setEditVerificationStatus(e.target.value)}
                  >
                    <option value="unverified">Unverified</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified (Blue Tick)</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Verification Tier</label>
                  <select
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={editVerificationTier}
                    onChange={(e) => setEditVerificationTier(e.target.value)}
                  >
                    <option value="standard">Standard</option>
                    <option value="student">Student</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="proCheck"
                    checked={editIsPro}
                    onChange={(e) => setEditIsPro(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="proCheck" className="text-sm font-semibold text-gray-800">
                    Pro / Student Status (Gold Tick)
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="cnicCheck"
                    checked={editCnicVerified}
                    onChange={(e) => setEditCnicVerified(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="cnicCheck" className="text-sm font-semibold text-gray-800">
                    CNIC Verified
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="driverCheck"
                    checked={editIsVerifiedDriver}
                    onChange={(e) => setEditIsVerifiedDriver(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="driverCheck" className="text-sm font-semibold text-gray-800">
                    Verified Driver Status
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="adminCheck"
                    checked={editIsAdmin}
                    onChange={(e) => setEditIsAdmin(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="adminCheck" className="text-sm font-semibold text-gray-800">
                    Grant Administrator Privileges
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ENLARGED IMAGE MODAL */}
      {enlargedImage && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 cursor-pointer"
          onClick={() => setEnlargedImage(null)}
        >
          <img 
            src={enlargedImage} 
            alt="Enlarged User" 
            className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain cursor-default" 
            onClick={(e) => e.stopPropagation()} 
          />
          <button 
            className="absolute top-6 right-6 text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-colors flex items-center justify-center w-10 h-10"
            onClick={() => setEnlargedImage(null)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

    </div>
  )
}
