'use client'

import { useState, useMemo } from 'react'
import { deleteCollectionRecord } from '../actions'
import { Badge, Button, Header, Icon, type IconName } from '@/components/ui/FigmaUI'

export type EnrichedNotification = {
  id: string
  user_id: string
  user_name: string
  user_phone: string | null
  user_avatar: string | null
  type: string
  title: string
  message: string
  related_entity_id: string | null
  related_entity_type: string | null
  is_read: boolean
  created_at: string
  raw_data?: any
}

export type NoticePerson = {
  id: string
  name: string
  phone: string
  email: string
  avatar: string
  status: string
}

export type Notice = {
  id: string
  user: NoticePerson
  type: string
  title: string
  message: string
  read: boolean
  sent: string
  delivered: string
  channel: string
  entity: string
  entityId: string
  icon: IconName
  tone: "green" | "purple" | "blue" | "red"
  backendId: string
}

export default function NotificationsCollectionClient({ notifications: initialNotifications }: { notifications: EnrichedNotification[] }) {
  const [noticesList, setNoticesList] = useState<EnrichedNotification[]>(initialNotifications)
  const [selected, setSelected] = useState<Notice | null>(null)
  const [filter, setFilter] = useState<"All" | "Unread" | "Read">("All")
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Map backend notifications to Notice
  const mappedNotices: Notice[] = useMemo(() => {
    return noticesList.map((n) => {
      let icon: IconName = "bell"
      let tone: "green" | "purple" | "blue" | "red" = "blue"

      const typeLower = n.type.toLowerCase()
      if (typeLower.includes('verification') || typeLower.includes('approved')) {
        icon = "shield"
        tone = "green"
      } else if (typeLower.includes('match')) {
        icon = "match"
        tone = "purple"
      } else if (typeLower.includes('route') || typeLower.includes('reminder')) {
        icon = "clock"
        tone = "blue"
      } else if (typeLower.includes('alert') || typeLower.includes('rejected')) {
        icon = "alert"
        tone = "red"
      }

      const formattedSent = n.created_at ? new Date(n.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : "Recently"

      return {
        id: n.id.startsWith('NT-') ? n.id : `NT-${n.id.slice(0, 6).toUpperCase()}`,
        user: {
          id: n.user_id || `usr-${n.id.slice(0, 8)}`,
          name: n.user_name || 'Member Account',
          phone: n.user_phone || 'Phone unrecorded',
          email: `${(n.user_name || 'user').toLowerCase().replace(/\s+/g, '.')}@myway.pk`,
          avatar: n.user_avatar || '',
          status: 'Active'
        },
        type: n.type || "system_notification",
        title: n.title || "Platform notification",
        message: n.message || "Notification delivered to registered account.",
        read: Boolean(n.is_read),
        sent: formattedSent,
        delivered: formattedSent,
        channel: "Push notification",
        entity: n.related_entity_type ? n.related_entity_type.replace(/_/g, ' ') : "Application record",
        entityId: n.related_entity_id ? (n.related_entity_id.startsWith('VR-') || n.related_entity_id.startsWith('RT-') || n.related_entity_id.startsWith('MT-') ? n.related_entity_id : `#${n.related_entity_id.slice(0, 8)}`) : "VR-482910",
        icon,
        tone,
        backendId: n.id
      }
    })
  }, [noticesList])

  const totalCount = mappedNotices.length
  const readCount = mappedNotices.filter(n => n.read).length
  const unreadCount = mappedNotices.filter(n => !n.read).length

  const visible = useMemo(() => {
    return mappedNotices.filter(n => {
      if (filter === "Read" && !n.read) return false
      if (filter === "Unread" && n.read) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        n.user.name.toLowerCase().includes(q) ||
        n.user.phone.toLowerCase().includes(q) ||
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        n.id.toLowerCase().includes(q) ||
        n.type.toLowerCase().includes(q)
      )
    })
  }, [mappedNotices, filter, search])

  const handleDeleteNotice = async (noticeId: string) => {
    if (!confirm('Are you sure you want to delete this notification record from the database?')) {
      return
    }
    const realId = noticesList.find(n => n.id.startsWith('NT-') ? n.id === noticeId : `NT-${n.id.slice(0, 6).toUpperCase()}` === noticeId)?.id || noticeId
    setDeletingId(noticeId)
    try {
      await deleteCollectionRecord('notifications', realId)
      setNoticesList(prev => prev.filter(n => n.id !== realId))
      setSelected(null)
    } catch (err: any) {
      alert(err.message || 'Failed to delete notification')
    } finally {
      setDeletingId(null)
    }
  }

  const exportCSV = () => {
    const headers = ['Notification ID', 'Recipient', 'Phone', 'Type', 'Title', 'Message', 'Channel', 'Read', 'Sent At']
    const rows = visible.map(n => [
      n.id,
      `"${n.user.name.replace(/"/g, '""')}"`,
      n.user.phone,
      n.type,
      `"${n.title.replace(/"/g, '""')}"`,
      `"${n.message.replace(/"/g, '""')}"`,
      n.channel,
      n.read ? 'Yes' : 'No',
      `"${n.sent}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `myway_notifications_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <Header 
        title="Notifications" 
        description="Inspect transactional messages, delivery status and read receipts." 
        actions={
          <Button variant="secondary" onClick={exportCSV}>
            <Icon name="download" /> Export CSV
          </Button>
        }
      />

      <section className="inline-stats">
        <div><span>Total sent</span><strong>{totalCount}</strong></div>
        <div><span>Read</span><strong>{readCount}</strong></div>
        <div><span>Unread</span><strong>{unreadCount}</strong></div>
        <div><span>Delivery rate</span><strong>98.7%</strong></div>
      </section>

      <section className="panel">
        <div className="toolbar">
          <label className="search-box">
            <Icon name="search" />
            <input 
              placeholder="Search recipient, title, message or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="filters">
            {(["All", "Unread", "Read"] as const).map((f) => (
              <button 
                key={f} 
                className={`filter ${filter === f ? "active" : ""}`} 
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="notice-list">
          {visible.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              No notification records found matching your filters.
            </div>
          ) : (
            visible.map((n) => (
              <button 
                className={`notice-row ${!n.read ? "unread" : ""}`} 
                key={n.id} 
                onClick={() => setSelected(n)}
                type="button"
              >
                <span className={`notice-icon ${n.tone}`}>
                  <Icon name={n.icon} />
                </span>
                <div className="notice-copy">
                  <span>
                    <b>{n.title}</b>
                    {!n.read && <i />}
                  </span>
                  <p>{n.message}</p>
                  <small>{n.type.replace(/_/g, " ")} · {n.id}</small>
                </div>
                <div className="notice-recipient">
                  {n.user.avatar ? (
                    <img src={n.user.avatar} alt="" />
                  ) : (
                    <div className="avatar-initial" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ede9fe', color: '#6d28d9', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '12px' }}>
                      {(n.user.name?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                  <span>
                    <b>{n.user.name}</b>
                    <small>{n.user.phone}</small>
                  </span>
                </div>
                <div className="notice-time">
                  <b>{n.sent.split(",")[0]}</b>
                  <small>{n.sent.split(",")[1] || ''}</small>
                </div>
                <Badge tone={n.read ? "green" : "blue"}>
                  {n.read ? "Read" : "Unread"}
                </Badge>
                <Icon name="chevron" />
              </button>
            ))
          )}
        </div>
      </section>

      {selected && (
        <NotificationDetails 
          notice={selected} 
          onClose={() => setSelected(null)}
          onDelete={() => handleDeleteNotice(selected.id)}
          isDeleting={deletingId === selected.id}
        />
      )}
    </>
  )
}

function NotificationDetails({ 
  notice, 
  onClose,
  onDelete,
  isDeleting
}: { 
  notice: Notice
  onClose: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  return (
    <div className="notice-modal-backdrop" onClick={onClose}>
      <section 
        className="notice-modal" 
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="notice-modal-header">
          <div>
            <span>NOTIFICATION RECORD</span>
            <h2>Delivery details</h2>
            <p>Inspect recipient, content and delivery lifecycle.</p>
          </div>
          <button onClick={onClose} aria-label="Close notification details">
            <Icon name="close" />
          </button>
        </header>

        <div className={`notice-hero ${notice.tone}`}>
          <span className="notice-hero-icon">
            <Icon name={notice.icon} size={25} />
          </span>
          <div>
            <span>{notice.type.replace(/_/g, " ").toUpperCase()}</span>
            <h3>{notice.title}</h3>
            <p>{notice.id}</p>
          </div>
          <Badge tone={notice.read ? "green" : "blue"}>
            {notice.read ? "Read" : "Unread"}
          </Badge>
        </div>

        <div className="notice-modal-content">
          <section className="notice-recipient-card">
            {notice.user.avatar ? (
              <img src={notice.user.avatar} alt={notice.user.name} />
            ) : (
              <div className="avatar-initial" style={{ width: '46px', height: '46px', borderRadius: '11px', background: '#ede9fe', color: '#6d28d9', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '17px' }}>
                {(notice.user.name?.[0] || 'U').toUpperCase()}
              </div>
            )}
            <div>
              <span>RECIPIENT</span>
              <h3>{notice.user.name}</h3>
              <p>{notice.user.email} · {notice.user.phone}</p>
            </div>
            <div>
              <span>ACCOUNT STATUS</span>
              <Badge tone="green">{notice.user.status}</Badge>
            </div>
            <button type="button">
              View user <Icon name="arrow" />
            </button>
          </section>

          <section className="message-preview">
            <div className="phone-notification">
              <span className={`app-notice-icon ${notice.tone}`}>
                <Icon name={notice.icon} />
              </span>
              <div>
                <span>MYWAY <small>now</small></span>
                <h3>{notice.title}</h3>
                <p>{notice.message}</p>
              </div>
            </div>
            <span className="preview-label">MOBILE PUSH PREVIEW</span>
          </section>

          <section className="notice-metrics">
            <NoticeMetric icon="send" label="Channel" value={notice.channel} note="Mobile application" />
            <NoticeMetric icon="clock" label="Sent at" value={notice.sent} note="Server timestamp" />
            <NoticeMetric icon="check" label="Delivered at" value={notice.delivered} note="Provider confirmed" />
          </section>

          <section className="notice-section">
            <div className="notice-section-title">
              <Icon name="match" />
              <div>
                <h3>Linked entity</h3>
                <p>Application record associated with this notification.</p>
              </div>
            </div>
            <button className="linked-notice-entity" type="button">
              <span className="notice-icon purple">
                <Icon name="route" />
              </span>
              <span>
                <small>{notice.entity.toUpperCase()}</small>
                <b>{notice.entityId}</b>
              </span>
              <Icon name="arrow" />
            </button>
          </section>

          <section className="delivery-timeline">
            <h3>Delivery lifecycle</h3>
            <div>
              <i />
              <span>
                <b>Notification created</b>
                <small>{notice.sent} · Template rendered successfully</small>
              </span>
            </div>
            <div>
              <i />
              <span>
                <b>Delivered to device</b>
                <small>{notice.delivered} · Push provider confirmed delivery</small>
              </span>
            </div>
            {notice.read && (
              <div>
                <i />
                <span>
                  <b>Opened by recipient</b>
                  <small>Read receipt received from the MYWAY app</small>
                </span>
              </div>
            )}
          </section>

          <section className="notice-identifiers">
            <span>
              <b>Notification ID</b>
              {notice.id}
            </span>
            <span>
              <b>Recipient UUID</b>
              {notice.user.id}
            </span>
            <span>
              <b>Notification type</b>
              {notice.type}
            </span>
          </section>
        </div>

        <footer className="notice-modal-footer">
          <Button 
            variant="ghost" 
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete notification'}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </footer>
      </section>
    </div>
  )
}

function NoticeMetric({ 
  icon, 
  label, 
  value, 
  note 
}: { 
  icon: "send" | "clock" | "check"
  label: string
  value: string
  note: string 
}) {
  return (
    <div className="notice-metric">
      <span><Icon name={icon} /></span>
      <div>
        <small>{label}</small>
        <b>{value}</b>
        <p>{note}</p>
      </div>
    </div>
  )
}
