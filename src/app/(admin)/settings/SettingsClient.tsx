'use client'

import { useState } from 'react'
import { Button, Header, Icon, type IconName } from '@/components/ui/FigmaUI'

export default function SettingsClient() {
  const [section, setSection] = useState('Matching & rides')
  const [saving, setSaving] = useState(false)
  const [savedToast, setSavedToast] = useState(false)

  // Matching settings state
  const [proximityRadius, setProximityRadius] = useState(2.5)
  const [detourTolerance, setDetourTolerance] = useState(12)
  const [seatsCap, setSeatsCap] = useState('4')
  const [gracePeriod, setGracePeriod] = useState('30m')

  // Fare & Economy state
  const [baseFare, setBaseFare] = useState('150')
  const [perKmRate, setPerKmRate] = useState('25')
  const [studentDiscount, setStudentDiscount] = useState('30')
  const [enableDynamicPricing, setEnableDynamicPricing] = useState(true)

  // Verification Rules state
  const [requireCnicFrontBack, setRequireCnicFrontBack] = useState(true)
  const [requireLiveSelfie, setRequireLiveSelfie] = useState(true)
  const [studentValidityMonths, setStudentValidityMonths] = useState('6')
  const [autoRejectExpiry, setAutoRejectExpiry] = useState(true)

  // Notifications state
  const [pushMatchAlerts, setPushMatchAlerts] = useState(true)
  const [smsFallbacks, setSmsFallbacks] = useState(false)
  const [emailSummaries, setEmailSummaries] = useState(true)

  // Security state
  const [enforceTwoFactorAdmin, setEnforceTwoFactorAdmin] = useState(true)
  const [rateLimitRequests, setRateLimitRequests] = useState(true)
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState('24')

  // Feature flags
  const [enableCarpoolChat, setEnableCarpoolChat] = useState(true)
  const [enableScheduledRides, setEnableScheduledRides] = useState(true)
  const [enableLiveGpsTracking, setEnableLiveGpsTracking] = useState(true)
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  const sections: [string, IconName, string][] = [
    ['Matching & rides', 'route', 'mint'],
    ['Fare & economy', 'trend', 'amber'],
    ['Verification rules', 'check', 'lavender'],
    ['Notifications & gateways', 'bell', 'sky'],
    ['Security & access', 'shield', 'lavender'],
    ['Feature flags', 'settings', 'amber'],
    ['Admin team', 'users', 'sky']
  ]

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSavedToast(true)
      setTimeout(() => setSavedToast(false), 3000)
    }, 600)
  }

  const activeSectionMeta = sections.find(([s]) => s === section)

  return (
    <>
      <Header 
        title="Platform settings" 
        description="Configure MYWAY's operational parameters, dispatch algorithms, security rules, and feature flags."
        actions={
          <Button onClick={handleSave} disabled={saving}>
            <Icon name="check" /> {saving ? 'Saving...' : 'Save changes'}
          </Button>
        }
      />

      {savedToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#0f172a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 10000,
          fontWeight: 600,
          fontSize: '14px'
        }}>
          <Icon name="check" size={18} /> Platform configuration saved successfully
        </div>
      )}

      <div className="settings-layout">
        {/* Navigation */}
        <aside className="settings-nav">
          {sections.map(([s, icon]) => (
            <button 
              className={section === s ? 'active' : ''} 
              key={s} 
              onClick={() => setSection(s)}
            >
              <Icon name={icon} />
              {s}
              <Icon name="chevron" />
            </button>
          ))}
        </aside>

        {/* Panel Content */}
        <section className="panel settings-panel">
          <div className="settings-title">
            <span className={`stat-icon ${activeSectionMeta?.[2] || 'lavender'}`}>
              <Icon name={activeSectionMeta?.[1] || 'settings'} />
            </span>
            <div>
              <h2>{section}</h2>
              <p>Manage operational preferences and rules for {section.toLowerCase()}.</p>
            </div>
          </div>

          {/* Section 1: Matching & Rides */}
          {section === 'Matching & rides' && (
            <>
              <div className="setting-range">
                <div>
                  <b>Matching proximity radius</b>
                  <p>Maximum pickup radius used by the backend spatial indexing algorithm to find co-riders.</p>
                </div>
                <div className="range-value">
                  <span>1.0 km</span>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    step="0.5"
                    value={proximityRadius}
                    onChange={(e) => setProximityRadius(parseFloat(e.target.value))}
                  />
                  <span>10.0 km</span>
                  <strong>{proximityRadius.toFixed(1)} km</strong>
                </div>
              </div>

              <div className="setting-range">
                <div>
                  <b>Route detour tolerance</b>
                  <p>Maximum acceptable delay in minutes added to a driver commute during shared passenger dropoff.</p>
                </div>
                <div className="range-value">
                  <span>5 min</span>
                  <input 
                    type="range" 
                    min="5" 
                    max="30" 
                    step="1"
                    value={detourTolerance}
                    onChange={(e) => setDetourTolerance(parseInt(e.target.value, 10))}
                  />
                  <span>30 min</span>
                  <strong>{detourTolerance} min</strong>
                </div>
              </div>

              <div className="setting-row">
                <div>
                  <b>Maximum seats per carpool</b>
                  <p>Platform cap for passenger seats offered on a single standard vehicle ride.</p>
                </div>
                <select value={seatsCap} onChange={(e) => setSeatsCap(e.target.value)}>
                  <option value="3">3 passengers</option>
                  <option value="4">4 passengers (Standard)</option>
                  <option value="5">5 passengers</option>
                  <option value="6">6 passengers (MPV)</option>
                </select>
              </div>

              <div className="setting-row">
                <div>
                  <b>Auto-cancellation penalty-free window</b>
                  <p>Threshold before scheduled departure time when riders can cancel without rating impact.</p>
                </div>
                <select value={gracePeriod} onChange={(e) => setGracePeriod(e.target.value)}>
                  <option value="15m">15 minutes</option>
                  <option value="30m">30 minutes</option>
                  <option value="1h">1 hour</option>
                  <option value="2h">2 hours</option>
                </select>
              </div>
            </>
          )}

          {/* Section 2: Fare & Economy */}
          {section === 'Fare & economy' && (
            <>
              <div className="setting-row">
                <div>
                  <b>Base Fare (PKR)</b>
                  <p>Minimum unlock fee per passenger seat request.</p>
                </div>
                <input 
                  type="number" 
                  value={baseFare} 
                  onChange={(e) => setBaseFare(e.target.value)}
                  style={{ width: '120px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}
                />
              </div>

              <div className="setting-row">
                <div>
                  <b>Per-Kilometer Rate (PKR / km)</b>
                  <p>Cost formula calculated along mapped OSRM route distance.</p>
                </div>
                <input 
                  type="number" 
                  value={perKmRate} 
                  onChange={(e) => setPerKmRate(e.target.value)}
                  style={{ width: '120px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}
                />
              </div>

              <div className="setting-row">
                <div>
                  <b>Student Discount Percentage</b>
                  <p>Subsidized discount deducted for verified university students.</p>
                </div>
                <select value={studentDiscount} onChange={(e) => setStudentDiscount(e.target.value)}>
                  <option value="20">20% discount</option>
                  <option value="25">25% discount</option>
                  <option value="30">30% discount (Current default)</option>
                  <option value="40">40% discount</option>
                </select>
              </div>

              <div className="setting-row">
                <div>
                  <b>Enable Peak Dynamic Pricing</b>
                  <p>Automatically adjust recommended fares during 8-10 AM and 5-7 PM rush hour windows.</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={enableDynamicPricing} 
                    onChange={(e) => setEnableDynamicPricing(e.target.checked)} 
                  />
                  <span />
                </label>
              </div>
            </>
          )}

          {/* Section 3: Verification Rules */}
          {section === 'Verification rules' && (
            <>
              <div className="setting-row">
                <div>
                  <b>Require Front & Back CNIC Scans</b>
                  <p>Mandatory dual-sided government identity document for driver account onboarding.</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={requireCnicFrontBack} 
                    onChange={(e) => setRequireCnicFrontBack(e.target.checked)} 
                  />
                  <span />
                </label>
              </div>

              <div className="setting-row">
                <div>
                  <b>Require Live Selfie Verification</b>
                  <p>Ensure selfie matches identity photo to prevent fraudulent driver impersonation.</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={requireLiveSelfie} 
                    onChange={(e) => setRequireLiveSelfie(e.target.checked)} 
                  />
                  <span />
                </label>
              </div>

              <div className="setting-row">
                <div>
                  <b>Student Verification Term</b>
                  <p>Standard validity span granted upon approving university student ID card.</p>
                </div>
                <select value={studentValidityMonths} onChange={(e) => setStudentValidityMonths(e.target.value)}>
                  <option value="3">3 Months (Quarterly)</option>
                  <option value="6">6 Months (1 Semester)</option>
                  <option value="12">12 Months (1 Academic Year)</option>
                </select>
              </div>

              <div className="setting-row">
                <div>
                  <b>Auto-revoke on Expiry</b>
                  <p>Automatically revert user status to standard passenger when student term ends.</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={autoRejectExpiry} 
                    onChange={(e) => setAutoRejectExpiry(e.target.checked)} 
                  />
                  <span />
                </label>
              </div>
            </>
          )}

          {/* Section 4: Notifications & Gateways */}
          {section === 'Notifications & gateways' && (
            <>
              <div className="setting-row">
                <div>
                  <b>Push Notifications (Expo / FCM)</b>
                  <p>Instant mobile notifications for match requests, driver approvals, and route updates.</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={pushMatchAlerts} 
                    onChange={(e) => setPushMatchAlerts(e.target.checked)} 
                  />
                  <span />
                </label>
              </div>

              <div className="setting-row">
                <div>
                  <b>SMS Gateway Fallback (Twilio)</b>
                  <p>Dispatch SMS OTPs and urgent ride reminders if push token is unavailable.</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={smsFallbacks} 
                    onChange={(e) => setSmsFallbacks(e.target.checked)} 
                  />
                  <span />
                </label>
              </div>

              <div className="setting-row">
                <div>
                  <b>Weekly Admin Digest Emails</b>
                  <p>Send weekly summary reports of fleet growth, verifications, and platform metrics to admins.</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={emailSummaries} 
                    onChange={(e) => setEmailSummaries(e.target.checked)} 
                  />
                  <span />
                </label>
              </div>
            </>
          )}

          {/* Section 5: Security & Access */}
          {section === 'Security & access' && (
            <>
              <div className="setting-row">
                <div>
                  <b>Enforce Two-Factor Authentication for Admins</b>
                  <p>Require OTP confirmation on every staff login attempt to the web portal.</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={enforceTwoFactorAdmin} 
                    onChange={(e) => setEnforceTwoFactorAdmin(e.target.checked)} 
                  />
                  <span />
                </label>
              </div>

              <div className="setting-row">
                <div>
                  <b>API Rate Limiting</b>
                  <p>Protect Supabase edge functions and database endpoints against brute-force calls.</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={rateLimitRequests} 
                    onChange={(e) => setRateLimitRequests(e.target.checked)} 
                  />
                  <span />
                </label>
              </div>

              <div className="setting-row">
                <div>
                  <b>Admin Session Expiration</b>
                  <p>Automatic logout timeout duration for inactive admin dashboard sessions.</p>
                </div>
                <select value={sessionTimeoutHours} onChange={(e) => setSessionTimeoutHours(e.target.value)}>
                  <option value="8">8 Hours</option>
                  <option value="24">24 Hours (Standard)</option>
                  <option value="72">72 Hours</option>
                </select>
              </div>
            </>
          )}

          {/* Section 6: Feature Flags */}
          {section === 'Feature flags' && (
            <>
              <div className="setting-row">
                <div>
                  <b>In-App Realtime Carpool Chat</b>
                  <p>Enable rider-to-driver in-app direct messaging once a match is accepted.</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={enableCarpoolChat} 
                    onChange={(e) => setEnableCarpoolChat(e.target.checked)} 
                  />
                  <span />
                </label>
              </div>

              <div className="setting-row">
                <div>
                  <b>Recurring & Scheduled Commutes</b>
                  <p>Allow users to publish recurring Monday-Friday recurring commute routines.</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={enableScheduledRides} 
                    onChange={(e) => setEnableScheduledRides(e.target.checked)} 
                  />
                  <span />
                </label>
              </div>

              <div className="setting-row">
                <div>
                  <b>Live GPS Turn-by-Turn Tracking</b>
                  <p>Stream real-time driver coordinates to matched passengers during ride pickup.</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={enableLiveGpsTracking} 
                    onChange={(e) => setEnableLiveGpsTracking(e.target.checked)} 
                  />
                  <span />
                </label>
              </div>

              <div className="setting-row">
                <div>
                  <b>Platform Maintenance Mode</b>
                  <p>Temporarily pause new ride booking requests for scheduled database upgrades.</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={maintenanceMode} 
                    onChange={(e) => setMaintenanceMode(e.target.checked)} 
                  />
                  <span />
                </label>
              </div>
            </>
          )}

          {/* Section 7: Admin Team */}
          {section === 'Admin team' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Active Portal Administrators</h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748b' }}>Staff with super-admin privilege over verifications, users, and broadcast tools.</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                      HA
                    </div>
                    <div>
                      <strong style={{ fontSize: '14px', color: '#0f172a' }}>Hamza Ahmed (Current Admin)</strong>
                      <small style={{ display: 'block', color: '#64748b' }}>Super Administrator · Full Access</small>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '4px 10px', borderRadius: '20px' }}>Active Session</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                      OP
                    </div>
                    <div>
                      <strong style={{ fontSize: '14px', color: '#0f172a' }}>MYWAY Operations Lead</strong>
                      <small style={{ display: 'block', color: '#64748b' }}>Verification & Support Desk Lead</small>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Staff Role</span>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
