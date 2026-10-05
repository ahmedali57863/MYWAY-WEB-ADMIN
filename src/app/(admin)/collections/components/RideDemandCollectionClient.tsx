'use client'

import { useState, useMemo } from 'react'
import { deleteCollectionRecord } from '../actions'
import { Badge, Button, Header, Icon } from '@/components/ui/FigmaUI'

export type EnrichedRideDemand = {
  id: string
  user_id: string
  rider_name: string
  rider_phone: string | null
  rider_avatar: string | null
  pickup_address: string
  dropoff_address: string
  schedule_type: string
  days_of_week: number[] | null
  specific_date: string | null
  time_window_start: string
  time_window_end: string | null
  is_fulfilled: boolean
  created_at: string
  raw_data?: any
}

export type Demand = {
  id: string
  userName: string
  userPhone: string
  userEmail: string
  userAvatar: string
  userId: string
  userStatus: string
  pickup: string
  dropoff: string
  schedule: string
  date: string
  start: string
  end: string
  days: string[]
  seats: number
  note: string
  status: "Pending" | "Fulfilled"
  backendId: string
  createdTime: string
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function RideDemandCollectionClient({ demands: initialDemands }: { demands: EnrichedRideDemand[] }) {
  const [demandsList, setDemandsList] = useState<EnrichedRideDemand[]>(initialDemands)
  const [selected, setSelected] = useState<Demand | null>(null)
  const [filter, setFilter] = useState<"All" | "Pending" | "Fulfilled">("All")
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Map backend ride demands to Demand
  const mappedDemands: Demand[] = useMemo(() => {
    return demandsList.map((d) => {
      const parsedDays = Array.isArray(d.days_of_week) && d.days_of_week.length > 0
        ? d.days_of_week.map(n => DAY_NAMES[n] || String(n))
        : ["Mon", "Tue", "Wed", "Thu", "Fri"]
      
      const startTime = formatTime(d.time_window_start)
      const endTime = d.time_window_end ? formatTime(d.time_window_end) : addMinutes(d.time_window_start, 30)

      return {
        id: d.id.startsWith('DM-') ? d.id : `DM-${d.id.slice(0, 6).toUpperCase()}`,
        userName: d.rider_name || 'Passenger Rider',
        userPhone: d.rider_phone || 'Phone unrecorded',
        userEmail: `${(d.rider_name || 'passenger').toLowerCase().replace(/\s+/g, '.')}@myway.pk`,
        userAvatar: d.rider_avatar || '',
        userId: d.user_id || `usr-${d.id.slice(0, 8)}`,
        userStatus: "Verified",
        pickup: d.pickup_address || "Pickup address unrecorded",
        dropoff: d.dropoff_address || "Dropoff address unrecorded",
        schedule: d.schedule_type ? (d.schedule_type.charAt(0).toUpperCase() + d.schedule_type.slice(1)) : "Daily commute",
        date: d.specific_date ? `Date: ${d.specific_date}` : "Recurring",
        start: startTime,
        end: endTime,
        days: parsedDays,
        seats: d.raw_data?.seats_requested || 1,
        note: d.raw_data?.passenger_note || "Passenger ride request.",
        status: d.is_fulfilled ? "Fulfilled" : "Pending",
        backendId: d.id,
        createdTime: d.created_at ? new Date(d.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : "Recently"
      }
    })
  }, [demandsList])

  const totalCount = mappedDemands.length
  const pendingCount = mappedDemands.filter(d => d.status === "Pending").length
  const fulfilledCount = mappedDemands.filter(d => d.status === "Fulfilled").length

  const visible = useMemo(() => {
    return mappedDemands.filter(d => {
      if (filter !== "All" && d.status !== filter) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        d.userName.toLowerCase().includes(q) ||
        d.userPhone.toLowerCase().includes(q) ||
        d.pickup.toLowerCase().includes(q) ||
        d.dropoff.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q)
      )
    })
  }, [mappedDemands, filter, search])

  const handleDeleteDemand = async (demandId: string) => {
    if (!confirm('Are you sure you want to delete this ride demand request from the database?')) {
      return
    }
    const realId = demandsList.find(d => d.id.startsWith('DM-') ? d.id === demandId : `DM-${d.id.slice(0, 6).toUpperCase()}` === demandId)?.id || demandId
    setDeletingId(demandId)
    try {
      await deleteCollectionRecord('ride_demand', realId)
      setDemandsList(prev => prev.filter(d => d.id !== realId))
      setSelected(null)
    } catch (err: any) {
      alert(err.message || 'Failed to delete demand')
    } finally {
      setDeletingId(null)
    }
  }

  const exportCSV = () => {
    const headers = ['Demand ID', 'Passenger', 'Phone', 'Pickup', 'Dropoff', 'Schedule', 'Time Window', 'Days', 'Seats', 'Status', 'Created']
    const rows = visible.map(d => [
      d.id,
      `"${d.userName.replace(/"/g, '""')}"`,
      d.userPhone,
      `"${d.pickup.replace(/"/g, '""')}"`,
      `"${d.dropoff.replace(/"/g, '""')}"`,
      d.schedule,
      `"${d.start} - ${d.end}"`,
      `"${d.days.join(', ')}"`,
      d.seats,
      d.status,
      `"${d.createdTime}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `myway_demand_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <Header 
        title="Ride demand" 
        description="Monitor passenger ride requests, schedules and fulfillment status." 
        actions={
          <Button variant="secondary" onClick={exportCSV}>
            <Icon name="download" /> Export CSV
          </Button>
        }
      />

      <section className="inline-stats">
        <div><span>Total demands</span><strong>{totalCount}</strong></div>
        <div><span>Pending</span><strong>{pendingCount}</strong></div>
        <div><span>Fulfilled</span><strong>{fulfilledCount}</strong></div>
        <div><span>Match rate</span><strong>{totalCount > 0 ? Math.round((fulfilledCount / totalCount) * 100) : 0}%</strong></div>
      </section>

      <section className="panel">
        <div className="toolbar">
          <label className="search-box">
            <Icon name="search" />
            <input 
              placeholder="Search passenger, phone, pickup or dropoff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="filters">
            {(["All", "Pending", "Fulfilled"] as const).map((f) => (
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

        <div className="demand-list">
          {visible.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              No ride demand records matched your query.
            </div>
          ) : (
            visible.map((d) => (
              <button 
                className="demand-row" 
                key={d.id} 
                onClick={() => setSelected(d)}
                type="button"
              >
                <div className="demand-person">
                  {d.userAvatar ? (
                    <img src={d.userAvatar} alt="" />
                  ) : (
                    <div className="avatar-initial" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#ede9fe', color: '#6d28d9', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '13px' }}>
                      {(d.userName?.[0] || 'P').toUpperCase()}
                    </div>
                  )}
                  <span>
                    <b>{d.userName}</b>
                    <small>{d.id} · {d.userPhone}</small>
                  </span>
                </div>
                <div className="demand-route">
                  <span><i />{d.pickup}</span>
                  <em />
                  <span><i />{d.dropoff}</span>
                </div>
                <div className="demand-schedule">
                  <b>{d.schedule}</b>
                  <small>{d.start} – {d.end}</small>
                </div>
                <Badge tone={d.status === "Fulfilled" ? "green" : "amber"}>
                  {d.status}
                </Badge>
                <Icon name="chevron" />
              </button>
            ))
          )}
        </div>
      </section>

      {selected && (
        <DemandDetails 
          demand={selected} 
          onClose={() => setSelected(null)} 
          onDelete={() => handleDeleteDemand(selected.id)}
          isDeleting={deletingId === selected.id}
        />
      )}
    </>
  )
}

function DemandDetails({ 
  demand, 
  onClose,
  onDelete,
  isDeleting
}: { 
  demand: Demand
  onClose: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  return (
    <div className="demand-modal-backdrop" onClick={onClose}>
      <section 
        className="demand-modal" 
        role="dialog" 
        aria-modal="true" 
        onClick={(e) => e.stopPropagation()}
      >
        <header className="demand-modal-header">
          <div>
            <span>PASSENGER REQUEST</span>
            <h2>Ride demand details</h2>
            <p>Complete passenger journey and schedule requirements.</p>
          </div>
          <button onClick={onClose} aria-label="Close demand details">
            <Icon name="close" />
          </button>
        </header>

        <div className="demand-status">
          <span className="demand-status-icon">
            <Icon name="demand" size={24} />
          </span>
          <div>
            <span>DEMAND ID</span>
            <h3>{demand.id}</h3>
            <p>Created {demand.createdTime}</p>
          </div>
          <Badge tone={demand.status === "Fulfilled" ? "green" : "amber"}>
            {demand.status}
          </Badge>
        </div>

        <div className="demand-modal-content">
          <section className="demand-user-card">
            {demand.userAvatar ? (
              <img src={demand.userAvatar} alt={demand.userName} />
            ) : (
              <div className="avatar-initial" style={{ width: '46px', height: '46px', borderRadius: '11px', background: '#ede9fe', color: '#6d28d9', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '17px' }}>
                {(demand.userName?.[0] || 'P').toUpperCase()}
              </div>
            )}
            <div>
              <span>PASSENGER</span>
              <h3>{demand.userName}</h3>
              <p>{demand.userEmail} · {demand.userPhone}</p>
            </div>
            <Badge tone="green">{demand.userStatus}</Badge>
            <button type="button">
              View account <Icon name="arrow" />
            </button>
          </section>

          <section className="demand-journey">
            <div>
              <span className="demand-pin start"><Icon name="route" /></span>
              <section>
                <span>PICKUP LOCATION</span>
                <h3>{demand.pickup}</h3>
                <p>Departure window starts at {demand.start}</p>
              </section>
            </div>
            <div className="demand-journey-line">
              <span>Passenger route</span>
            </div>
            <div>
              <span className="demand-pin end"><Icon name="route" /></span>
              <section>
                <span>DROPOFF LOCATION</span>
                <h3>{demand.dropoff}</h3>
                <p>Departure window ends at {demand.end}</p>
              </section>
            </div>
          </section>

          <section className="demand-facts">
            <Fact icon="clock" label="Schedule type" value={demand.schedule} note={demand.date} />
            <Fact icon="users" label="Seats required" value={`${demand.seats} ${demand.seats === 1 ? "seat" : "seats"}`} note="Passenger capacity" />
            <Fact icon="clock" label="Time window" value={`${demand.start} – ${demand.end}`} note="Preferred departure" />
          </section>

          <section className="demand-section">
            <div className="demand-section-title">
              <Icon name="clock" />
              <div>
                <h3>Operating schedule</h3>
                <p>Requested travel days for this demand.</p>
              </div>
            </div>
            <div className="demand-days">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <span className={demand.days.includes(day) ? "active" : ""} key={day}>
                  {day}
                </span>
              ))}
            </div>
          </section>

          <section className="demand-section">
            <div className="demand-section-title">
              <Icon name="chat" />
              <div>
                <h3>Passenger note</h3>
                <p>Additional ride preferences.</p>
              </div>
            </div>
            <blockquote>{demand.note}</blockquote>
          </section>

          <section className="demand-record">
            <span>
              <b>Demand UUID</b>
              {demand.id}
            </span>
            <span>
              <b>Passenger UUID</b>
              {demand.userId}
            </span>
            <span>
              <b>Last updated</b>
              {demand.createdTime}
            </span>
          </section>
        </div>

        <footer className="demand-modal-footer">
          <Button 
            variant="ghost" 
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete demand'}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close details
          </Button>
        </footer>
      </section>
    </div>
  )
}

function Fact({ 
  icon, 
  label, 
  value, 
  note 
}: { 
  icon: "clock" | "users"
  label: string
  value: string
  note: string 
}) {
  return (
    <div className="demand-fact">
      <span><Icon name={icon} /></span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{note}</p>
      </div>
    </div>
  )
}

function formatTime(timeStr?: string) {
  if (!timeStr) return '07:30 AM'
  try {
    const parts = timeStr.split(':')
    const h = parseInt(parts[0], 10)
    const m = parts[1] || '00'
    const ampm = h >= 12 ? 'PM' : 'AM'
    const formattedH = h % 12 || 12
    return `${formattedH}:${m.slice(0, 2)} ${ampm}`
  } catch {
    return timeStr
  }
}

function addMinutes(timeStr: string, minsToAdd: number) {
  try {
    const parts = timeStr.split(':')
    let h = parseInt(parts[0], 10)
    let m = parseInt(parts[1] || '0', 10) + minsToAdd
    if (m >= 60) {
      h = (h + Math.floor(m / 60)) % 24
      m = m % 60
    }
    const ampm = h >= 12 ? 'PM' : 'AM'
    const formattedH = h % 12 || 12
    const formattedM = m < 10 ? `0${m}` : m
    return `${formattedH}:${formattedM} ${ampm}`
  } catch {
    return '08:00 AM'
  }
}
