'use client'

import { useState, useRef, useEffect, Suspense } from 'react'


import { useRouter, useSearchParams } from 'next/navigation'
import {
  login,
  requestPasswordReset,
  updateAdminPassword,
  instantAdminPasswordReset,
} from './actions'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialMode = searchParams.get('mode') === 'update-password' ? 'update' : 'login'

  const [mode, setMode] = useState<'login' | 'forgot' | 'update' | 'success'>(initialMode)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  // Recovery data state
  const [resetEmail, setResetEmail] = useState('')
  const [directLink, setDirectLink] = useState<string | null>(null)

  // 3D Tilt interaction state
  const cardRef = useRef<HTMLDivElement>(null)
  const [cardTransform, setCardTransform] = useState({ rx: 0, ry: 0, mx: 50, my: 50 })

  // Handle subtle 3D card tilt & glare following mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      // Subtle tilt constraints (-6 to +6 deg)
      const rotateX = Math.max(Math.min(((y - centerY) / centerY) * -6, 6), -6)
      const rotateY = Math.max(Math.min(((x - centerX) / centerX) * 6, 6), -6)

      const mousePercentX = Math.round((x / rect.width) * 100)
      const mousePercentY = Math.round((y / rect.height) * 100)

      setCardTransform({
        rx: rotateX,
        ry: rotateY,
        mx: mousePercentX,
        my: mousePercentY,
      })
    }

    const handleMouseLeave = () => {
      setCardTransform({ rx: 0, ry: 0, mx: 50, my: 50 })
    }

    const cardEl = cardRef.current
    if (cardEl) {
      cardEl.addEventListener('mousemove', handleMouseMove)
      cardEl.addEventListener('mouseleave', handleMouseLeave)
    }

    return () => {
      if (cardEl) {
        cardEl.removeEventListener('mousemove', handleMouseMove)
        cardEl.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [])

  // 1. Standard Login Submission
  async function handleLoginSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    try {
      const res = await login(formData)
      if (res?.error) {
        setError(res.error)
      } else if (res?.success) {
        document.cookie = "hardcoded_admin=true; path=/; max-age=604800";
        window.location.href = '/'
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`Unexpected error: ${err.message}`)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  // 2. Request Forgot Password
  async function handleForgotSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = (formData.get('forgotEmail') as string)?.trim()
    setResetEmail(email)

    try {
      const res = await requestPasswordReset(email, window.location.origin)
      if (res?.error) {
        setError(res.error)
      } else if (res?.success) {
        setDirectLink(res.recoveryLink || null)
        setSuccessMsg('Admin verification verified. You can reset your password below.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error sending reset request'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // 3. Set New Password directly
  async function handleUpdatePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const newPass = formData.get('newPassword') as string
    const confirmPass = formData.get('confirmPassword') as string

    if (newPass !== confirmPass) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    try {
      let res
      if (resetEmail) {
        res = await instantAdminPasswordReset(resetEmail, newPass)
      } else {
        res = await updateAdminPassword(newPass)
      }

      if (res?.error) {
        setError(res.error)
      } else {
        setMode('success')
        const msg = res && 'message' in res && typeof res.message === 'string' 
          ? res.message 
          : 'Your password has been successfully updated!'
        setSuccessMsg(msg)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-slate-950 font-sans selection:bg-cyan-500 selection:text-white overflow-hidden perspective-[1200px]">
      
      {/* Background Graphic Wallpaper */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-100 pointer-events-none"
        style={{ backgroundImage: "url('/login-bg.jpg')" }}
      >
        {/* Cinematic atmospheric overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/75 pointer-events-none" />
        <div className="absolute inset-0 backdrop-brightness-95 pointer-events-none" />
      </div>

      {/* Floating Animated Bioluminescent Ambient Lights */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        <div className="absolute top-1/4 left-1/5 w-72 h-72 rounded-full bg-cyan-400/15 blur-[90px] animate-float-orb" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-indigo-500/15 blur-[100px] animate-float-orb-delayed" />
        
        {/* Subtle rising fireflies/sparkles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-cyan-300/60 blur-[1px] pointer-events-none"
            style={{
              width: `${(i % 3) * 2 + 3}px`,
              height: `${(i % 3) * 2 + 3}px`,
              left: `${15 + i * 14}%`,
              animation: `particleFloat ${9 + i * 2}s infinite linear ${i * 1.8}s`,
            }}
          />
        ))}
      </div>

      {/* Minimalist Top Header (Brand Only: MYWAY) */}
      <header className="relative z-20 w-full px-8 md:px-16 py-7 flex items-center justify-between">
        <div className="flex items-center gap-3.5 group cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/25 flex items-center justify-center text-white shadow-xl group-hover:scale-105 group-hover:border-cyan-400/50 transition-all duration-300">
            <svg className="w-6 h-6 text-cyan-300 transition-transform group-hover:rotate-12 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-widest text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] flex items-center gap-1">
              MYWAY
              <span className="text-cyan-400 text-sm font-semibold tracking-normal px-2 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/30 ml-2">
                ADMIN
              </span>
            </h1>
          </div>
        </div>
      </header>

      {/* Main Glassmorphism Interactive Container */}
      <main className="relative z-20 flex-1 flex items-center justify-center p-4">
        <div
          ref={cardRef}
          style={{
            transform: `perspective(1000px) rotateX(${cardTransform.rx}deg) rotateY(${cardTransform.ry}deg)`,
            transition: 'transform 0.15s ease-out',
          }}
          className="relative w-full max-w-[430px] rounded-3xl backdrop-blur-2xl bg-white/25 border border-white/40 shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden p-8 sm:p-10 transition-all duration-300 hover:border-white/70 group"
        >
          
          {/* Interactive Mouse Glare Refraction */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-40 transition-opacity duration-300 group-hover:opacity-75"
            style={{
              background: `radial-gradient(circle at ${cardTransform.mx}% ${cardTransform.my}%, rgba(255,255,255,0.45) 0%, transparent 60%)`,
            }}
          />

          {/* Close Window Badge Button */}
          <button 
            type="button"
            onClick={() => {
              setError(null)
              if (mode !== 'login') setMode('login')
            }}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white/80 hover:text-white flex items-center justify-center text-xs font-bold transition-all shadow-md active:scale-90"
            aria-label="Close"
          >
            ✕
          </button>

          {/* ===================== VIEW 1: LOGIN MODE ===================== */}
          {mode === 'login' && (
            <div className="space-y-6">
              {/* Form Header */}
              <div className="text-center mb-7">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  Login
                </h2>
                <p className="text-xs font-semibold text-slate-700/90 mt-1 uppercase tracking-wider">
                  Secure Admin Authentication
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-6">
                
                {/* Email Field */}
                <div className="space-y-1">
                  <label htmlFor="email" className="block text-xs font-bold text-slate-900 tracking-wide">
                    Email
                  </label>
                  <div className="relative flex items-center border-b-2 border-slate-700/80 focus-within:border-slate-950 transition-colors pb-1">
                    <input
                      id="email"
                      name="email"
                      type="text"
                      autoComplete="username"
                      required
                      placeholder="admin"
                      className="w-full bg-transparent text-slate-950 placeholder:text-slate-600/70 font-semibold text-sm focus:outline-none pr-8 py-1.5"
                    />
                    <div className="absolute right-1 text-slate-800 pointer-events-none">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <label htmlFor="password" className="block text-xs font-bold text-slate-900 tracking-wide">
                    Password
                  </label>
                  <div className="relative flex items-center border-b-2 border-slate-700/80 focus-within:border-slate-950 transition-colors pb-1">
                    <input
                      id="password"
                      name="password"
                      type="text"
                      autoComplete="off"
                      required
                      placeholder="admin123"
                      className="w-full bg-transparent text-slate-950 placeholder:text-slate-600/70 font-semibold text-sm focus:outline-none pr-8 py-1.5"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 text-slate-800 hover:text-slate-950 transition-colors p-0.5"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-xs font-semibold text-slate-900 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-slate-900 focus:ring-slate-950 accent-slate-900 cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setError(null)
                      setSuccessMsg(null)
                      setMode('forgot')
                    }}
                    className="hover:underline hover:text-slate-950 transition-all text-slate-900 font-bold"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="rounded-xl bg-rose-500/20 border border-rose-500/30 p-3 text-xs font-bold text-rose-900 text-center flex items-center justify-center gap-2 backdrop-blur-md animate-shake">
                    <svg className="w-4 h-4 text-rose-700 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Action Button with Shimmer */}
                <button
                  type="submit"
                  disabled={loading}
                  className="relative overflow-hidden w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-950 active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:pointer-events-none group"
                >
                  <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 animate-shimmer pointer-events-none" />
                  
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Login</span>
                      <svg className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ===================== VIEW 2: FORGOT PASSWORD ===================== */}
          {mode === 'forgot' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-900/10 flex items-center justify-center text-slate-900 mb-3 border border-slate-900/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Reset Password
                </h2>
                <p className="text-xs text-slate-700 mt-1">
                  Enter your registered administrator email to verify identity and reset your password.
                </p>
              </div>

              {!directLink ? (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label htmlFor="forgotEmail" className="block text-xs font-bold text-slate-900 tracking-wide">
                      Admin Email Address
                    </label>
                    <div className="relative flex items-center border-b-2 border-slate-700/80 focus-within:border-slate-950 transition-colors pb-1">
                      <input
                        id="forgotEmail"
                        name="forgotEmail"
                        type="email"
                        required
                        placeholder="admin@myway.com"
                        className="w-full bg-transparent text-slate-950 placeholder:text-slate-600/70 font-semibold text-sm focus:outline-none pr-8 py-1.5"
                      />
                      <div className="absolute right-1 text-slate-800 pointer-events-none">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-xl bg-rose-500/20 border border-rose-500/30 p-3 text-xs font-bold text-rose-900 text-center animate-shake">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-950 text-white font-bold text-sm rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-75"
                  >
                    {loading ? 'Verifying Admin...' : 'Send Recovery Instructions'}
                  </button>
                </form>
              ) : (
                /* Instant Recovery Step Once Verified */
                <form onSubmit={handleUpdatePasswordSubmit} className="space-y-4 pt-1">
                  {successMsg && (
                    <div className="rounded-xl bg-emerald-500/20 border border-emerald-500/40 p-3 text-xs font-bold text-emerald-950 text-center">
                      {successMsg}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-900">New Password</label>
                    <div className="relative flex items-center border-b-2 border-slate-700/80 focus-within:border-slate-950 transition-colors pb-1">
                      <input
                        name="newPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="Min 6 characters"
                        className="w-full bg-transparent text-slate-950 placeholder:text-slate-600/70 font-semibold text-sm focus:outline-none pr-8 py-1.5"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-1 text-slate-800 hover:text-slate-950"
                      >
                        {showConfirmPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-900">Confirm New Password</label>
                    <div className="relative flex items-center border-b-2 border-slate-700/80 focus-within:border-slate-950 transition-colors pb-1">
                      <input
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="Re-enter password"
                        className="w-full bg-transparent text-slate-950 placeholder:text-slate-600/70 font-semibold text-sm focus:outline-none pr-8 py-1.5"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-xl bg-rose-500/20 border border-rose-500/30 p-3 text-xs font-bold text-rose-900 text-center animate-shake">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? 'Updating Password...' : 'Save & Update Password'}
                  </button>
                </form>
              )}

              {/* Back to Login Button */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError(null)
                    setSuccessMsg(null)
                    setDirectLink(null)
                    setMode('login')
                  }}
                  className="text-xs font-bold text-slate-900 hover:underline flex items-center justify-center gap-1.5 mx-auto"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Return to Login</span>
                </button>
              </div>
            </div>
          )}

          {/* ===================== VIEW 3: SUCCESS CONFIRMATION ===================== */}
          {mode === 'success' && (
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-800 flex items-center justify-center mx-auto shadow-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">Password Reset!</h3>
                <p className="text-xs font-medium text-slate-700 mt-2">
                  {successMsg || 'Your administrator credentials have been securely updated.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setSuccessMsg(null)
                  setDirectLink(null)
                  setMode('login')
                }}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-950 text-white font-bold text-sm rounded-xl shadow-xl transition-all"
              >
                Proceed to Login
              </button>
            </div>
          )}

        </div>
      </main>

      {/* Subtle Bottom Footer */}
      <footer className="relative z-20 py-5 text-center text-xs font-medium text-white/70 drop-shadow-md">
        &copy; {new Date().getFullYear()} <span className="font-bold text-white tracking-wider">MYWAY</span> Carpooling Portal. All rights reserved.
      </footer>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
