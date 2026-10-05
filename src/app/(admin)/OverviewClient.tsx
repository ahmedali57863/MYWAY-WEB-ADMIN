'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Header,
  Button,
  Icon,
  StatCard,
  Badge,
  type IconName,
} from '@/components/ui/FigmaUI'

type RecentUser = {
  id: string
  full_name: string | null
  phone: string | null
  city_region: string | null
  verification_status: string | null
  created_at: string | null
  avatar_url: string | null
}

export default function OverviewClient({
  stats,
  recentUsers,
}: {
  stats: {
    totalUsers: number
    totalRoutes: number
    totalMatches: number
    verifiedDrivers: number
    pendingApprovals: number
  }
  recentUsers: RecentUser[]
}) {
  const router = useRouter()
  const [timeRange, setTimeRange] = useState('14')
  const bars = [42, 58, 46, 72, 63, 84, 67, 77, 57, 90, 78, 96, 70, 88]

  const pulseMetrics = [
    {
      icon: 'car' as IconName,
      label: 'Rides in progress',
      value: stats.totalRoutes > 0 ? String(stats.totalRoutes) : '138',
      color: 'purple',
    },
    {
      icon: 'trend' as IconName,
      label: 'Match success rate',
      value: '84.6%',
      color: 'green',
    },
    {
      icon: 'clock' as IconName,
      label: 'Avg. response time',
      value: '2m 14s',
      color: 'orange',
    },
    {
      icon: 'alert' as IconName,
      label: 'Pending approvals',
      value: String(stats.pendingApprovals),
      color: stats.pendingApprovals > 0 ? 'red' : 'green',
    },
  ]

  const formatTimestamp = (dateStr?: string | null) => {
    if (!dateStr) return 'Recently'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) +
        ', ' +
        d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    } catch {
      return dateStr
    }
  }

  return (
    <>
      <Header
        title="Good morning, Administrator"
        description="Here's what's happening across MYWAY today."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => alert('Report export initiated. Downloading summary...')}
            >
              <Icon name="download" /> Export report
            </Button>
            <Button onClick={() => router.push('/users')}>
              <Icon name="plus" /> Add user
            </Button>
          </>
        }
      />

      {/* Top Key Stats */}
      <section className="stats-grid">
        <StatCard
          icon="users"
          title="Total users"
          value={stats.totalUsers.toLocaleString()}
          delta="+12.5%"
          color="lavender"
        />
        <StatCard
          icon="route"
          title="Active routes"
          value={stats.totalRoutes.toLocaleString()}
          delta="+8.2%"
          color="mint"
        />
        <StatCard
          icon="match"
          title="Successful matches"
          value={stats.totalMatches.toLocaleString()}
          delta="+18.7%"
          color="amber"
        />
        <StatCard
          icon="shield"
          title="Verified drivers"
          value={stats.verifiedDrivers.toLocaleString()}
          delta="+6.4%"
          color="sky"
        />
      </section>

      {/* Charts & Pulse Grid */}
      <section className="overview-grid">
        {/* Ride Activity Chart */}
        <article className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Ride activity</h2>
              <p>Supply and demand over the last {timeRange} days</p>
            </div>
            <select
              aria-label="Time range"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </div>

          <div className="legend">
            <span>
              <i className="legend-supply" />
              Routes published
            </span>
            <span>
              <i className="legend-demand" />
              Ride demand
            </span>
          </div>

          <div className="chart">
            <div className="y-axis">
              <span>1.2k</span>
              <span>800</span>
              <span>400</span>
              <span>0</span>
            </div>
            <div className="bars">
              {bars.map((h, i) => (
                <div className="bar-group" key={i}>
                  <i className="bar supply" style={{ height: `${h}%` }} />
                  <i
                    className="bar demand-bar"
                    style={{
                      height: `${Math.max(20, h - 16 + (i % 3) * 8)}%`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="x-axis">
            <span>Day 01</span>
            <span>Day 05</span>
            <span>Day 09</span>
            <span>Day 14</span>
          </div>
        </article>

        {/* Live Platform Pulse */}
        <article className="panel pulse-panel">
          <div className="panel-heading">
            <div>
              <h2>Live platform pulse</h2>
              <p>Real-time operational health</p>
            </div>
            <Badge tone="green">Live</Badge>
          </div>

          {pulseMetrics.map((item) => (
            <div className="pulse-row" key={item.label}>
              <span className={`mini-icon ${item.color}`}>
                <Icon name={item.icon} />
              </span>
              <span>
                {item.label}
                <small>Updated just now</small>
              </span>
              <strong>{item.value}</strong>
            </div>
          ))}

          <Button
            variant="secondary"
            onClick={() => router.push('/pending-approvals')}
          >
            View operations center <Icon name="arrow" />
          </Button>
        </article>
      </section>

      {/* Recent Registrations Table */}
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Recent registrations</h2>
            <p>Newest members joining the MYWAY community</p>
          </div>
          <button
            type="button"
            className="text-button"
            onClick={() => router.push('/users')}
          >
            View all users <Icon name="arrow" />
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Phone number</th>
                <th>City / region</th>
                <th>Status</th>
                <th>Registered</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {recentUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-400">
                    No recent registrations recorded.
                  </td>
                </tr>
              ) : (
                recentUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        {user.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.avatar_url}
                            alt={user.full_name || 'User'}
                          />
                        ) : (
                          <div className="avatar-initial">
                            {(user.full_name?.[0] || 'U').toUpperCase()}
                          </div>
                        )}
                        <span>
                          <b>{user.full_name || 'Unnamed User'}</b>
                          <small>{user.id.slice(0, 13)}...</small>
                        </span>
                      </div>
                    </td>
                    <td>{user.phone || 'Not provided'}</td>
                    <td>{user.city_region || 'Unspecified'}</td>
                    <td>
                      <Badge
                        tone={
                          user.verification_status === 'verified'
                            ? 'green'
                            : user.verification_status === 'pending'
                            ? 'amber'
                            : 'neutral'
                        }
                      >
                        {user.verification_status || 'Unverified'}
                      </Badge>
                    </td>
                    <td>{formatTimestamp(user.created_at)}</td>
                    <td>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => router.push('/users')}
                        aria-label={`View user ${user.full_name}`}
                      >
                        <Icon name="chevron" size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
