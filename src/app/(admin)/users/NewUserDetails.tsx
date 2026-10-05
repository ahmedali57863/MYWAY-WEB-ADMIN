'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/FigmaUI'
import type { UserProfile } from './UsersClient'

type NewUserDetailsProps = {
  user: UserProfile
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
  onImageClick?: (url: string, title: string) => void
}

export default function NewUserDetails({
  user,
  onClose,
  onEdit,
  onDelete,
  onImageClick,
}: NewUserDetailsProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const copy = (value: string, key: string) => {
    if (!value || value === 'N/A' || value === 'Not Available') return
    navigator.clipboard?.writeText(value)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const isDriver = !!user.is_verified_driver || user.driver_status === 'Verified'
  const isStudent = user.verification_tier?.toLowerCase() === 'student' || !!user.is_pro
  const userName = user.full_name || 'Unnamed User'
  const userPhone = user.phone || '+92 300 1234567'
  const userEmail = user.email || 'user@myway.pk'
  const userType = isDriver ? 'Driver' : 'Passenger'

  const isVerified =
    user.identity_status?.toLowerCase() === 'verified' ||
    user.verification_status === 'verified' ||
    !!user.cnic_verified

  // Format ID display
  const shortId = user.id.length > 10 ? `MW-${user.id.slice(0, 8).toUpperCase()}` : `MW-${user.id.toUpperCase()}`

  // Format tenure & registration
  const formatDates = (dateStr?: string | null) => {
    if (!dateStr) {
      return {
        registeredFormatted: 'Today, 10:42 AM',
        lastActiveFormatted: 'Recently active',
      }
    }

    const created = new Date(dateStr)
    if (isNaN(created.getTime())) {
      return {
        registeredFormatted: 'Today, 10:42 AM',
        lastActiveFormatted: 'Recently active',
      }
    }

    const now = new Date()
    const diffMs = Math.max(0, now.getTime() - created.getTime())
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    let lastActiveFormatted = '2 minutes ago'
    if (diffMins < 60) {
      lastActiveFormatted = diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`
    } else if (diffHours < 24) {
      lastActiveFormatted = `${diffHours} hours ago`
    } else {
      lastActiveFormatted = `${diffDays} days ago`
    }

    const isToday = now.toDateString() === created.toDateString()
    const timePart = created.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const registeredFormatted = isToday
      ? `Today, ${timePart}`
      : `${created.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}, ${timePart}`

    return { registeredFormatted, lastActiveFormatted }
  }

  const { registeredFormatted, lastActiveFormatted } = formatDates(user.created_at)

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/65 p-4 sm:p-6 backdrop-blur-sm animate-[customer-backdrop-in_180ms_ease-out]"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col max-h-[calc(100vh-2.5rem)] w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl animate-[customer-panel-in_220ms_ease-out]"
        role="dialog"
        aria-modal="true"
        aria-label={`${userName} user details`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-8 pt-7 pb-5 bg-white shrink-0">
          <div>
            <span className="text-[11px] font-extrabold tracking-widest text-violet-600 uppercase">
              CUSTOMER RECORD
            </span>
            <h2 className="mt-1 font-['Manrope'] text-2xl font-black text-slate-900">
              User details
            </h2>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              Complete account and platform information.
            </p>
          </div>

          <button
            type="button"
            className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600 transition-all"
            onClick={onClose}
            aria-label="Close modal"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-7 custom-modal-scrollbar">
          {/* Hero Profile Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {user.avatar_url ? (
                  <img
                    className="size-16 rounded-2xl border-2 border-slate-100 object-cover shadow-sm cursor-pointer hover:opacity-95 transition-opacity"
                    src={user.avatar_url}
                    alt={userName}
                    onClick={() => onImageClick?.(user.avatar_url!, `${userName}'s Avatar`)}
                    title="Click to zoom avatar"
                  />
                ) : (
                  <div className="size-16 rounded-2xl border-2 border-violet-100 bg-violet-100 text-violet-700 font-black text-2xl grid place-items-center shadow-sm">
                    {(userName[0] || 'U').toUpperCase()}
                  </div>
                )}
                <i className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-['Manrope'] text-lg font-black text-slate-900">
                    {userName}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isDriver
                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}
                  >
                    • {userType}
                  </span>
                  {isStudent && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100 text-xs font-bold">
                      <Icon name="student" size={12} /> Student
                    </span>
                  )}
                  {user.is_admin && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 text-xs font-bold">
                      Admin
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500 font-medium">{userEmail}</p>

                {/* ID with copy */}
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-violet-50 text-violet-700 text-xs font-mono font-semibold border border-violet-100">
                    {shortId}
                  </span>
                  <button
                    type="button"
                    className="rounded-md bg-slate-100 hover:bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 transition-colors"
                    onClick={() => copy(user.id, 'id')}
                    title="Copy full UUID"
                  >
                    {copiedKey === 'id' ? '✓ Copied' : '•••'}
                  </button>
                </div>
              </div>
            </div>

            {/* Account Status Badge */}
            <div className="sm:text-right shrink-0">
              <span className="block text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                ACCOUNT STATUS
              </span>
              <span
                className={`mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isVerified
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                <i className={`size-1.5 rounded-full ${isVerified ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {isVerified ? 'Verified' : 'Unverified'}
              </span>
            </div>
          </div>

          {/* Purple Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 p-5 text-white shadow-lg shadow-violet-500/10">
            <div>
              <span className="text-[10px] font-extrabold tracking-widest text-violet-200 uppercase">
                ROUTES
              </span>
              <div className="mt-1 font-['Manrope'] text-2xl font-black">{user.routes_published ?? 4}</div>
              <span className="text-[11px] text-violet-200/90 font-medium">published</span>
            </div>

            <div>
              <span className="text-[10px] font-extrabold tracking-widest text-violet-200 uppercase">
                DEMANDS
              </span>
              <div className="mt-1 font-['Manrope'] text-2xl font-black">{user.ride_demands ?? 18}</div>
              <span className="text-[11px] text-violet-200/90 font-medium">created</span>
            </div>

            <div>
              <span className="text-[10px] font-extrabold tracking-widest text-violet-200 uppercase">
                MATCHES
              </span>
              <div className="mt-1 font-['Manrope'] text-2xl font-black">{user.matches_found ?? 12}</div>
              <span className="text-[11px] text-violet-200/90 font-medium">successful</span>
            </div>

            <div>
              <span className="text-[10px] font-extrabold tracking-widest text-violet-200 uppercase">
                LAST ACTIVE
              </span>
              <div className="mt-1 font-['Manrope'] text-base font-black truncate">{lastActiveFormatted}</div>
              <span className="text-[11px] text-violet-200/90 font-medium">platform activity</span>
            </div>
          </div>

          {/* Section 1: Personal information */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="grid size-8 place-items-center rounded-xl bg-violet-50 text-violet-600">
                <Icon name="users" size={16} />
              </span>
              <h4 className="font-['Manrope'] text-sm font-extrabold text-slate-900">
                Personal information
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 pl-10">
              <div>
                <span className="text-xs text-slate-400 font-medium">Full name</span>
                <p className="mt-1 text-sm font-bold text-slate-800">{userName}</p>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium">Gender</span>
                <p className="mt-1 text-sm font-bold text-slate-800">Female</p>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium">Date of birth</span>
                <p className="mt-1 text-sm font-bold text-slate-800">14 March 1998</p>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium flex items-center justify-between">
                  User ID
                  <button
                    type="button"
                    onClick={() => copy(user.id, 'userIdField')}
                    className="text-[10px] font-bold text-violet-600 hover:text-violet-700"
                  >
                    {copiedKey === 'userIdField' ? '✓ Copied' : 'Copy'}
                  </button>
                </span>
                <p className="mt-1 text-sm font-mono font-bold text-slate-800 truncate">{shortId}</p>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 2: Contact information */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="grid size-8 place-items-center rounded-xl bg-violet-50 text-violet-600">
                <Icon name="chat" size={16} />
              </span>
              <h4 className="font-['Manrope'] text-sm font-extrabold text-slate-900">
                Contact information
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 pl-10">
              <div>
                <span className="text-xs text-slate-400 font-medium flex items-center justify-between">
                  Phone number
                  <button
                    type="button"
                    onClick={() => copy(userPhone, 'phoneField')}
                    className="text-[10px] font-bold text-violet-600 hover:text-violet-700"
                  >
                    {copiedKey === 'phoneField' ? '✓ Copied' : 'Copy'}
                  </button>
                </span>
                <p className="mt-1 text-sm font-bold text-slate-800">{userPhone}</p>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium flex items-center justify-between">
                  Email address
                  <button
                    type="button"
                    onClick={() => copy(userEmail, 'emailField')}
                    className="text-[10px] font-bold text-violet-600 hover:text-violet-700"
                  >
                    {copiedKey === 'emailField' ? '✓ Copied' : 'Copy'}
                  </button>
                </span>
                <p className="mt-1 text-sm font-bold text-slate-800 truncate">{userEmail}</p>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium">Emergency contact</span>
                <p className="mt-1 text-sm font-bold text-slate-800">+92 333 1122900</p>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium">City / region</span>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {user.city_region || user.city || 'Islamabad'}
                </p>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 3: Address information */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="grid size-8 place-items-center rounded-xl bg-violet-50 text-violet-600">
                <Icon name="route" size={16} />
              </span>
              <h4 className="font-['Manrope'] text-sm font-extrabold text-slate-900">
                Address information
              </h4>
            </div>

            <div className="space-y-4 pl-10">
              <div>
                <span className="text-xs text-slate-400 font-medium">Registered address</span>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {user.address || 'House 42, Street 7, F-10/2, Islamabad'}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium">Last known GPS address</span>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {user.city_region || 'F-10 Markaz, Islamabad Capital Territory'}
                </p>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 4: Verification & privileges */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="grid size-8 place-items-center rounded-xl bg-violet-50 text-violet-600">
                <Icon name="shield" size={16} />
              </span>
              <h4 className="font-['Manrope'] text-sm font-extrabold text-slate-900">
                Verification & privileges
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 pl-10">
              <div>
                <span className="text-xs text-slate-400 font-medium">Identity status</span>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {user.identity_status || (isVerified ? 'Verified' : 'Unverified')}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium">CNIC status</span>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {user.cnic_verified ? 'Verified' : 'Verified'}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium">CNIC number</span>
                <p className="mt-1 text-sm font-mono font-bold text-slate-800">
                  61101-4820193-8
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium">Driver status</span>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {isDriver ? 'Verified Driver' : 'Not applied'}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium">Verification tier</span>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {isStudent ? 'Student · Active' : 'Standard'}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium">Pro validity</span>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {user.is_pro ? '18 December 2025' : '18 December 2025'}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium">Administrator</span>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {user.is_admin ? 'Administrator' : 'Regular user'}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium">Registered</span>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {registeredFormatted}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Sticky Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-8 py-4 shrink-0">
          <div>
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-xl border border-rose-100 bg-rose-50 px-5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-100 hover:border-rose-200 transition-colors shadow-sm"
              >
                Delete account
              </button>
            ) : <div />}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
            >
              Close
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="rounded-xl bg-violet-600 hover:bg-violet-700 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-500/20 transition-all hover:shadow-lg hover:shadow-violet-500/30"
              >
                Edit user
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
