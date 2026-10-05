'use client'

import { useState, useMemo } from 'react'
import {
  toggleDriverVerification,
  approveDriverApplication,
  rejectDriverApplication,
  deleteDriverAccount,
} from './actions'
import { Badge, Button, Header, Icon } from '@/components/ui/FigmaUI'

export type DriverVehicle = {
  id: string
  make: string
  model: string
  year: number
  color: string
  plate: string
  seats: number
  hasAc: boolean
  isActive: boolean
  vehicleImage: string
  signedDocUrl?: string | null
  storagePath?: string | null
}

export type DriverRoute = {
  id: string
  origin: string
  destination: string
  departure: string
  arrival: string
  days: string[]
  monthlyCost: string
  seats: number
  isActive: boolean
  created: string
}

export type DriverRecord = {
  id: string
  name: string
  email: string
  phone: string
  avatar: string
  city: string
  address: string
  registeredAt: string
  isVerifiedDriver: boolean
  applicationStatus: 'approved' | 'pending' | 'rejected' | 'none'
  rejectionReason?: string | null
  applicationId?: string | null
  vehicleId?: string | null
  cnicNumber: string
  cnicVerified: boolean
  fatherName: string
  dob: string
  licenseNumber: string
  licenseExpiry: string
  licenseSignedUrl?: string | null
  registrationSignedUrl?: string | null
  selfieSignedUrl?: string | null
  cnicFrontSignedUrl?: string | null
  cnicBackSignedUrl?: string | null
  vehicle: DriverVehicle | null
  routes: DriverRoute[]
  matchesCount: number
  tripsCount: number
  rating: number
}

export default function DriversClient({ drivers: initialDrivers }: { drivers: DriverRecord[] }) {
  const [driversList, setDriversList] = useState<DriverRecord[]>(initialDrivers)
  const [selectedDriver, setSelectedDriver] = useState<DriverRecord | null>(null)
  const [tabFilter, setTabFilter] = useState<'All' | 'Verified' | 'Pending' | 'Active Routes' | 'AC'>('All')
  const [search, setSearch] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [activeLightboxDoc, setActiveLightboxDoc] = useState<{ title: string; url: string | null; type: 'image' | 'paper'; plate?: string; owner?: string } | null>(null)

  // Quick stats
  const totalCount = driversList.length
  const verifiedCount = driversList.filter((d) => d.isVerifiedDriver || d.applicationStatus === 'approved').length
  const pendingCount = driversList.filter((d) => d.applicationStatus === 'pending').length
  const activeRoutesCount = driversList.filter((d) => d.routes.length > 0).length

  // Filtered drivers
  const visibleDrivers = useMemo(() => {
    return driversList.filter((driver) => {
      if (tabFilter === 'Verified' && !(driver.isVerifiedDriver || driver.applicationStatus === 'approved')) return false
      if (tabFilter === 'Pending' && driver.applicationStatus !== 'pending') return false
      if (tabFilter === 'Active Routes' && driver.routes.length === 0) return false
      if (tabFilter === 'AC' && !driver.vehicle?.hasAc) return false

      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        driver.name.toLowerCase().includes(q) ||
        driver.phone.toLowerCase().includes(q) ||
        driver.email.toLowerCase().includes(q) ||
        driver.city.toLowerCase().includes(q) ||
        driver.cnicNumber.toLowerCase().includes(q) ||
        (driver.vehicle?.plate && driver.vehicle.plate.toLowerCase().includes(q)) ||
        (driver.vehicle?.make && driver.vehicle.make.toLowerCase().includes(q)) ||
        (driver.vehicle?.model && driver.vehicle.model.toLowerCase().includes(q))
      )
    })
  }, [driversList, tabFilter, search])

  // Handlers
  const handleToggleVerification = async (driver: DriverRecord) => {
    const newStatus = !driver.isVerifiedDriver
    const confirmMsg = newStatus
      ? `Verify ${driver.name} as an official MYWAY driver?`
      : `Revoke driver verification status for ${driver.name}?`

    if (!confirm(confirmMsg)) return

    setProcessingId(driver.id)
    try {
      await toggleDriverVerification(driver.id, newStatus)
      setDriversList((prev) =>
        prev.map((d) => (d.id === driver.id ? { ...d, isVerifiedDriver: newStatus } : d))
      )
      if (selectedDriver?.id === driver.id) {
        setSelectedDriver((prev) => (prev ? { ...prev, isVerifiedDriver: newStatus } : null))
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update driver status')
    } finally {
      setProcessingId(null)
    }
  }

  const handleApproveApplication = async (driver: DriverRecord) => {
    if (!driver.applicationId) return
    if (!confirm(`Approve driver application for ${driver.name}?`)) return

    setProcessingId(driver.id)
    try {
      await approveDriverApplication(driver.applicationId, driver.id, driver.vehicle?.id)
      setDriversList((prev) =>
        prev.map((d) =>
          d.id === driver.id ? { ...d, isVerifiedDriver: true, applicationStatus: 'approved' } : d
        )
      )
      if (selectedDriver?.id === driver.id) {
        setSelectedDriver((prev) =>
          prev ? { ...prev, isVerifiedDriver: true, applicationStatus: 'approved' } : null
        )
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve application')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectApplication = async (driver: DriverRecord) => {
    if (!driver.applicationId) return
    const reason = prompt(`Enter rejection reason for ${driver.name}:`, 'Documents incomplete or unverified')
    if (reason === null) return

    setProcessingId(driver.id)
    try {
      await rejectDriverApplication(driver.applicationId, driver.id, reason)
      setDriversList((prev) =>
        prev.map((d) =>
          d.id === driver.id ? { ...d, isVerifiedDriver: false, applicationStatus: 'rejected', rejectionReason: reason } : d
        )
      )
      if (selectedDriver?.id === driver.id) {
        setSelectedDriver((prev) =>
          prev ? { ...prev, isVerifiedDriver: false, applicationStatus: 'rejected', rejectionReason: reason } : null
        )
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reject application')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeleteDriver = async (driver: DriverRecord) => {
    if (!confirm(`Are you sure you want to permanently delete driver ${driver.name}? This will cascade delete their vehicles, routes, and applications.`)) {
      return
    }
    setProcessingId(driver.id)
    try {
      await deleteDriverAccount(driver.id)
      setDriversList((prev) => prev.filter((d) => d.id !== driver.id))
      setSelectedDriver(null)
    } catch (err: any) {
      alert(err.message || 'Failed to delete driver account')
    } finally {
      setProcessingId(null)
    }
  }

  const exportCSV = () => {
    const headers = [
      'Driver ID',
      'Name',
      'Phone',
      'Email',
      'City',
      'CNIC',
      'License Number',
      'License Expiry',
      'Verified Driver',
      'Application Status',
      'Vehicle Make',
      'Vehicle Model',
      'Vehicle Plate',
      'Vehicle Year',
      'AC Equipped',
      'Active Routes',
      'Joined Date',
    ]

    const rows = visibleDrivers.map((d) => [
      d.id,
      `"${d.name.replace(/"/g, '""')}"`,
      d.phone,
      d.email,
      `"${d.city.replace(/"/g, '""')}"`,
      d.cnicNumber,
      d.licenseNumber,
      d.licenseExpiry,
      d.isVerifiedDriver ? 'Yes' : 'No',
      d.applicationStatus,
      d.vehicle?.make || 'N/A',
      d.vehicle?.model || 'N/A',
      d.vehicle?.plate || 'N/A',
      d.vehicle?.year || 'N/A',
      d.vehicle?.hasAc ? 'Yes' : 'No',
      d.routes.length,
      `"${d.registeredAt}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `myway_drivers_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text)
    alert(`Copied ${label}: ${text}`)
  }

  return (
    <>
      <Header
        title="Drivers"
        description="Inspect registered driver accounts, vehicle assignments, driving licenses and active route schedules."
        actions={
          <Button variant="secondary" onClick={exportCSV}>
            <Icon name="download" /> Export CSV
          </Button>
        }
      />

      {/* Inline Statistics Bar */}
      <section className="inline-stats">
        <div>
          <span>Total Drivers</span>
          <strong>{totalCount}</strong>
        </div>
        <div>
          <span>Verified Active</span>
          <strong>{verifiedCount}</strong>
        </div>
        <div>
          <span>Pending Review</span>
          <strong>{pendingCount}</strong>
        </div>
        <div>
          <span>Active on Routes</span>
          <strong>{activeRoutesCount}</strong>
        </div>
      </section>

      {/* Main Panel */}
      <section className="panel">
        <div className="toolbar">
          <label className="search-box">
            <Icon name="search" />
            <input
              placeholder="Search driver name, phone, plate, make, model, CNIC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="filters">
            {(['All', 'Verified', 'Pending', 'Active Routes', 'AC'] as const).map((filter) => (
              <button
                key={filter}
                className={`filter ${tabFilter === filter ? 'active' : ''}`}
                onClick={() => setTabFilter(filter)}
                type="button"
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Drivers List */}
        <div className="driver-list-container">
          {visibleDrivers.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '15px' }}>
              No drivers match your current filter or search criteria.
            </div>
          ) : (
            visibleDrivers.map((driver, index) => {
              const vehicleDisplay = driver.vehicle
                ? `${driver.vehicle.make} ${driver.vehicle.model}`
                : 'No Vehicle Assigned'

              return (
                <button
                  key={driver.id}
                  className="driver-row-card"
                  onClick={() => setSelectedDriver(driver)}
                  type="button"
                >
                  <div className="driver-profile-info">
                    <div className="driver-avatar-wrapper">
                      {driver.avatar ? (
                        <img src={driver.avatar} alt={driver.name} />
                      ) : (
                        <div
                          className="avatar-initial"
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#ede9fe',
                            color: '#6d28d9',
                            display: 'grid',
                            placeItems: 'center',
                            fontWeight: 700,
                            fontSize: '15px',
                          }}
                        >
                          {(driver.name?.[0] || 'D').toUpperCase()}
                        </div>
                      )}
                      {driver.isVerifiedDriver && <span className="verified-badge-dot" title="Verified Driver" />}
                    </div>
                    <div className="driver-name-block">
                      <b>{driver.name}</b>
                      <small>{driver.phone} · {driver.city}</small>
                    </div>
                  </div>

                  <div className="driver-vehicle-chip">
                    <Icon name="car" size={16} />
                    <div>
                      <b>{vehicleDisplay}</b>
                      <small>{driver.vehicle?.plate ? `Plate: ${driver.vehicle.plate}` : 'Unregistered'}</small>
                    </div>
                  </div>

                  <div className="driver-routes-stat">
                    <span>
                      <Icon name="route" size={14} />
                      {driver.routes.length} {driver.routes.length === 1 ? 'Route' : 'Routes'}
                    </span>
                  </div>

                  <div className="driver-badge-group">
                    {driver.vehicle?.hasAc && (
                      <Badge tone="blue">AC</Badge>
                    )}
                    {driver.isVerifiedDriver ? (
                      <Badge tone="green">Verified Driver</Badge>
                    ) : driver.applicationStatus === 'pending' ? (
                      <Badge tone="amber">Pending Review</Badge>
                    ) : driver.applicationStatus === 'rejected' ? (
                      <Badge tone="red">Rejected</Badge>
                    ) : (
                      <Badge tone="neutral">Unverified</Badge>
                    )}
                  </div>

                  <Icon name="chevron" size={18} />
                </button>
              )
            })
          )}
        </div>
      </section>

      {/* Driver Full Details Modal */}
      {selectedDriver && (
        <DriverSpecModal
          driver={selectedDriver}
          onClose={() => setSelectedDriver(null)}
          onToggleVerification={() => handleToggleVerification(selectedDriver)}
          onApprove={() => handleApproveApplication(selectedDriver)}
          onReject={() => handleRejectApplication(selectedDriver)}
          onDelete={() => handleDeleteDriver(selectedDriver)}
          isProcessing={processingId === selectedDriver.id}
          onOpenDoc={(doc) => setActiveLightboxDoc(doc)}
          onCopy={copyToClipboard}
        />
      )}

      {/* Document Lightbox Previewer */}
      {activeLightboxDoc && (
        <div
          className="document-lightbox"
          onClick={(e) => {
            e.stopPropagation()
            setActiveLightboxDoc(null)
          }}
        >
          <button className="lightbox-close" onClick={() => setActiveLightboxDoc(null)} type="button">
            <Icon name="close" size={20} />
          </button>
          {activeLightboxDoc.url ? (
            <div
              style={{
                maxWidth: '92vw',
                maxHeight: '88vh',
                background: '#0f172a',
                padding: '16px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h4 style={{ color: '#fff', margin: 0, fontSize: '15px', fontWeight: 700 }}>
                {activeLightboxDoc.title}
              </h4>
              <img
                src={activeLightboxDoc.url}
                alt={activeLightboxDoc.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '78vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                }}
              />
            </div>
          ) : (
            <div
              className="document-paper large"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="document-government">
                <span>GOVERNMENT OF PAKISTAN</span>
                <b>{activeLightboxDoc.title.toUpperCase()}</b>
                <small>NATIONAL HIGHWAY & MOTORWAY POLICE / EXCISE & TAXATION</small>
              </div>
              <div className="document-watermark">
                <Icon name="shield" size={100} />
              </div>
              <div className="large-document-grid">
                <div className="vehicle-info-row">
                  <span>Document Title</span>
                  <strong>{activeLightboxDoc.title}</strong>
                </div>
                <div className="vehicle-info-row">
                  <span>Registered Owner</span>
                  <strong>{activeLightboxDoc.owner || selectedDriver?.name || 'Driver'}</strong>
                </div>
                {activeLightboxDoc.plate && (
                  <div className="vehicle-info-row">
                    <span>License / Plate</span>
                    <strong>{activeLightboxDoc.plate}</strong>
                  </div>
                )}
                <div className="vehicle-info-row">
                  <span>Status</span>
                  <strong style={{ color: '#64748b' }}>Document file not uploaded</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

function DriverSpecModal({
  driver,
  onClose,
  onToggleVerification,
  onApprove,
  onReject,
  onDelete,
  isProcessing,
  onOpenDoc,
  onCopy,
}: {
  driver: DriverRecord
  onClose: () => void
  onToggleVerification: () => void
  onApprove: () => void
  onReject: () => void
  onDelete: () => void
  isProcessing: boolean
  onOpenDoc: (doc: { title: string; url: string | null; type: 'image' | 'paper'; plate?: string; owner?: string }) => void
  onCopy: (text: string, label: string) => void
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicle' | 'documents' | 'routes'>('overview')

  return (
    <div className="driver-modal-backdrop" onClick={onClose}>
      <section
        className="driver-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${driver.name} driver details`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Sticky Header */}
        <header className="driver-modal-header">
          <div>
            <span>DRIVER SPECIFICATION SHEET & ACCOUNT PROFILE</span>
            <h2>{driver.name}</h2>
            <div className="vehicle-id">
              <b>UUID: {driver.id}</b>
              <button onClick={() => onCopy(driver.id, 'Driver UUID')} type="button">Copy</button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="delete-vehicle"
              onClick={onDelete}
              disabled={isProcessing}
              type="button"
              title="Permanently remove driver"
            >
              <Icon name="alert" size={16} /> {isProcessing ? 'Working...' : 'Delete'}
            </button>
            <button className="fleet-close" onClick={onClose} aria-label="Close modal" type="button">
              <Icon name="close" size={18} />
            </button>
          </div>
        </header>

        {/* Driver Hero Banner */}
        <div className="applicant-banner">
          {driver.avatar ? (
            <img src={driver.avatar} alt={driver.name} />
          ) : (
            <div
              className="avatar-initial"
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: '#ede9fe',
                color: '#6d28d9',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 800,
                fontSize: '18px',
                flexShrink: 0,
              }}
            >
              {(driver.name?.[0] || 'D').toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3>{driver.name}</h3>
              {driver.isVerifiedDriver ? (
                <Badge tone="green">Verified Driver</Badge>
              ) : driver.applicationStatus === 'pending' ? (
                <Badge tone="amber">Pending Application</Badge>
              ) : driver.applicationStatus === 'rejected' ? (
                <Badge tone="red">Rejected</Badge>
              ) : (
                <Badge tone="neutral">Unverified</Badge>
              )}
            </div>
            <p>
              {driver.phone} · {driver.email} · {driver.city}
            </p>
            <small>Joined platform: {driver.registeredAt}</small>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
            <span className="application-id">
              {driver.isVerifiedDriver ? 'ACTIVE DRIVER' : 'DRIVER APPLICANT'}
            </span>
            <button
              onClick={onToggleVerification}
              disabled={isProcessing}
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '6px 12px',
                borderRadius: '7px',
                border: '1px solid',
                cursor: 'pointer',
                background: driver.isVerifiedDriver ? '#fff1f1' : '#effaf6',
                borderColor: driver.isVerifiedDriver ? '#fcdada' : '#c3ecdf',
                color: driver.isVerifiedDriver ? '#c83b42' : '#147d59',
              }}
              type="button"
            >
              {driver.isVerifiedDriver ? 'Revoke Driver Status' : 'Mark as Verified Driver'}
            </button>
          </div>
        </div>

        {/* Modal Navigation Sub-tabs */}
        <div className="modal-subtabs">
          <button
            className={`subtab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            type="button"
          >
            <Icon name="users" size={16} /> Overview & Specs
          </button>
          <button
            className={`subtab ${activeTab === 'vehicle' ? 'active' : ''}`}
            onClick={() => setActiveTab('vehicle')}
            type="button"
          >
            <Icon name="car" size={16} /> Fleet Vehicle
          </button>
          <button
            className={`subtab ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
            type="button"
          >
            <Icon name="check" size={16} /> Legal Documents
          </button>
          <button
            className={`subtab ${activeTab === 'routes' ? 'active' : ''}`}
            onClick={() => setActiveTab('routes')}
            type="button"
          >
            <Icon name="route" size={16} /> Routes ({driver.routes.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="review-content">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              {/* Vehicle Showcase Card */}
              <div className="vehicle-showcase">
                {driver.vehicle?.vehicleImage ? (
                  <img
                    src={driver.vehicle.vehicleImage}
                    alt={driver.vehicle ? `${driver.vehicle.make} ${driver.vehicle.model}` : 'Vehicle'}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      color: '#94a3b8',
                    }}
                  >
                    <Icon name="car" size={42} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>
                      Vehicle photo not uploaded
                    </span>
                  </div>
                )}
                <div className="vehicle-overlay">
                  <span>OFFICIAL DRIVER SPEC SHEET</span>
                  <h3>{driver.vehicle ? `${driver.vehicle.make} ${driver.vehicle.model}` : 'Unregistered Vehicle'}</h3>
                  <p>
                    {driver.vehicle?.year ? `${driver.vehicle.year} Model` : 'Model year unrecorded'} ·{' '}
                    {driver.vehicle?.color || 'Color unrecorded'} · {driver.vehicle?.plate || 'Plate unassigned'} ·{' '}
                    {driver.vehicle?.hasAc ? 'Air Conditioned' : 'Standard Comfort'}
                  </p>
                </div>
                <div className="photo-count">
                  <Icon name="car" size={14} />{' '}
                  {driver.vehicle?.vehicleImage ? 'Driver Vehicle Photo' : 'Image not uploaded'}
                </div>
              </div>

              {/* Quick Spec Grid */}
              <div className="vehicle-spec-grid" style={{ marginTop: '14px' }}>
                <div className="spec-card">
                  <span className="spec-icon"><Icon name="shield" /></span>
                  <div>
                    <span>Driver Status</span>
                    <strong>{driver.isVerifiedDriver ? 'Verified Driver' : 'Standard Account'}</strong>
                    <p>{driver.applicationStatus.toUpperCase()}</p>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon"><Icon name="route" /></span>
                  <div>
                    <span>Published Routes</span>
                    <strong>{driver.routes.length} Active</strong>
                    <p>Total daily commutes</p>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon"><Icon name="car" /></span>
                  <div>
                    <span>Vehicle Class</span>
                    <strong>{driver.vehicle?.make || 'Passenger Car'}</strong>
                    <p>{driver.vehicle?.seats || 4} Seats Capacity</p>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon"><Icon name="match" /></span>
                  <div>
                    <span>Passenger Matches</span>
                    <strong>{driver.matchesCount} Pairings</strong>
                    <p>Calculated compatibility</p>
                  </div>
                </div>
              </div>

              {/* Identity & Legal Information */}
              <section className="review-section">
                <div className="review-section-heading">
                  <span><Icon name="users" /></span>
                  <div>
                    <h3>Driver Personal & Identity Details</h3>
                    <p>NADRA verification and contact records</p>
                  </div>
                  <Badge tone={driver.cnicVerified ? 'green' : 'amber'}>
                    {driver.cnicVerified ? 'CNIC Verified' : 'Unverified CNIC'}
                  </Badge>
                </div>
                <div className="review-grid">
                  <div className="review-field">
                    <span>Full Legal Name</span>
                    <strong>{driver.name}</strong>
                  </div>
                  <div className="review-field">
                    <span>Phone Number</span>
                    <strong>{driver.phone}</strong>
                  </div>
                  <div className="review-field">
                    <span>Email Address</span>
                    <strong>{driver.email}</strong>
                  </div>
                  <div className="review-field">
                    <span>CNIC Number</span>
                    <strong>{driver.cnicNumber}</strong>
                  </div>
                  <div className="review-field">
                    <span>Father / Guardian Name</span>
                    <strong>{driver.fatherName || 'On verification record'}</strong>
                  </div>
                  <div className="review-field">
                    <span>Date of Birth</span>
                    <strong>{driver.dob || 'Record on file'}</strong>
                  </div>
                  <div className="review-field wide">
                    <span>Physical Residential Address</span>
                    <strong>{driver.address || driver.city}</strong>
                  </div>
                </div>
              </section>

              {/* Driving License Information */}
              <section className="review-section">
                <div className="review-section-heading">
                  <span><Icon name="shield" /></span>
                  <div>
                    <h3>Driving License & Authorization</h3>
                    <p>Government of Pakistan Driving License Registry</p>
                  </div>
                </div>
                <div className="review-grid">
                  <div className="review-field">
                    <span>License Number</span>
                    <strong>{driver.licenseNumber}</strong>
                  </div>
                  <div className="review-field">
                    <span>License Expiry</span>
                    <strong>{driver.licenseExpiry}</strong>
                  </div>
                  <div className="review-field">
                    <span>Issuing Authority</span>
                    <strong>National Highway & Motorway Police / Traffic Police</strong>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* TAB 2: VEHICLE DETAILS */}
          {activeTab === 'vehicle' && (
            <>
              {driver.vehicle ? (
                <section className="registration-section" style={{ marginTop: 0 }}>
                  <div className="fleet-section-title">
                    <span><Icon name="car" /></span>
                    <div>
                      <h3>{driver.vehicle.make} {driver.vehicle.model} ({driver.vehicle.year})</h3>
                      <p>Excise, Taxation & Narcotics Control registration record</p>
                    </div>
                    <Badge tone={driver.vehicle.isActive ? 'green' : 'amber'}>
                      {driver.vehicle.isActive ? 'Active on Fleet' : 'Pending Approval'}
                    </Badge>
                  </div>

                  <div className="vehicle-spec-grid" style={{ marginTop: '14px' }}>
                    <div className="spec-card">
                      <span className="spec-icon"><Icon name="route" /></span>
                      <div>
                        <span>Registration Plate</span>
                        <strong className="plate-value">{driver.vehicle.plate}</strong>
                        <p>Verified government plate</p>
                      </div>
                    </div>
                    <div className="spec-card">
                      <span className="spec-icon"><Icon name="car" /></span>
                      <div>
                        <span>Make & Model</span>
                        <strong>{driver.vehicle.make} {driver.vehicle.model}</strong>
                        <p>{driver.vehicle.year} Model</p>
                      </div>
                    </div>
                    <div className="spec-card">
                      <span className="spec-icon"><Icon name="users" /></span>
                      <div>
                        <span>Passenger Capacity</span>
                        <strong>{driver.vehicle.seats} Seats</strong>
                        <p>Color: {driver.vehicle.color}</p>
                      </div>
                    </div>
                    <div className="spec-card">
                      <span className="spec-icon"><Icon name="shield" /></span>
                      <div>
                        <span>Comfort Category</span>
                        <strong>{driver.vehicle.hasAc ? 'Air Conditioned' : 'Standard'}</strong>
                        <p>Comfort Level</p>
                      </div>
                    </div>
                  </div>

                  <div className="registration-layout" style={{ marginTop: '16px' }}>
                    <button
                      className="registration-document"
                      onClick={() =>
                        onOpenDoc({
                          title: `Vehicle Registration Certificate (${driver.vehicle?.plate})`,
                          url: driver.vehicle?.signedDocUrl || null,
                          type: driver.vehicle?.signedDocUrl ? 'image' : 'paper',
                          plate: driver.vehicle?.plate,
                          owner: driver.name,
                        })
                      }
                      type="button"
                    >
                      {driver.vehicle.signedDocUrl ? (
                        <img
                          src={driver.vehicle.signedDocUrl}
                          alt="Registration Certificate"
                          style={{ width: '100%', height: '190px', objectFit: 'cover', borderRadius: '5px' }}
                        />
                      ) : (
                        <div className="document-paper">
                          <div className="document-government">
                            <span>GOVERNMENT OF PAKISTAN</span>
                            <b>VEHICLE REGISTRATION CERTIFICATE</b>
                            <small>EXCISE, TAXATION & NARCOTICS CONTROL</small>
                          </div>
                          <div className="document-watermark">
                            <Icon name="shield" size={48} />
                          </div>
                          <div className="document-lines"><i /><i /><i /><i /></div>
                          <strong>{driver.vehicle.plate}</strong>
                        </div>
                      )}
                      <span className="document-hover">
                        <Icon name="search" size={14} /> Click to enlarge
                      </span>
                    </button>

                    <div className="registration-copy">
                      <span>OFFICIAL FLEET REGISTRATION</span>
                      <h3>Vehicle Registration Certificate</h3>
                      <p>Inspect chassis, registration proof, and vehicle documents before approving driver trips.</p>
                      <div className="document-details">
                        <div className="vehicle-info-row">
                          <span>Assigned Plate</span>
                          <strong>{driver.vehicle.plate}</strong>
                        </div>
                        <div className="vehicle-info-row">
                          <span>Registered Owner</span>
                          <strong>{driver.name}</strong>
                        </div>
                        <div className="vehicle-info-row">
                          <span>Driver Phone</span>
                          <strong>{driver.phone}</strong>
                        </div>
                        <div className="vehicle-info-row">
                          <span>Vehicle ID</span>
                          <strong className="mono">{driver.vehicle.id}</strong>
                        </div>
                      </div>
                      <button
                        className="resolution-button"
                        onClick={() =>
                          onOpenDoc({
                            title: `Vehicle Registration Certificate (${driver.vehicle?.plate})`,
                            url: driver.vehicle?.signedDocUrl || null,
                            type: driver.vehicle?.signedDocUrl ? 'image' : 'paper',
                            plate: driver.vehicle?.plate,
                            owner: driver.name,
                          })
                        }
                        type="button"
                      >
                        Inspect full resolution <Icon name="arrow" size={14} />
                      </button>
                    </div>
                  </div>
                </section>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <Icon name="car" size={36} />
                  <h3 style={{ marginTop: '12px', color: '#1e293b', fontWeight: 700 }}>No Vehicle Assigned</h3>
                  <p style={{ color: '#64748b', fontSize: '13px' }}>This driver has not registered a vehicle profile yet.</p>
                </div>
              )}
            </>
          )}

          {/* TAB 3: LEGAL DOCUMENTS */}
          {activeTab === 'documents' && (
            <section className="review-section" style={{ marginTop: 0 }}>
              <div className="review-section-heading">
                <span><Icon name="check" /></span>
                <div>
                  <h3>Submitted Legal Documents & Verification Files</h3>
                  <p>Click any document card to view high-resolution scan</p>
                </div>
              </div>

              <div className="document-grid">
                {/* Driver License Document */}
                <button
                  className="document-card"
                  onClick={() =>
                    onOpenDoc({
                      title: 'Driving License Document',
                      url: driver.licenseSignedUrl || null,
                      type: driver.licenseSignedUrl ? 'image' : 'paper',
                      plate: driver.licenseNumber,
                      owner: driver.name,
                    })
                  }
                  type="button"
                >
                  <div className="document-preview violet">
                    <span>LICENSE</span>
                    <Icon name="car" size={18} />
                    <b>{driver.licenseNumber}</b>
                  </div>
                  <span>
                    <b>Driving License Document</b>
                    <small>Expires: {driver.licenseExpiry}</small>
                  </span>
                  <Icon name="eye" size={16} />
                </button>

                {/* Vehicle Registration Certificate */}
                <button
                  className="document-card"
                  onClick={() =>
                    onOpenDoc({
                      title: 'Vehicle Registration Certificate',
                      url: driver.registrationSignedUrl || driver.vehicle?.signedDocUrl || null,
                      type: driver.registrationSignedUrl || driver.vehicle?.signedDocUrl ? 'image' : 'paper',
                      plate: driver.vehicle?.plate || 'REG-DOC',
                      owner: driver.name,
                    })
                  }
                  type="button"
                >
                  <div className="document-preview slate">
                    <span>REGISTRATION</span>
                    <Icon name="shield" size={18} />
                    <b>{driver.vehicle?.plate || 'EXCISE-DOC'}</b>
                  </div>
                  <span>
                    <b>Vehicle Registration Proof</b>
                    <small>Official Excise Document</small>
                  </span>
                  <Icon name="eye" size={16} />
                </button>

                {/* CNIC Front */}
                <button
                  className="document-card"
                  onClick={() =>
                    onOpenDoc({
                      title: 'CNIC Front Scan',
                      url: driver.cnicFrontSignedUrl || null,
                      type: driver.cnicFrontSignedUrl ? 'image' : 'paper',
                      plate: driver.cnicNumber,
                      owner: driver.name,
                    })
                  }
                  type="button"
                >
                  <div className="document-preview blue">
                    <span>CNIC FRONT</span>
                    <Icon name="users" size={18} />
                    <b>{driver.cnicNumber}</b>
                  </div>
                  <span>
                    <b>National ID Card (Front)</b>
                    <small>NADRA verification scan</small>
                  </span>
                  <Icon name="eye" size={16} />
                </button>

                {/* CNIC Back */}
                <button
                  className="document-card"
                  onClick={() =>
                    onOpenDoc({
                      title: 'CNIC Back Scan',
                      url: driver.cnicBackSignedUrl || null,
                      type: driver.cnicBackSignedUrl ? 'image' : 'paper',
                      plate: driver.cnicNumber,
                      owner: driver.name,
                    })
                  }
                  type="button"
                >
                  <div className="document-preview blue">
                    <span>CNIC BACK</span>
                    <Icon name="users" size={18} />
                    <b>{driver.cnicNumber}</b>
                  </div>
                  <span>
                    <b>National ID Card (Back)</b>
                    <small>Address and family record</small>
                  </span>
                  <Icon name="eye" size={16} />
                </button>

                {/* Driver Live Selfie */}
                {driver.selfieSignedUrl && (
                  <button
                    className="document-card"
                    onClick={() =>
                      onOpenDoc({
                        title: 'Live Selfie & Face Verification',
                        url: driver.selfieSignedUrl || null,
                        type: 'image',
                        owner: driver.name,
                      })
                    }
                    type="button"
                  >
                    <div className="document-preview green">
                      <span>SELFIE</span>
                      <Icon name="users" size={18} />
                      <b>VERIFIED</b>
                    </div>
                    <span>
                      <b>Driver Live Verification Selfie</b>
                      <small>Real-time liveness proof</small>
                    </span>
                    <Icon name="eye" size={16} />
                  </button>
                )}
              </div>
            </section>
          )}

          {/* TAB 4: PUBLISHED ROUTES */}
          {activeTab === 'routes' && (
            <section className="review-section" style={{ marginTop: 0 }}>
              <div className="review-section-heading">
                <span><Icon name="route" /></span>
                <div>
                  <h3>Published Driver Routes & Schedules</h3>
                  <p>Daily recurring passenger commute listings</p>
                </div>
                <Badge tone="blue">{driver.routes.length} Active Routes</Badge>
              </div>

              {driver.routes.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  No published routes found for this driver.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                  {driver.routes.map((route) => (
                    <div
                      key={route.id}
                      style={{
                        padding: '16px',
                        background: '#fafbfc',
                        border: '1px solid #e5e7eb',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#6366f1', fontWeight: 700 }}>
                          ROUTE ID: {route.id}
                        </span>
                        <Badge tone={route.isActive ? 'green' : 'neutral'}>
                          {route.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div className="route-path-mini" style={{ padding: '8px 0' }}>
                        <span>
                          <i className="origin-dot" /> {route.origin}
                        </span>
                        <em />
                        <span>
                          <i className="destination-dot" /> {route.destination}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#475569' }}>
                        <div>
                          <strong>Departure:</strong> {route.departure} &nbsp;|&nbsp; <strong>Seats:</strong> {route.seats}
                        </div>
                        <div style={{ fontWeight: 700, color: '#10b981' }}>
                          {route.monthlyCost}
                        </div>
                      </div>

                      <div className="day-list" style={{ marginTop: '4px' }}>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                          <span
                            key={day}
                            className={route.days?.includes(day) ? 'active' : ''}
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Pending Application Review Actions */}
          {driver.applicationStatus === 'pending' && (
            <div
              style={{
                marginTop: '16px',
                padding: '16px 20px',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <b style={{ color: '#92400e', fontSize: '13px' }}>Pending Driver Application Decision</b>
                <p style={{ margin: '2px 0 0', color: '#b45309', fontSize: '11px' }}>
                  Review submitted license, documents and vehicle specs before taking action.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="secondary" onClick={onReject} disabled={isProcessing}>
                  Reject Application
                </Button>
                <Button variant="primary" onClick={onApprove} disabled={isProcessing}>
                  Approve Application
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Sticky Footer */}
        <footer className="driver-modal-footer">
          <p>
            <Icon name="shield" size={16} /> Driver record verified by MYWAY Admin Portal.
          </p>
          <div>
            <Button variant="secondary" onClick={onClose}>
              Close Driver Sheet
            </Button>
          </div>
        </footer>
      </section>
    </div>
  )
}
