'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import { Icon } from '@/components/ui/FigmaUI'
import GlobalImageLightbox from '@/components/ui/GlobalImageLightbox'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Overview',
  '/users': 'Users',
  '/pending-approvals': 'Pending approvals',
  '/student-verifications': 'Student verification',
  '/support': 'Support inbox',
  '/broadcast': 'Broadcast',
  '/collections/routes': 'Routes',
  '/collections/vehicles': 'Vehicles',
  '/collections/ride_demand': 'Ride demand',
  '/collections/matches': 'Matches',
  '/collections/notifications': 'Notifications',
  '/settings': 'Platform settings',
}

export default function AdminShell({
  children,
  userEmail,
}: {
  children: React.ReactNode
  userEmail?: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Title resolution
  const currentTitle = PAGE_TITLES[pathname] || 'Control Center'

  // Cmd + K / Ctrl + K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setCommandOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const navigateTo = (path: string) => {
    router.push(path)
    setSidebarOpen(false)
    setCommandOpen(false)
  }

  const quickNav = [
    { id: '/users', label: 'Users', description: 'Find an account by name or phone', icon: 'users' as const },
    { id: '/pending-approvals', label: 'Pending approvals', description: 'Review identity & driver requests', icon: 'check' as const },
    { id: '/collections/vehicles', label: 'Vehicles', description: 'Search by license plate or driver', icon: 'car' as const },
    { id: '/support', label: 'Support inbox', description: 'Open customer chat tickets', icon: 'chat' as const },
    { id: '/collections/routes', label: 'Routes', description: 'Explore published driver & rider routes', icon: 'route' as const },
    { id: '/broadcast', label: 'Broadcast', description: 'Send mass push notifications', icon: 'send' as const },
  ]

  const filteredQuickNav = quickNav.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <Sidebar
        userEmail={userEmail}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Area */}
      <div className="admin-main-wrapper">
        {/* Topbar */}
        <header className="topbar">
          <button
            type="button"
            className="menu-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
          >
            <Icon name="menu" size={18} />
          </button>

          <div className="crumb">
            <span>Admin</span>
            <Icon name="chevron" size={14} />
            <b>{currentTitle}</b>
          </div>

          <button
            type="button"
            className="global-search"
            onClick={() => setCommandOpen(true)}
          >
            <Icon name="search" size={14} />
            <span>Search anything...</span>
            <kbd>
              <Icon name="command" size={12} /> K
            </kbd>
          </button>

          <button
            type="button"
            className="top-icon"
            onClick={() => router.push('/collections/notifications')}
            aria-label="Notifications"
          >
            <Icon name="bell" size={18} />
            <i />
          </button>
        </header>

        {/* Page Content */}
        <main className="page-content">{children}</main>
      </div>

      {/* Quick Command Palette Modal (Ctrl + K) */}
      {commandOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setCommandOpen(false)}
        >
          <div
            className="command-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <label>
              <Icon name="search" size={18} />
              <input
                autoFocus
                placeholder="Search users, routes, plates or IDs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="button" onClick={() => setCommandOpen(false)}>
                ESC
              </button>
            </label>

            <p>QUICK NAVIGATION</p>

            {filteredQuickNav.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => navigateTo(item.id)}
              >
                <span className="record-icon">
                  <Icon name={item.icon} size={18} />
                </span>
                <span>
                  <b>{item.label}</b>
                  <small>{item.description}</small>
                </span>
                <Icon name="arrow" size={16} />
              </button>
            ))}

            {filteredQuickNav.length === 0 && (
              <div className="p-4 text-center text-xs text-gray-400">
                No matching sections found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Universal Image Lightbox Expander */}
      <GlobalImageLightbox />
    </div>
  )
}
