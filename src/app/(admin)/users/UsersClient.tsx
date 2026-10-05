'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserProfile, deleteUserAccount } from './actions'
import { Header, Button, Icon, Badge } from '@/components/ui/FigmaUI'

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
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'driver' | 'passenger'>('all')

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [activeModalTab, setActiveModalTab] = useState<'info' | 'addresses' | 'verifications'>('info')
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleCopy = (text: string, fieldName: string) => {
    if (!text || text === 'N/A' || text === 'Not Available') return
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

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

  // Metrics
  const totalCount = users.length
  const verifiedCount = users.filter(
    (u) =>
      u.identity_status?.toLowerCase() === 'verified' ||
      u.verification_status === 'verified' ||
      u.cnic_verified
  ).length
  const driverCount = users.filter((u) => u.is_verified_driver || u.driver_status === 'Verified').length
  const studentCount = users.filter((u) => u.verification_tier === 'student' || u.is_pro).length

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter === 'driver' && !u.is_verified_driver && u.driver_status !== 'Verified') return false
      if (roleFilter === 'passenger' && (u.is_verified_driver || u.driver_status === 'Verified')) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        (u.full_name && u.full_name.toLowerCase().includes(q)) ||
        (u.phone && u.phone.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.city_region && u.city_region.toLowerCase().includes(q)) ||
        u.id.toLowerCase().includes(q)
      )
    })
  }, [users, roleFilter, search])

  const handleOpenView = (user: UserProfile) => {
    setSelectedUser(user)
    setActiveModalTab('info')
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
      const message = err instanceof Error ? err.message : 'Failed to update user'
      alert(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async (userToDelete?: UserProfile) => {
    const target = userToDelete || selectedUser
    if (!target) return
    if (!confirm(`Are you sure you want to permanently delete user ${target.full_name || target.id}?`)) {
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

  const formatAccountTenure = (dateStr?: string | null) => {
    if (!dateStr) {
      return {
        createdDateFormatted: 'Not Available',
        createdTimeFormatted: '',
        fullDateFormatted: 'Not Available',
        tenureFormatted: 'Joined recently',
      }
    }

    const created = new Date(dateStr)
    if (isNaN(created.getTime())) {
      return {
        createdDateFormatted: 'Not Available',
        createdTimeFormatted: '',
        fullDateFormatted: 'Not Available',
        tenureFormatted: 'Joined recently',
      }
    }

    const createdDateFormatted = created.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

    const createdTimeFormatted = created.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })

    const fullDateFormatted = `${createdDateFormatted} at ${createdTimeFormatted}`

    const now = new Date()
    let diffMs = now.getTime() - created.getTime()
    if (diffMs < 0) diffMs = 0

    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (totalDays === 0) {
      const tenureFormatted = totalHours <= 1 ? 'Attached with MYWAY today' : `Attached with MYWAY for ${totalHours} hours`
      return { createdDateFormatted, createdTimeFormatted, fullDateFormatted, tenureFormatted }
    }

    const months = Math.floor(totalDays / 30.4375)
    const remAfterMonths = Math.floor(totalDays - months * 30.4375)
    const weeks = Math.floor(remAfterMonths / 7)
    const days = remAfterMonths % 7

    const parts: string[] = []
    if (months > 0) {
      parts.push(`${months} ${months === 1 ? 'month' : 'months'}`)
    }
    if (weeks > 0) {
      parts.push(`${weeks} ${weeks === 1 ? 'week' : 'weeks'}`)
    }
    if (days > 0 || parts.length === 0) {
      parts.push(`${days} ${days === 1 ? 'day' : 'days'}`)
    }

    const tenureFormatted = `Attached with MYWAY for ${parts.join(' ')}`
    return { createdDateFormatted, createdTimeFormatted, fullDateFormatted, tenureFormatted }
  }

  return (
    <>
      <Header
        title="Users"
        description="Manage accounts, verification status and platform privileges."
        actions={
          <Button onClick={() => alert('Add user modal: User self-registration is enabled.')}>
            <Icon name="plus" /> Add account
          </Button>
        }
      />

      {/* Inline Stats */}
      <section className="inline-stats">
        <div>
          <span>Total accounts</span>
          <strong>{totalCount.toLocaleString()}</strong>
        </div>
        <div>
          <span>Verified</span>
          <strong>{verifiedCount.toLocaleString()}</strong>
        </div>
        <div>
          <span>Drivers</span>
          <strong>{driverCount.toLocaleString()}</strong>
        </div>
        <div>
          <span>Students</span>
          <strong>{studentCount.toLocaleString()}</strong>
        </div>
      </section>

      {/* Main Table Panel */}
      <section className="panel">
        <div className="toolbar">
          <label className="search-box">
            <Icon name="search" />
            <input
              placeholder="Search name, phone, city or user ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <div className="filters">
            <button
              type="button"
              className={`filter ${roleFilter === 'all' ? 'active' : ''}`}
              onClick={() => setRoleFilter('all')}
            >
              All users
            </button>
            <button
              type="button"
              className={`filter ${roleFilter === 'driver' ? 'active' : ''}`}
              onClick={() => setRoleFilter('driver')}
            >
              Drivers
            </button>
            <button
              type="button"
              className={`filter ${roleFilter === 'passenger' ? 'active' : ''}`}
              onClick={() => setRoleFilter('passenger')}
            >
              Passengers
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Phone number</th>
                <th>City / region</th>
                <th>Account type</th>
                <th>Identity</th>
                <th>Registered</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    No accounts found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isDriver = user.is_verified_driver || user.driver_status === 'Verified'
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          {user.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.avatar_url}
                              alt={user.full_name || 'User'}
                            />
                          ) : (
                            <div className="avatar-initial">
                              {(user.full_name?.[0] || 'U').toUpperCase()}
                            </div>
                          )}
                          <span>
                            <b>{user.full_name || 'Unnamed User'}</b>
                            <small>{user.email || user.id.slice(0, 10)}</small>
                          </span>
                        </div>
                      </td>
                      <td>{user.phone || '+923000000000'}</td>
                      <td>{user.city_region || user.address || 'Not Available'}</td>
                      <td>
                        <Badge tone={isDriver ? 'blue' : 'neutral'}>
                          {isDriver ? 'Driver' : 'Passenger'}
                        </Badge>
                      </td>
                      <td>
                        <Badge
                          tone={
                            user.identity_status?.toLowerCase() === 'verified' || user.cnic_verified
                              ? 'green'
                              : user.identity_status?.toLowerCase() === 'pending'
                              ? 'amber'
                              : 'neutral'
                          }
                        >
                          {user.identity_status || (user.cnic_verified ? 'Verified' : 'Unverified')}
                        </Badge>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 600, color: '#334056' }}>
                            {formatAccountTenure(user.created_at).createdDateFormatted}
                          </span>
                          <small style={{ color: '#8c95a4', fontSize: '10px' }}>
                            {formatAccountTenure(user.created_at).tenureFormatted}
                          </small>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenView(user)}
                            className="icon-button"
                            title="View customer details"
                          >
                            <Icon name="eye" size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            className="icon-button"
                            title="Edit privileges"
                          >
                            <Icon name="edit" size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user)}
                            className="icon-button"
                            title="Delete user"
                            style={{ color: '#d64c56' }}
                          >
                            <Icon name="trash" size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* VIEW CUSTOMER DETAILS MODAL */}
      {viewModalOpen && selectedUser && (
        <div className="modal-backdrop" onClick={() => setViewModalOpen(false)}>
          <div
            className="command-modal"
            style={{
              width: 'min(660px, calc(100% - 32px))',
              padding: '0',
              background: 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #edf0f4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#ffffff',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: '#6366f1',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: '2px',
                  }}
                >
                  Customer Account Profile
                </span>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                  Customer Details
                </h3>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#64748b',
                    marginTop: '4px',
                  }}
                >
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>ID: {selectedUser.id}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedUser.id, 'id')}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: copiedField === 'id' ? '#16a34a' : '#6366f1',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '10px',
                      padding: '1px 4px',
                      borderRadius: '4px',
                    }}
                  >
                    {copiedField === 'id' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleDeleteUser()}
                  style={{
                    color: '#ef4444',
                    borderColor: '#fee2e2',
                    background: '#fef2f2',
                    border: '1px solid #fee2e2',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Icon name="trash" size={14} /> Delete
                </button>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setViewModalOpen(false)}
                  style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body Scrollable */}
            <div style={{ padding: '22px 24px', maxHeight: '72vh', overflowY: 'auto' }}>
              {/* User Profile Hero Card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)',
                  padding: '18px 20px',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '16px',
                }}
              >
                {selectedUser.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedUser.avatar_url}
                    alt="Avatar"
                    style={{
                      width: '62px',
                      height: '62px',
                      borderRadius: '14px',
                      objectFit: 'cover',
                      border: '2px solid white',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
                      cursor: 'pointer',
                    }}
                    title="Click image to inspect in full view"
                  />
                ) : (
                  <div
                    className="avatar-initial"
                    style={{
                      width: '62px',
                      height: '62px',
                      borderRadius: '14px',
                      fontSize: '20px',
                      fontWeight: 800,
                      background: '#e0e7ff',
                      color: '#4338ca',
                      display: 'grid',
                      placeItems: 'center',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                    }}
                  >
                    {(selectedUser.full_name?.[0] || 'U').toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                      {selectedUser.full_name || 'Unnamed User'}
                    </h4>
                    <Badge tone={selectedUser.is_verified_driver ? 'blue' : 'neutral'}>
                      {selectedUser.is_verified_driver ? 'Driver' : 'Passenger'}
                    </Badge>
                    {selectedUser.is_pro && <Badge tone="amber">Pro / Student</Badge>}
                    {selectedUser.is_admin && <Badge tone="red">Admin</Badge>}
                  </div>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: '12px',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>{selectedUser.email || 'No email registered'}</span>
                    {selectedUser.phone && <span>· {selectedUser.phone}</span>}
                  </p>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '8px',
                      color: '#4338ca',
                      background: '#eef2ff',
                      border: '1px solid #c7d2fe',
                      padding: '4px 10px',
                      borderRadius: '7px',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    <Icon name="clock" size={13} />
                    <span>{formatAccountTenure(selectedUser.created_at).tenureFormatted}</span>
                  </div>
                </div>
              </div>

              {/* Activity Stats Strip */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px',
                  marginBottom: '18px',
                }}
              >
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#eff6ff',
                      color: '#2563eb',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '14px',
                    }}
                  >
                    🚗
                  </span>
                  <div>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '10px',
                        color: '#64748b',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Routes
                    </span>
                    <strong style={{ fontSize: '14px', color: '#0f172a', fontWeight: 800 }}>
                      {selectedUser.routes_published ?? 0}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#faf5ff',
                      color: '#9333ea',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '14px',
                    }}
                  >
                    📍
                  </span>
                  <div>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '10px',
                        color: '#64748b',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Ride Demands
                    </span>
                    <strong style={{ fontSize: '14px', color: '#0f172a', fontWeight: 800 }}>
                      {selectedUser.ride_demands ?? 0}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#ecfdf5',
                      color: '#059669',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '14px',
                    }}
                  >
                    🤝
                  </span>
                  <div>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '10px',
                        color: '#64748b',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Matches
                    </span>
                    <strong style={{ fontSize: '14px', color: '#0f172a', fontWeight: 800 }}>
                      {selectedUser.matches_found ?? 0}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Modal Tabs Navigation */}
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '2px',
                  marginBottom: '16px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveModalTab('info')}
                  style={{
                    border: 'none',
                    background: activeModalTab === 'info' ? '#f1f5f9' : 'transparent',
                    color: activeModalTab === 'info' ? '#4f46e5' : '#64748b',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon name="users" size={14} /> Profile Info
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalTab('addresses')}
                  style={{
                    border: 'none',
                    background: activeModalTab === 'addresses' ? '#f1f5f9' : 'transparent',
                    color: activeModalTab === 'addresses' ? '#4f46e5' : '#64748b',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon name="route" size={14} /> Addresses & Region
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalTab('verifications')}
                  style={{
                    border: 'none',
                    background: activeModalTab === 'verifications' ? '#f1f5f9' : 'transparent',
                    color: activeModalTab === 'verifications' ? '#4f46e5' : '#64748b',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon name="shield" size={14} /> Verifications & Trust
                </button>
              </div>

              {/* Tab Contents: Profile Info */}
              {activeModalTab === 'info' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Full Name Card */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '12px 14px',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '10px',
                        fontWeight: 800,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      <Icon name="users" size={13} /> Full Name
                    </span>
                    <p style={{ margin: '6px 0 0', fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                      {selectedUser.full_name || 'Not Available'}
                    </p>
                  </div>

                  {/* Phone Number Card */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '12px 14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '10px',
                          fontWeight: 800,
                          color: '#64748b',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        <Icon name="chat" size={13} /> Phone Number
                      </span>
                      {selectedUser.phone && selectedUser.phone !== 'N/A' && (
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedUser.phone || '', 'phone')}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: copiedField === 'phone' ? '#16a34a' : '#6366f1',
                            fontSize: '10px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {copiedField === 'phone' ? '✓ Copied' : 'Copy'}
                        </button>
                      )}
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                      {selectedUser.phone || 'N/A'}
                    </p>
                  </div>

                  {/* Email Card */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '12px 14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '10px',
                          fontWeight: 800,
                          color: '#64748b',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        <Icon name="mail" size={13} /> Email Address
                      </span>
                      {selectedUser.email && (
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedUser.email || '', 'email')}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: copiedField === 'email' ? '#16a34a' : '#6366f1',
                            fontSize: '10px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {copiedField === 'email' ? '✓ Copied' : 'Copy'}
                        </button>
                      )}
                    </div>
                    <p
                      style={{
                        margin: '6px 0 0',
                        fontSize: '13px',
                        fontWeight: 800,
                        color: '#1e293b',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {selectedUser.email || 'N/A'}
                    </p>
                  </div>

                  {/* Admin Status Card */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '12px 14px',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '10px',
                        fontWeight: 800,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      <Icon name="shield" size={13} /> Admin Privileges
                    </span>
                    <div style={{ marginTop: '6px' }}>
                      <Badge tone={selectedUser.is_admin ? 'red' : 'neutral'}>
                        {selectedUser.is_admin ? 'Administrator' : 'Regular User'}
                      </Badge>
                    </div>
                  </div>

                  {/* Account Created On Card */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '12px 14px',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '10px',
                        fontWeight: 800,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      <Icon name="clock" size={13} /> Account Created On
                    </span>
                    <p style={{ margin: '6px 0 0', fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                      {formatAccountTenure(selectedUser.created_at).fullDateFormatted}
                    </p>
                  </div>

                  {/* Platform Tenure Duration Card */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '12px 14px',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '10px',
                        fontWeight: 800,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      <Icon name="trend" size={13} /> Platform Tenure (Duration)
                    </span>
                    <div style={{ marginTop: '6px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          color: '#4338ca',
                          background: '#eef2ff',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        {formatAccountTenure(selectedUser.created_at).tenureFormatted}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Contents: Addresses */}
              {activeModalTab === 'addresses' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '14px 16px',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '10px',
                        fontWeight: 800,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      <Icon name="route" size={13} /> Registered Manual Address
                    </span>
                    <p style={{ margin: '8px 0 0', fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                      {selectedUser.address || selectedUser.city || 'No manual address specified'}
                    </p>
                  </div>

                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '14px 16px',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '10px',
                        fontWeight: 800,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      <Icon name="route" size={13} /> City & Operating Region
                    </span>
                    <p style={{ margin: '8px 0 0', fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                      {selectedUser.city_region || 'Unspecified'}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab Contents: Verifications */}
              {activeModalTab === 'verifications' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        color: '#64748b',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      Identity Review
                    </span>
                    <p style={{ margin: '8px 0 4px', fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>
                      {selectedUser.identity_status || 'Unverified'}
                    </p>
                    <Badge
                      tone={
                        selectedUser.identity_status?.toLowerCase() === 'verified'
                          ? 'green'
                          : selectedUser.identity_status?.toLowerCase() === 'pending'
                          ? 'amber'
                          : 'neutral'
                      }
                    >
                      {selectedUser.identity_status || 'Unverified'}
                    </Badge>
                  </div>

                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        color: '#64748b',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      CNIC Document
                    </span>
                    <p style={{ margin: '8px 0 4px', fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>
                      {selectedUser.cnic_verified ? 'Verified' : 'Unverified'}
                    </p>
                    <Badge tone={selectedUser.cnic_verified ? 'green' : 'neutral'}>
                      {selectedUser.cnic_verified ? 'Verified CNIC' : 'No CNIC'}
                    </Badge>
                  </div>

                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        color: '#64748b',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      Campus / Pro Tier
                    </span>
                    <p
                      style={{
                        margin: '8px 0 4px',
                        fontWeight: 800,
                        fontSize: '14px',
                        color: '#0f172a',
                        textTransform: 'capitalize',
                      }}
                    >
                      {selectedUser.verification_tier || 'Standard'}
                    </p>
                    <Badge tone={selectedUser.verification_tier === 'student' || selectedUser.is_pro ? 'amber' : 'neutral'}>
                      {selectedUser.verification_tier === 'student' || selectedUser.is_pro
                        ? 'Student Active'
                        : 'Standard'}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid #edf0f4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#fafbfc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '11px' }}>
                <Icon name="shield" size={14} />
                <span>MYWAY Official Customer Record</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="primary"
                  onClick={() => {
                    const u = selectedUser
                    setViewModalOpen(false)
                    handleOpenEdit(u)
                  }}
                >
                  <Icon name="edit" /> Edit Profile
                </Button>
                <Button variant="secondary" onClick={() => setViewModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER PRIVILEGES MODAL */}
      {editModalOpen && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setEditModalOpen(false)
            setSelectedUser(null)
          }}
          saving={saving}
          onSave={async (formData) => {
            setSaving(true)
            try {
              await updateUserProfile(selectedUser.id, {
                full_name: formData.fullName,
                phone: formData.phone,
                verification_status: formData.identity.toLowerCase(),
                verification_tier: formData.tier.toLowerCase(),
                is_pro: formData.pro,
                cnic_verified: formData.cnic,
                is_verified_driver: formData.driver,
                is_admin: formData.admin,
              })
              setEditModalOpen(false)
              setSelectedUser(null)
              router.refresh()
            } catch (err: any) {
              alert(err.message || 'Failed to update user profile')
            } finally {
              setSaving(false)
            }
          }}
        />
      )}
    </>
  )
}

function EditUserModal({
  user,
  onClose,
  onSave,
  saving,
}: {
  user: UserProfile
  onClose: () => void
  onSave: (data: {
    fullName: string
    phone: string
    identity: string
    tier: string
    pro: boolean
    cnic: boolean
    driver: boolean
    admin: boolean
  }) => Promise<void>
  saving: boolean
}) {
  const [fullName, setFullName] = useState(user.full_name || '')
  const [phone, setPhone] = useState((user.phone || '').replace(/\s/g, ''))
  const [identity, setIdentity] = useState(
    user.verification_status
      ? user.verification_status.charAt(0).toUpperCase() + user.verification_status.slice(1).toLowerCase()
      : user.identity_status || 'Unverified'
  )
  const [tier, setTier] = useState(
    user.verification_tier?.toLowerCase() === 'student' || user.is_pro ? 'Student' : 'Standard'
  )
  const [pro, setPro] = useState(!!user.is_pro || user.verification_tier?.toLowerCase() === 'student')
  const [cnic, setCnic] = useState(!!user.cnic_verified)
  const [driver, setDriver] = useState(!!user.is_verified_driver || user.driver_status === 'Verified')
  const [admin, setAdmin] = useState(!!user.is_admin)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave({
      fullName,
      phone,
      identity,
      tier,
      pro,
      cnic,
      driver,
      admin,
    })
  }

  return (
    <div className="edit-user-layer" onClick={onClose}>
      <form className="edit-user-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <header className="edit-user-header">
          <div>
            <span>PRIVILEGE OVERRIDE</span>
            <h2>Edit user</h2>
            <p>Update profile data and platform access for {user.full_name || 'User'}.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close edit user">
            <Icon name="close" />
          </button>
        </header>

        <div className="edit-user-profile">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.full_name || 'Avatar'} />
          ) : (
            <div className="avatar-initial">{(user.full_name?.[0] || 'U').toUpperCase()}</div>
          )}
          <div>
            <h3>{user.full_name || 'Unnamed User'}</h3>
            <p>{user.email || 'user@myway.pk'}</p>
            <span>{user.id}</span>
          </div>
          <Badge tone="amber">Admin override</Badge>
        </div>

        <div className="edit-user-content">
          <section className="edit-form-section">
            <div className="edit-section-heading">
              <span><Icon name="users" /></span>
              <div>
                <h3>Account information</h3>
                <p>Edit the customer’s primary profile fields.</p>
              </div>
            </div>
            <div className="edit-fields">
              <label>
                <span>Full name</span>
                <div className="edit-input">
                  <Icon name="users" />
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
              </label>
              <label>
                <span>Phone number</span>
                <div className="edit-input">
                  <Icon name="chat" />
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </label>
            </div>
          </section>

          <section className="edit-form-section">
            <div className="edit-section-heading">
              <span><Icon name="shield" /></span>
              <div>
                <h3>Verification controls</h3>
                <p>Change identity review status and customer tier.</p>
              </div>
            </div>
            <div className="edit-fields">
              <label>
                <span>Identity status</span>
                <select value={identity} onChange={(e) => setIdentity(e.target.value)}>
                  <option value="Unverified">Unverified</option>
                  <option value="Pending">Pending</option>
                  <option value="Verified">Verified</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <small>Controls the identity badge shown across MYWAY.</small>
              </label>
              <label>
                <span>Verification tier</span>
                <select
                  value={tier}
                  onChange={(e) => {
                    const val = e.target.value
                    setTier(val)
                    if (val === 'Student') {
                      setPro(true)
                    }
                  }}
                >
                  <option value="Standard">Standard</option>
                  <option value="Student">Student</option>
                </select>
                <small>Student tier unlocks education benefits.</small>
              </label>
            </div>
          </section>

          <section className="edit-form-section">
            <div className="edit-section-heading">
              <span><Icon name="settings" /></span>
              <div>
                <h3>Privileges & access</h3>
                <p>Use these overrides carefully. Changes apply immediately.</p>
              </div>
            </div>
            <div className="privilege-list">
              <Privilege
                icon="student"
                tone="gold"
                title="Student / Pro status"
                description="Gold tick with an automatically calculated 6-month expiry."
                checked={pro}
                onChange={setPro}
                meta={pro ? 'Expires in 6 months' : 'Not enabled'}
              />
              <Privilege
                icon="check"
                tone="green"
                title="CNIC verified override"
                description="Marks the national identity document as manually verified."
                checked={cnic}
                onChange={setCnic}
                meta={cnic ? 'Manually verified' : 'Uses review status'}
              />
              <Privilege
                icon="car"
                tone="blue"
                title="Verified driver privilege"
                description="Grants immediate driver rights without application review."
                checked={driver}
                onChange={setDriver}
                meta={driver ? 'Driver access active' : 'No driver access'}
              />
              <Privilege
                icon="shield"
                tone="red"
                title="Administrator access"
                description="Grants full access to the MYWAY management console."
                checked={admin}
                onChange={setAdmin}
                meta={admin ? 'Full admin access' : 'Regular user'}
              />
            </div>
          </section>

          {admin && (
            <div className="admin-warning">
              <Icon name="alert" />
              <div>
                <b>High-risk permission</b>
                <p>
                  Administrator access allows this account to view customer data, approve drivers, and modify
                  platform settings.
                </p>
              </div>
            </div>
          )}
        </div>

        <footer className="edit-user-footer">
          <p>
            <Icon name="shield" /> Changes are recorded in the admin audit log.
          </p>
          <div>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </footer>
      </form>
    </div>
  )
}

function Privilege({
  icon,
  tone,
  title,
  description,
  checked,
  onChange,
  meta,
}: {
  icon: 'student' | 'check' | 'car' | 'shield'
  tone: string
  title: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
  meta: string
}) {
  return (
    <label className="privilege-row">
      <span className={`privilege-icon ${tone}`}><Icon name={icon} /></span>
      <span className="privilege-copy">
        <b>{title}</b>
        <small>{description}</small>
        <em>{meta}</em>
      </span>
      <span className="edit-switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <i />
      </span>
    </label>
  )
}
