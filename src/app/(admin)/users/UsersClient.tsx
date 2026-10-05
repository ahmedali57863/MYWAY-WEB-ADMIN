'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserProfile, deleteUserAccount } from './actions'
import { Header, Button, Icon, Badge } from '@/components/ui/FigmaUI'
import NewUserDetails from './NewUserDetails'

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
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null)

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
        <NewUserDetails
          user={selectedUser}
          onClose={() => {
            setViewModalOpen(false)
            setSelectedUser(null)
          }}
          onEdit={() => {
            const userToEdit = selectedUser
            setViewModalOpen(false)
            handleOpenEdit(userToEdit)
          }}
          onDelete={() => handleDeleteUser(selectedUser)}
          onImageClick={(url, title) => setLightboxImage({ url, title })}
        />
      )}

      {/* Lightbox for Avatars & Documents */}
      {lightboxImage && (
        <div
          className="global-image-lightbox-overlay"
          onClick={() => setLightboxImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="global-image-lightbox-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="global-image-lightbox-header">
              <div className="global-image-lightbox-title">
                <Icon name="users" size={15} />
                <span>{lightboxImage.title}</span>
              </div>
              <button
                type="button"
                className="global-image-lightbox-close"
                onClick={() => setLightboxImage(null)}
                aria-label="Close image preview"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="global-image-lightbox-body">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="global-image-lightbox-img"
              />
            </div>
            <div className="global-image-lightbox-footer">
              <p>
                <Icon name="check" size={14} /> High-resolution verified asset
              </p>
              <span>Click outside or press Close to dismiss</span>
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
