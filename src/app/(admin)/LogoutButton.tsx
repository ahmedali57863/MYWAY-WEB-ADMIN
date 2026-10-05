'use client'

import { useRouter } from 'next/navigation'
import { logoutAdmin } from '../login/actions'

export function LogoutButton() {
  async function handleLogout() {
    await logoutAdmin()
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-rose-600/90 text-slate-300 hover:text-white px-3.5 py-2.5 text-xs font-semibold border border-slate-700 hover:border-rose-500 transition-all duration-200 shadow-sm"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      <span>Sign Out</span>
    </button>
  )
}
