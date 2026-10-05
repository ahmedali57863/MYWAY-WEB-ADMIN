'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon, type IconName } from '@/components/ui/FigmaUI'
import { LogoutButton } from './LogoutButton'

const navGroups: {
  label: string
  items: [string, IconName, string, string?][]
}[] = [
  {
    label: 'WORKSPACE',
    items: [
      ['Overview', 'grid', '/'],
      ['Users', 'users', '/users'],
      ['Drivers', 'car', '/drivers'],
      ['Pending approvals', 'check', '/pending-approvals'],
      ['Student verification', 'student', '/student-verifications'],
      ['Support inbox', 'chat', '/support'],
      ['Broadcast', 'send', '/broadcast'],
    ],
  },
  {
    label: 'DATA COLLECTIONS',
    items: [
      ['Routes', 'route', '/collections/routes'],
      ['Vehicles', 'car', '/collections/vehicles'],
      ['Ride demand', 'demand', '/collections/ride_demand'],
      ['Matches', 'match', '/collections/matches'],
      ['Notifications', 'bell', '/collections/notifications'],
    ],
  },
]

export default function Sidebar({
  userEmail,
  isOpen,
  onClose,
}: {
  userEmail?: string
  isOpen?: boolean
  onClose?: () => void
}) {
  const pathname = usePathname()

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="brand">
        <span className="brand-mark">
          <Icon name="route" size={22} />
        </span>
        <span>
          <b>MYWAY</b>
          <small>ADMIN PORTAL</small>
        </span>
        {onClose && (
          <button className="mobile-close" onClick={onClose} aria-label="Close menu">
            <Icon name="close" size={18} />
          </button>
        )}
      </div>

      {/* Nav Groups */}
      <nav>
        {navGroups.map((group) => (
          <div className="nav-group" key={group.label}>
            <p>{group.label}</p>
            {group.items.map(([label, icon, href]) => {
              const isActive =
                href === '/'
                  ? pathname === '/'
                  : pathname === href || pathname.startsWith(href + '/')

              return (
                <Link
                  key={href}
                  href={href}
                  prefetch={true}
                  className={isActive ? 'active' : ''}
                  onClick={onClose}
                >
                  <Icon name={icon} size={18} />
                  <span>{label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-bottom">
        <Link
          href="/settings"
          prefetch={true}
          className={pathname.startsWith('/settings') ? 'active' : ''}
          onClick={onClose}
        >
          <Icon name="settings" size={18} />
          <span>Platform settings</span>
        </Link>

        <div className="admin-card">
          <div className="avatar-initial">
            {userEmail ? userEmail.slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <span>
            <b>{userEmail || 'Administrator'}</b>
            <small>
              <i /> Super admin
            </small>
          </span>
          <LogoutButton />
        </div>
      </div>
    </aside>
  )
}
