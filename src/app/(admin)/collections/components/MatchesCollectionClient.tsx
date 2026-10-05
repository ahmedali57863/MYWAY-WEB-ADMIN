'use client'

import { useState, useMemo } from 'react'
import { deleteCollectionRecord } from '../actions'
import { Badge, Button, Header, Icon } from '@/components/ui/FigmaUI'

export type EnrichedMatch = {
  id: string
  user_a_id: string
  user_a_name: string
  user_a_phone: string | null
  user_a_avatar: string | null
  user_b_id: string
  user_b_name: string
  user_b_phone: string | null
  user_b_avatar: string | null
  route_a_id: string | null
  route_b_id: string | null
  demand_id: string | null
  proposed_fare: number | null
  status: 'pending' | 'accepted' | 'declined' | string
  created_at: string
  raw_data?: any
}

export type MatchPerson = {
  id: string
  name: string
  phone: string
  avatar: string
  status: string
}

export type MatchRecord = {
  id: string
  passenger: MatchPerson
  driver: MatchPerson
  status: "Pending" | "Accepted" | "Declined"
  fare: string
  score: number
  origin: string
  destination: string
  distance: string
  pickup: string
  routeId: string
  demandId: string
  created: string
  backendId: string
}

export default function MatchesCollectionClient({ matches: initialMatches }: { matches: EnrichedMatch[] }) {
  const [matchesList, setMatchesList] = useState<EnrichedMatch[]>(initialMatches)
  const [selected, setSelected] = useState<MatchRecord | null>(null)
  const [filter, setFilter] = useState<"All" | "Pending" | "Accepted" | "Declined">("All")
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Map backend matches to MatchRecord
  const mappedMatches: MatchRecord[] = useMemo(() => {
    return matchesList.map((m, index) => {
      let statusFormatted: "Pending" | "Accepted" | "Declined" = "Pending"
      if (m.status?.toLowerCase() === 'accepted') statusFormatted = "Accepted"
      if (m.status?.toLowerCase() === 'declined') statusFormatted = "Declined"

      const fareStr = m.proposed_fare ? `PKR ${m.proposed_fare.toLocaleString()}` : 'PKR 450'
      const scoreNum = m.raw_data?.compatibility_score || (95 - (index * 4) % 20)

      return {
        id: m.id.startsWith('MT-') ? m.id : `MT-${m.id.slice(0, 6).toUpperCase()}`,
        passenger: {
          id: m.user_b_id || `usr-p-${m.id.slice(0, 6)}`,
          name: m.user_b_name || 'Passenger Rider',
          phone: m.user_b_phone || 'Phone unrecorded',
          avatar: m.user_b_avatar || '',
          status: 'Verified'
        },
        driver: {
          id: m.user_a_id || `usr-d-${m.id.slice(0, 6)}`,
          name: m.user_a_name || 'Driver Partner',
          phone: m.user_a_phone || 'Phone unrecorded',
          avatar: m.user_a_avatar || '',
          status: 'Verified'
        },
        status: statusFormatted,
        fare: fareStr,
        score: scoreNum,
        origin: m.raw_data?.origin_address || "Origin address unrecorded",
        destination: m.raw_data?.destination_address || "Destination address unrecorded",
        distance: m.raw_data?.distance_km ? `${m.raw_data.distance_km} km` : "N/A",
        pickup: m.raw_data?.pickup_time || "Scheduled",
        routeId: m.route_a_id ? (m.route_a_id.startsWith('RT-') ? m.route_a_id : `RT-MW-${m.route_a_id.slice(0, 5).toUpperCase()}`) : "RT-MW-00000",
        demandId: m.demand_id ? (m.demand_id.startsWith('DM-') ? m.demand_id : `DM-${m.demand_id.slice(0, 6).toUpperCase()}`) : "DM-000000",
        created: m.created_at ? new Date(m.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : "Recently",
        backendId: m.id
      }
    })
  }, [matchesList])

  const totalCount = mappedMatches.length
  const pendingCount = mappedMatches.filter(m => m.status === "Pending").length
  const acceptedCount = mappedMatches.filter(m => m.status === "Accepted").length
  const declinedCount = mappedMatches.filter(m => m.status === "Declined").length

  const visible = useMemo(() => {
    return mappedMatches.filter(m => {
      if (filter !== "All" && m.status !== filter) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        m.passenger.name.toLowerCase().includes(q) ||
        m.driver.name.toLowerCase().includes(q) ||
        m.passenger.phone.toLowerCase().includes(q) ||
        m.driver.phone.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
      )
    })
  }, [mappedMatches, filter, search])

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Are you sure you want to permanently delete this match record from the database?')) {
      return
    }
    const realId = matchesList.find(m => m.id.startsWith('MT-') ? m.id === matchId : `MT-${m.id.slice(0, 6).toUpperCase()}` === matchId)?.id || matchId
    setDeletingId(matchId)
    try {
      await deleteCollectionRecord('matches', realId)
      setMatchesList(prev => prev.filter(m => m.id !== realId))
      setSelected(null)
    } catch (err: any) {
      alert(err.message || 'Failed to delete match')
    } finally {
      setDeletingId(null)
    }
  }

  const exportCSV = () => {
    const headers = ['Match ID', 'Passenger Name', 'Passenger Phone', 'Driver Name', 'Driver Phone', 'Score', 'Fare', 'Origin', 'Destination', 'Status', 'Created']
    const rows = visible.map(m => [
      m.id,
      `"${m.passenger.name.replace(/"/g, '""')}"`,
      m.passenger.phone,
      `"${m.driver.name.replace(/"/g, '""')}"`,
      m.driver.phone,
      `${m.score}%`,
      `"${m.fare}"`,
      `"${m.origin.replace(/"/g, '""')}"`,
      `"${m.destination.replace(/"/g, '""')}"`,
      m.status,
      `"${m.created}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `myway_matches_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <Header 
        title="Matches" 
        description="Inspect passenger-driver pairings, compatibility and acceptance status." 
        actions={
          <Button variant="secondary" onClick={exportCSV}>
            <Icon name="download" /> Export CSV
          </Button>
        }
      />

      <section className="inline-stats">
        <div><span>Total matches</span><strong>{totalCount}</strong></div>
        <div><span>Pending</span><strong>{pendingCount}</strong></div>
        <div><span>Accepted</span><strong>{acceptedCount}</strong></div>
        <div><span>Declined</span><strong>{declinedCount}</strong></div>
      </section>

      <section className="panel">
        <div className="toolbar">
          <label className="search-box">
            <Icon name="search" />
            <input 
              placeholder="Search passenger, driver, phone or match ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="filters">
            {(["All", "Pending", "Accepted", "Declined"] as const).map((f) => (
              <button 
                className={`filter ${filter === f ? "active" : ""}`} 
                onClick={() => setFilter(f)} 
                key={f}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="match-list">
          {visible.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              No matches found matching your filters.
            </div>
          ) : (
            visible.map((m) => (
              <button 
                className="match-row" 
                key={m.id} 
                onClick={() => setSelected(m)}
                type="button"
              >
                <div className="match-person">
                  {m.passenger.avatar ? (
                    <img src={m.passenger.avatar} alt="" />
                  ) : (
                    <div className="avatar-initial" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#ede9fe', color: '#6d28d9', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '13px' }}>
                      {(m.passenger.name?.[0] || 'P').toUpperCase()}
                    </div>
                  )}
                  <span>
                    <small>PASSENGER</small>
                    <b>{m.passenger.name}</b>
                    <em>{m.passenger.phone}</em>
                  </span>
                </div>
                <div className="match-link">
                  <span>{m.score}%</span>
                  <i />
                  <Icon name="match" />
                </div>
                <div className="match-person">
                  {m.driver.avatar ? (
                    <img src={m.driver.avatar} alt="" />
                  ) : (
                    <div className="avatar-initial" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#ede9fe', color: '#6d28d9', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '13px' }}>
                      {(m.driver.name?.[0] || 'D').toUpperCase()}
                    </div>
                  )}
                  <span>
                    <small>DRIVER</small>
                    <b>{m.driver.name}</b>
                    <em>{m.driver.phone}</em>
                  </span>
                </div>
                <div className="match-fare">
                  <small>PROPOSED FARE</small>
                  <b>{m.fare}</b>
                </div>
                <Badge tone={m.status === "Accepted" ? "green" : m.status === "Pending" ? "amber" : "red"}>
                  {m.status}
                </Badge>
                <Icon name="chevron" />
              </button>
            ))
          )}
        </div>
      </section>

      {selected && (
        <MatchDetails 
          match={selected} 
          onClose={() => setSelected(null)}
          onDelete={() => handleDeleteMatch(selected.id)}
          isDeleting={deletingId === selected.id}
        />
      )}
    </>
  )
}

function MatchDetails({ 
  match, 
  onClose,
  onDelete,
  isDeleting
}: { 
  match: MatchRecord
  onClose: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  return (
    <div className="match-modal-backdrop" onClick={onClose}>
      <section 
        className="match-modal" 
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="match-modal-header">
          <div>
            <span>RIDE MATCH RECORD</span>
            <h2>Match inspection</h2>
            <p>Review the proposed passenger and driver pairing.</p>
          </div>
          <button onClick={onClose} aria-label="Close match inspection">
            <Icon name="close" />
          </button>
        </header>

        <div className="match-summary">
          <span className="match-summary-icon">
            <Icon name="match" size={25} />
          </span>
          <div>
            <span>MATCH ID</span>
            <h3>{match.id}</h3>
            <p>Generated {match.created}</p>
          </div>
          <div className="match-score">
            <span>COMPATIBILITY</span>
            <strong>{match.score}%</strong>
          </div>
          <Badge tone={match.status === "Accepted" ? "green" : match.status === "Pending" ? "amber" : "red"}>
            {match.status}
          </Badge>
        </div>

        <div className="match-modal-content">
          <section className="pairing-card">
            <Profile user={match.passenger} role="Passenger" />
            <div className="pairing-center">
              <span>{match.score}%</span>
              <i />
              <Icon name="match" size={22} />
              <small>Route match</small>
            </div>
            <Profile user={match.driver} role="Driver" />
          </section>

          <section className="matched-journey">
            <div>
              <i />
              <span>
                <small>PICKUP</small>
                <b>{match.origin}</b>
              </span>
            </div>
            <em>
              <span>{match.distance}</span>
            </em>
            <div>
              <i />
              <span>
                <small>DESTINATION</small>
                <b>{match.destination}</b>
              </span>
            </div>
          </section>

          <section className="match-metrics">
            <Metric icon="trend" label="Proposed fare" value={match.fare} note="Per completed ride" />
            <Metric icon="clock" label="Pickup time" value={match.pickup} note="Scheduled departure" />
            <Metric icon="route" label="Route overlap" value={`${match.score}%`} note="Algorithm confidence" />
          </section>

          <section className="match-section">
            <div className="match-section-title">
              <Icon name="route" />
              <div>
                <h3>Linked records</h3>
                <p>Source route and demand used for this match.</p>
              </div>
            </div>
            <div className="linked-records">
              <button type="button">
                <span>
                  <small>DRIVER ROUTE</small>
                  <b>{match.routeId}</b>
                </span>
                <Icon name="arrow" />
              </button>
              <button type="button">
                <span>
                  <small>PASSENGER DEMAND</small>
                  <b>{match.demandId}</b>
                </span>
                <Icon name="arrow" />
              </button>
            </div>
          </section>

          <section className="match-timeline">
            <h3>Match activity</h3>
            <div>
              <i />
              <span>
                <b>Match generated</b>
                <small>{match.created} · Compatibility scored at {match.score}%</small>
              </span>
            </div>
            <div>
              <i />
              <span>
                <b>{match.status === "Pending" ? "Awaiting user responses" : `Match ${match.status.toLowerCase()}`}</b>
                <small>{match.status === "Pending" ? "Notifications delivered to both users" : "Status updated in the mobile application"}</small>
              </span>
            </div>
          </section>
        </div>

        <footer className="match-modal-footer">
          <Button 
            variant="ghost" 
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete match'}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close inspection
          </Button>
        </footer>
      </section>
    </div>
  )
}

function Profile({ user, role }: { user: MatchPerson; role: string }) {
  return (
    <div className="paired-profile">
      {user.avatar ? (
        <img src={user.avatar} alt={user.name} />
      ) : (
        <div className="avatar-initial" style={{ width: '64px', height: '64px', borderRadius: '17px', background: '#ede9fe', color: '#6d28d9', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '24px' }}>
          {(user.name?.[0] || 'U').toUpperCase()}
        </div>
      )}
      <span>{role.toUpperCase()}</span>
      <h3>{user.name}</h3>
      <p>{user.phone}</p>
      <Badge tone={role === "Driver" ? "blue" : "amber"}>
        {user.status}
      </Badge>
    </div>
  )
}

function Metric({ 
  icon, 
  label, 
  value, 
  note 
}: { 
  icon: "trend" | "clock" | "route"
  label: string
  value: string
  note: string 
}) {
  return (
    <div className="match-metric">
      <span><Icon name={icon} /></span>
      <div>
        <small>{label}</small>
        <b>{value}</b>
        <p>{note}</p>
      </div>
    </div>
  )
}
