'use client'

import { useState } from 'react'
import { broadcastNotification } from './actions'
import { Header, Button, Icon, Badge } from '@/components/ui/FigmaUI'

type BroadcastSummary = {
  attempted: number
  succeeded: number
  failed: number
  staleRemoved: number
  optedOut: number
  totalRegistered: number
}

export default function BroadcastClient() {
  const [heading, setHeading] = useState('')
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState('all')
  const [sending, setSending] = useState(false)
  const [summary, setSummary] = useState<BroadcastSummary | null>(null)

  const handleSend = async () => {
    if (!heading.trim() || !message.trim()) {
      alert('Please provide both a notification title and message body.')
      return
    }

    if (!confirm('Are you sure you want to broadcast this push notification to users? This action cannot be reversed.')) {
      return
    }

    setSending(true)
    setSummary(null)

    try {
      const data = await broadcastNotification(heading, message)
      setSummary(data)
      setHeading('')
      setMessage('')
    } catch (e: any) {
      alert(e.message || 'Failed to dispatch broadcast')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Header 
        title="Broadcast notification" 
        description="Dispatch instant push notifications to the MYWAY mobile community with live delivery tracking."
      />

      <div className="broadcast-grid">
        {/* Left Form Panel */}
        <section className="panel form-panel">
          <div className="field">
            <label>Notification Heading</label>
            <input 
              placeholder="e.g. Campus Route Expansion or Safety Notice" 
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              maxLength={60}
            />
          </div>

          <div className="field">
            <label>Message Body</label>
            <textarea 
              placeholder="Write a clear and concise notification message..." 
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={220}
            />
          </div>

          <div className="form-row">
            <div className="field">
              <label>Target Audience</label>
              <select value={audience} onChange={(e) => setAudience(e.target.value)}>
                <option value="all">All registered devices</option>
                <option value="drivers">Active Drivers</option>
                <option value="students">Verified Students</option>
              </select>
            </div>
            <div className="field">
              <label>Delivery Mode</label>
              <select defaultValue="instant">
                <option value="instant">Send immediately</option>
                <option value="scheduled" disabled>Schedule for later (Beta)</option>
              </select>
            </div>
          </div>

          <Button 
            disabled={sending || !heading.trim() || !message.trim()}
            onClick={handleSend}
          >
            <Icon name="send" /> {sending ? 'Dispatching Push Notification...' : 'Send Broadcast'}
          </Button>

          {summary && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              borderRadius: '12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>Delivery Dispatch Report</span>
                <Badge tone={summary.failed === 0 ? "success" : "warning"}>
                  {summary.succeeded} Delivered
                </Badge>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div style={{ color: '#64748b' }}>
                  Total Devices: <strong style={{ color: '#0f172a' }}>{summary.totalRegistered}</strong>
                </div>
                <div style={{ color: '#64748b' }}>
                  Attempted: <strong style={{ color: '#0f172a' }}>{summary.attempted}</strong>
                </div>
                <div style={{ color: '#16a34a' }}>
                  Successful: <strong>{summary.succeeded}</strong>
                </div>
                <div style={{ color: '#dc2626' }}>
                  Failed: <strong>{summary.failed}</strong>
                </div>
                <div style={{ color: '#64748b' }}>
                  Opted Out: <strong>{summary.optedOut}</strong>
                </div>
                <div style={{ color: '#64748b' }}>
                  Stale Tokens Cleared: <strong>{summary.staleRemoved}</strong>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right Live Device Preview */}
        <aside className="panel preview-card">
          <p style={{ fontWeight: 700, fontSize: '11px', letterSpacing: '0.05em', color: '#94a3b8', margin: '0 0 12px 0' }}>
            LIVE PHONE PREVIEW
          </p>
          
          <div className="phone-preview">
            <span className="app-mark">M</span>
            <div>
              <b>MYWAY</b>
              <strong>{heading.trim() || 'Notification Title'}</strong>
              <p>{message.trim() || 'Your push notification content will appear here on user lock screens in real time.'}</p>
              <small>now</small>
            </div>
          </div>

          <div className="delivery-note" style={{ marginTop: '20px' }}>
            <Icon name="shield" />
            <span>
              <b>Safe delivery pipeline</b>
              <p>Opted-out devices and inactive tokens are automatically pruned during dispatch.</p>
            </span>
          </div>
        </aside>
      </div>
    </>
  )
}
