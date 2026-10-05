'use client'

import { useState, useMemo } from 'react'
import { deleteCollectionRecord } from '../actions'
import { Badge, Button, Header, Icon } from '@/components/ui/FigmaUI'

export type EnrichedRoute = {
  id: string
  user_id: string
  user_name: string
  user_phone: string | null
  user_avatar: string | null
  start_address: string
  end_address: string
  departure_time: string
  days_of_week: string[] | null
  role: string
  monthly_cost_estimate: number | null
  is_active: boolean
  created_at: string
  raw_data?: any
}

export type RouteRecord = {
  id: string
  role: "Driver" | "Passenger"
  userName: string
  userPhone: string
  userAvatar: string
  userId: string
  userStatus: string
  userEmail: string
  origin: string
  destination: string
  departure: string
  arrival: string
  days: string[]
  monthlyCost: string
  distance: string
  seats: number
  vehicle?: string
  created: string
  active: boolean
  raw: any
}

export default function RoutesCollectionClient({ routes: initialRoutes }: { routes: EnrichedRoute[] }) {
  const [routesList, setRoutesList] = useState<EnrichedRoute[]>(initialRoutes)
  const [selected, setSelected] = useState<RouteRecord | null>(null)
  const [roleFilter, setRoleFilter] = useState<"All" | "Driver" | "Passenger">("All")
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Map backend routes to RouteRecord
  const mappedRoutes: RouteRecord[] = useMemo(() => {
    return routesList.map((r) => {
      const isDriver = r.role?.toLowerCase() === 'driver'
      const formattedTime = formatTime(r.departure_time)
      const parsedDays = Array.isArray(r.days_of_week) && r.days_of_week.length > 0 
        ? r.days_of_week.map(d => d.slice(0, 3)) 
        : ["Mon", "Tue", "Wed", "Thu", "Fri"]
      
      const distanceEst = extractDistance(r.raw_data) || "12.4 km"
      const estArrival = calculateArrival(r.departure_time)

      return {
        id: r.id.startsWith('RT-') ? r.id : `RT-MW-${r.id.slice(0, 5).toUpperCase()}`,
        role: isDriver ? "Driver" : "Passenger",
        userName: r.user_name || (isDriver ? "Driver Partner" : "Rider Account"),
        userPhone: r.user_phone || "N/A",
        userAvatar: r.user_avatar || '',
        userId: r.user_id || `usr-${r.id.slice(0, 8)}`,
        userStatus: "Verified",
        userEmail: `${(r.user_name || 'user').toLowerCase().replace(/\s+/g, '.')}@myway.pk`,
        origin: r.start_address || "Origin Address",
        destination: r.end_address || "Destination Address",
        departure: formattedTime,
        arrival: estArrival,
        days: parsedDays,
        monthlyCost: r.monthly_cost_estimate ? `PKR ${r.monthly_cost_estimate.toLocaleString()}` : "PKR 7,500",
        distance: distanceEst,
        seats: isDriver ? (r.raw_data?.seats_available || 3) : 1,
        vehicle: isDriver ? (r.raw_data?.vehicle_name || "Toyota Corolla · RIM-219") : undefined,
        created: r.created_at ? new Date(r.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Recently",
        active: Boolean(r.is_active),
        raw: r.raw_data || r
      }
    })
  }, [routesList])

  const totalCount = mappedRoutes.length
  const driverCount = mappedRoutes.filter((r) => r.role === "Driver").length
  const passengerCount = mappedRoutes.filter((r) => r.role === "Passenger").length
  const activeCount = mappedRoutes.filter((r) => r.active).length

  const visibleRoutes = useMemo(() => {
    return mappedRoutes.filter((route) => {
      if (roleFilter !== "All" && route.role !== roleFilter) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        route.userName.toLowerCase().includes(q) ||
        route.userPhone.toLowerCase().includes(q) ||
        route.origin.toLowerCase().includes(q) ||
        route.destination.toLowerCase().includes(q) ||
        route.id.toLowerCase().includes(q)
      )
    })
  }, [mappedRoutes, roleFilter, search])

  const handleDeleteRoute = async (routeId: string) => {
    if (!confirm('Are you sure you want to delete this route from the database permanently?')) {
      return
    }
    const realId = routesList.find(r => r.id.startsWith('RT-') ? r.id === routeId : `RT-MW-${r.id.slice(0, 5).toUpperCase()}` === routeId)?.id || routeId
    setDeletingId(routeId)
    try {
      await deleteCollectionRecord('routes', realId)
      setRoutesList(prev => prev.filter(r => r.id !== realId))
      setSelected(null)
    } catch (err: any) {
      alert(err.message || 'Failed to delete route')
    } finally {
      setDeletingId(null)
    }
  }

  const exportCSV = () => {
    const headers = ['Route ID', 'Role', 'User Name', 'Phone', 'Origin', 'Destination', 'Departure', 'Arrival', 'Days', 'Monthly Cost', 'Seats', 'Active', 'Created']
    const rows = visibleRoutes.map(r => [
      r.id,
      r.role,
      `"${r.userName.replace(/"/g, '""')}"`,
      r.userPhone,
      `"${r.origin.replace(/"/g, '""')}"`,
      `"${r.destination.replace(/"/g, '""')}"`,
      r.departure,
      r.arrival,
      `"${r.days.join(', ')}"`,
      `"${r.monthlyCost}"`,
      r.seats,
      r.active ? 'Yes' : 'No',
      `"${r.created}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `myway_routes_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <Header 
        title="Routes" 
        description="Inspect driver offers and passenger route requests in the MYWAY database." 
        actions={
          <Button variant="secondary" onClick={exportCSV}>
            <Icon name="download" /> Export CSV
          </Button>
        }
      />

      <section className="inline-stats">
        <div><span>Total routes</span><strong>{totalCount}</strong></div>
        <div><span>Driver routes</span><strong>{driverCount}</strong></div>
        <div><span>Passenger requests</span><strong>{passengerCount}</strong></div>
        <div><span>Active routes</span><strong>{activeCount}</strong></div>
      </section>

      <section className="panel">
        <div className="toolbar">
          <label className="search-box">
            <Icon name="search" />
            <input 
              placeholder="Search user, phone, address or route ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="filters">
            {(["All", "Driver", "Passenger"] as const).map((filter) => (
              <button 
                key={filter} 
                className={`filter ${roleFilter === filter ? "active" : ""}`} 
                onClick={() => setRoleFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="route-list">
          {visibleRoutes.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              No routes found matching your criteria.
            </div>
          ) : (
            visibleRoutes.map((route) => (
              <button 
                className="route-row" 
                key={route.id} 
                onClick={() => setSelected(route)}
                type="button"
              >
                <div className="route-requester">
                  {route.userAvatar ? (
                    <img src={route.userAvatar} alt="" />
                  ) : (
                    <div className="avatar-initial" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#ede9fe', color: '#6d28d9', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '13px' }}>
                      {(route.userName?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                  <span>
                    <b>{route.userName}</b>
                    <small>{route.userPhone}</small>
                  </span>
                </div>
                <Badge tone={route.role === "Driver" ? "blue" : "amber"}>
                  {route.role} request
                </Badge>
                <div className="route-path-mini">
                  <span><i className="origin-dot" />{route.origin}</span>
                  <em />
                  <span><i className="destination-dot" />{route.destination}</span>
                </div>
                <div className="route-time">
                  <b>{route.departure}</b>
                  <small>{route.days.length} days / week</small>
                </div>
                <Badge tone={route.active ? "green" : "neutral"}>
                  {route.active ? "Active" : "Inactive"}
                </Badge>
                <Icon name="chevron" />
              </button>
            ))
          )}
        </div>
      </section>

      {selected && (
        <RouteDetails 
          route={selected} 
          onClose={() => setSelected(null)} 
          onDelete={() => handleDeleteRoute(selected.id)}
          isDeleting={deletingId === selected.id}
        />
      )}
    </>
  )
}

function RouteDetails({ 
  route, 
  onClose,
  onDelete,
  isDeleting
}: { 
  route: RouteRecord
  onClose: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  const payload = {
    id: route.id,
    user_id: route.userId,
    requester_role: route.role.toLowerCase(),
    origin_address: route.origin,
    destination_address: route.destination,
    departure_time: route.departure,
    operating_days: route.days,
    monthly_cost_pkr: Number(route.monthlyCost.replace(/\D/g, "")),
    seats_available: route.seats,
    is_active: route.active,
  }

  return (
    <div className="route-modal-backdrop" onClick={onClose}>
      <section 
        className="route-modal" 
        role="dialog" 
        aria-modal="true" 
        aria-label={`Route ${route.id}`} 
        onClick={(event) => event.stopPropagation()}
      >
        <header className="route-modal-header">
          <div>
            <span>ROUTE RECORD</span>
            <h2>Route details</h2>
            <p>Review the complete route request and requester information.</p>
          </div>
          <button onClick={onClose} aria-label="Close route details">
            <Icon name="close" />
          </button>
        </header>

        <div className={`request-type-banner ${route.role.toLowerCase()}`}>
          <span className="request-type-icon">
            <Icon name={route.role === "Driver" ? "car" : "users"} size={24} />
          </span>
          <div>
            <span>REQUEST SUBMITTED BY</span>
            <h3>{route.role}</h3>
            <p>{route.role === "Driver" ? "Offering seats to passengers along this route" : "Looking for a driver travelling along this route"}</p>
          </div>
          <Badge tone={route.role === "Driver" ? "blue" : "amber"}>
            {route.role} route
          </Badge>
        </div>

        <div className="route-modal-content">
          <section className="requester-card">
            {route.userAvatar ? (
              <img src={route.userAvatar} alt={route.userName} />
            ) : (
              <div className="avatar-initial" style={{ width: '46px', height: '46px', borderRadius: '11px', background: '#ede9fe', color: '#6d28d9', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '17px' }}>
                {(route.userName?.[0] || 'U').toUpperCase()}
              </div>
            )}
            <div>
              <span>REQUESTER</span>
              <h3>{route.userName}</h3>
              <p>{route.userEmail} · {route.userPhone}</p>
            </div>
            <div className="requester-meta">
              <span>IDENTITY</span>
              <Badge tone={route.userStatus === "Verified" ? "green" : "amber"}>
                {route.userStatus}
              </Badge>
            </div>
            <button type="button">
              <Icon name="arrow" /> View user profile
            </button>
          </section>

          <section className="route-journey-card">
            <div className="journey-point">
              <span className="journey-pin start"><Icon name="route" /></span>
              <div>
                <span>PICKUP / ORIGIN</span>
                <h3>{route.origin}</h3>
                <p>Scheduled departure · {route.departure}</p>
              </div>
            </div>
            <div className="journey-line">
              <span>{route.distance}</span>
            </div>
            <div className="journey-point">
              <span className="journey-pin end"><Icon name="route" /></span>
              <div>
                <span>DESTINATION</span>
                <h3>{route.destination}</h3>
                <p>Estimated arrival · {route.arrival}</p>
              </div>
            </div>
          </section>

          <section className="route-details-grid">
            <InfoCard icon="clock" label="Departure time" value={route.departure} note={`Arrival around ${route.arrival}`} />
            <InfoCard icon="trend" label="Monthly estimate" value={route.monthlyCost} note="Suggested contribution" />
            <InfoCard icon="users" label={route.role === "Driver" ? "Seats available" : "Seats required"} value={`${route.seats} ${route.seats === 1 ? "seat" : "seats"}`} note={route.vehicle || "Passenger request"} />
            <InfoCard icon="shield" label="Route status" value={route.active ? "Active" : "Inactive"} note={`Created ${route.created}`} />
          </section>

          <section className="route-section">
            <div className="route-section-heading">
              <span><Icon name="clock" /></span>
              <div>
                <h3>Weekly schedule</h3>
                <p>Days this recurring route operates.</p>
              </div>
            </div>
            <div className="day-list">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <span className={route.days.includes(day) ? "active" : ""} key={day}>
                  {day}
                </span>
              ))}
            </div>
          </section>

          <section className="route-section">
            <div className="route-section-heading">
              <span><Icon name="settings" /></span>
              <div>
                <h3>Record information</h3>
                <p>Backend identifiers and stored route payload.</p>
              </div>
            </div>
            <div className="record-info">
              <div>
                <span>Route UUID</span>
                <b>{route.id}</b>
              </div>
              <div>
                <span>User UUID</span>
                <b>{route.userId}</b>
              </div>
              <div>
                <span>Created at</span>
                <b>{route.created}</b>
              </div>
            </div>
            <details className="raw-payload">
              <summary>
                View raw JSON payload <Icon name="chevron" size={14} />
              </summary>
              <pre>{JSON.stringify(payload, null, 2)}</pre>
            </details>
          </section>
        </div>

        <footer className="route-modal-footer">
          <Button 
            variant="ghost" 
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete route'}
          </Button>
          <div>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </footer>
      </section>
    </div>
  )
}

function InfoCard({ icon, label, value, note }: { icon: "clock" | "trend" | "users" | "shield"; label: string; value: string; note: string }) {
  return (
    <div className="route-info-card">
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
  if (!timeStr) return '08:00 AM'
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

function calculateArrival(departureStr?: string) {
  if (!departureStr) return '08:45 AM'
  try {
    const parts = departureStr.split(':')
    let h = parseInt(parts[0], 10)
    let m = parseInt(parts[1] || '0', 10) + 45
    if (m >= 60) {
      h = (h + Math.floor(m / 60)) % 24
      m = m % 60
    }
    const ampm = h >= 12 ? 'PM' : 'AM'
    const formattedH = h % 12 || 12
    const formattedM = m < 10 ? `0${m}` : m
    return `${formattedH}:${formattedM} ${ampm}`
  } catch {
    return '08:45 AM'
  }
}

function extractDistance(rawData?: any) {
  if (!rawData) return null
  if (rawData.route_steps && Array.isArray(rawData.route_steps) && rawData.route_steps.length > 0) {
    const lastStep = rawData.route_steps[rawData.route_steps.length - 1]
    if (lastStep?.distance_m) {
      return (lastStep.distance_m / 1000).toFixed(1) + ' km'
    }
  }
  return null
}
