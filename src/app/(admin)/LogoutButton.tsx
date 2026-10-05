'use client'

import { logoutAdmin } from '../login/actions'
import { Icon } from '@/components/ui/FigmaUI'

export function LogoutButton() {
  async function handleLogout() {
    if (confirm('Are you sure you want to log out of the admin panel?')) {
      await logoutAdmin()
    }
  }

  return (
    <button
      onClick={handleLogout}
      aria-label="Log out"
      title="Sign Out"
      className="text-gray-400 hover:text-rose-400 p-1 rounded transition-colors"
    >
      <Icon name="logout" size={16} />
    </button>
  )
}
