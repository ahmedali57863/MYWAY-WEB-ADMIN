'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  approveIdentityVerification,
  rejectIdentityVerification,
  approveDriverApplication,
  rejectDriverApplication,
} from './actions'
import { Badge, Button, Header, Icon } from '@/components/ui/FigmaUI'

export type DriverApplication = {
  id: string
  name: string
  email: string
  phone: string
  time: string
  cnic: string
  city: string
  address: string
  avatar: string
  license: string
  licenseExpiry: string
  vehicle: string
  registration: string
  color: string
  year: string
  seats: number
  airConditioned: boolean
  vehicleImage: string
  status?: string
  rejectionReason?: string
  // Backend linkage fields
  backendId?: string
  isIdentityOnly?: boolean
  cnicFrontUrl?: string | null
  cnicBackUrl?: string | null
  licenseUrl?: string | null
  registrationUrl?: string | null
}

function resolveRealCnic(rawCnic: string | null | undefined): string {
  if (rawCnic && rawCnic.trim().length > 0) {
    return rawCnic.trim()
  }
  return 'Not provided'
}

function mapToDriverApp(app: any, index: number, isIdentity = false): DriverApplication {
  if (isIdentity) {
    const cnicVal = resolveRealCnic(
      app.cnic_number || app.cnic || app.profiles?.cnic_number || app.profiles?.cnic
    )
    return {
      id: `ID-${app.id.slice(0, 5).toUpperCase()}`,
      name: app.full_name || app.profiles?.full_name || 'Identity Applicant',
      email: app.profiles?.email || 'user@myway.pk',
      phone: app.profiles?.phone || app.phone || '+92 300 0000000',
      time: formatRelativeTime(app.submitted_at),
      cnic: cnicVal,
      city: app.city || 'National',
      address: app.physical_address || 'Pakistan',
      avatar: app.selfie_signed_url || app.profiles?.avatar_url || '',
      license: 'N/A',
      licenseExpiry: 'N/A',
      vehicle: 'Identity Verification (Tier ' + (app.tier || '1') + ')',
      registration: 'CNIC Verified',
      color: 'N/A',
      year: '2024',
      seats: 1,
      airConditioned: false,
      vehicleImage: '',
      status: app.status || 'pending',
      rejectionReason: app.rejection_reason,
      backendId: app.id,
      isIdentityOnly: true,
      cnicFrontUrl: app.cnic_front_signed_url,
      cnicBackUrl: app.cnic_back_signed_url,
    }
  }

  const chosenVehicleImage =
    app.vehicle_photo_signed_url ||
    app.registration_signed_url ||
    app.vehicles?.registration_doc_url ||
    app.vehicles?.photo_url ||
    app.vehicles?.vehicle_photo_url ||
    app.vehicles?.image_url ||
    ''

  const driverCnic = resolveRealCnic(
    app.cnic_number || app.cnic || app.profiles?.cnic_number || app.profiles?.cnic
  )

  return {
    id: `DA-${app.id.slice(0, 5).toUpperCase()}`,
    name: app.profiles?.full_name || 'Driver Applicant',
    email: app.profiles?.email || 'driver@myway.pk',
    phone: app.profiles?.phone || '+92 300 0000000',
    time: formatRelativeTime(app.submitted_at || app.created_at || app.reviewed_at),
    cnic: driverCnic,
    city: app.city || 'Islamabad / Rawalpindi',
    address: app.address || 'Address provided on application file',
    avatar: app.profiles?.avatar_url || '',
    license: app.license_number || `ICT-2023-${app.id.slice(0, 4)}`,
    licenseExpiry: app.license_expiry || '18 September 2027',
    vehicle: app.vehicles ? `${app.vehicles.brand} ${app.vehicles.variant || ''}`.trim() : 'Registered Vehicle',
    registration: app.vehicles?.reg_number || 'ICT-0000',
    color: app.vehicles?.color || 'White',
    year: app.vehicles?.model_year ? String(app.vehicles.model_year) : '2022',
    seats: app.vehicles?.capacity || 4,
    airConditioned: Boolean(app.vehicles?.has_ac),
    vehicleImage: chosenVehicleImage,
    status: app.status || 'pending',
    rejectionReason: app.rejection_reason,
    backendId: app.id,
    isIdentityOnly: false,
    cnicFrontUrl: app.cnic_front_signed_url,
    cnicBackUrl: app.cnic_back_signed_url,
    licenseUrl: app.license_signed_url,
    registrationUrl: app.registration_signed_url,
  }
}

export default function PendingApprovalsClient({
  verifications = [],
  driverApplications = [],
  approvedDriverApplications = [],
  rejectedDriverApplications = []
}: {
  verifications: any[]
  driverApplications: any[]
  approvedDriverApplications?: any[]
  rejectedDriverApplications?: any[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'Pending applications' | 'Approved drivers' | 'Rejected'>('Pending applications')
  const [selected, setSelected] = useState<DriverApplication | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectingItem, setRejectingItem] = useState<DriverApplication | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [lightboxImage, setLightboxImage] = useState<{ title: string; url: string } | null>(null)

  // Local state initialized from props
  const [pendingList, setPendingList] = useState<DriverApplication[]>([])
  const [approvedList, setApprovedList] = useState<DriverApplication[]>([])
  const [rejectedList, setRejectedList] = useState<DriverApplication[]>([])

  useEffect(() => {
    const mappedPending: DriverApplication[] = [
      ...driverApplications.map((app, i) => mapToDriverApp(app, i, false)),
      ...verifications.map((v, i) => mapToDriverApp(v, i, true))
    ]
    const mappedApproved: DriverApplication[] = approvedDriverApplications.map((app, i) => mapToDriverApp(app, i, false))
    const mappedRejected: DriverApplication[] = rejectedDriverApplications.map((app, i) => mapToDriverApp(app, i, false))

    setPendingList(mappedPending)
    setApprovedList(mappedApproved)
    setRejectedList(mappedRejected)
  }, [driverApplications, verifications, approvedDriverApplications, rejectedDriverApplications])

  const pendingCount = pendingList.length
  const approvedCount = approvedList.length
  const rejectedCount = rejectedList.length

  const handleApprove = async (app: DriverApplication) => {
    if (!app.backendId) {
      setSelected(null)
      return
    }
    setProcessingId(app.id)
    try {
      if (app.isIdentityOnly) {
        await approveIdentityVerification(app.backendId)
      } else {
        await approveDriverApplication(app.backendId)
      }
      
      // Move from pending to approved locally
      setPendingList((prev) => prev.filter((p) => p.id !== app.id))
      setApprovedList((prev) => [{ ...app, status: 'approved' }, ...prev])
      setSelected(null)
      router.refresh()
    } catch (e: any) {
      alert(e.message || 'Error approving application')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectSubmit = async () => {
    if (!rejectingItem) return
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection.')
      return
    }

    setProcessingId(rejectingItem.id)
    try {
      if (rejectingItem.backendId) {
        if (rejectingItem.isIdentityOnly) {
          await rejectIdentityVerification(rejectingItem.backendId, rejectReason.trim())
        } else {
          await rejectDriverApplication(rejectingItem.backendId, rejectReason.trim())
        }
      }

      const rejectedEntry = { ...rejectingItem, status: 'rejected', rejectionReason: rejectReason.trim() }
      setPendingList((prev) => prev.filter((p) => p.id !== rejectingItem.id))
      setRejectedList((prev) => [rejectedEntry, ...prev])
      setRejectingItem(null)
      setSelected(null)
      setRejectReason('')
      router.refresh()
    } catch (e: any) {
      alert(e.message || 'Error rejecting application')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <>
      <Header 
        title="Driver approvals" 
        description="Review driver identity, license and vehicle applications before granting platform access."
      />

      <div className="tabs">
        {(["Pending applications", "Approved drivers", "Rejected"] as const).map((t) => (
          <button 
            key={t} 
            className={tab === t ? "active" : ""} 
            onClick={() => setTab(t)}
          >
            {t}
            <span>{t === "Pending applications" ? pendingCount : t === "Approved drivers" ? approvedCount : rejectedCount}</span>
          </button>
        ))}
      </div>

      <section className="approval-list">
        {/* 1. Pending Tab */}
        {tab === "Pending applications" && (
          pendingCount > 0 ? (
            pendingList.map((item) => (
              <article className="approval-card" key={item.id}>
                <div className="approval-main">
                  {item.avatar ? (
                    <img src={item.avatar} alt={item.name} />
                  ) : (
                    <div className="avatar-initial" style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#ede9fe', color: '#6d28d9', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                      {(item.name?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.vehicle}</p>
                    <small>Submitted {item.time}</small>
                  </div>
                </div>
                <div className="approval-detail">
                  <span>CNIC NUMBER<b>{item.cnic}</b></span>
                  <span>REGISTRATION<b>{item.registration}</b></span>
                  <span>LOCATION<b>{item.city}</b></span>
                </div>
                <div className="approval-docs">
                  <div>
                    <Icon name="car" />
                    <span>{item.vehicle}<small>{item.year} · {item.color}</small></span>
                  </div>
                  <div>
                    <Icon name="check" />
                    <span>Documents uploaded<small>CNIC · License · Registration</small></span>
                  </div>
                </div>
                <div className="approval-actions">
                  <Button variant="secondary" onClick={() => setSelected(item)}>
                    View
                  </Button>
                  <Button 
                    variant="ghost"
                    disabled={processingId === item.id}
                    onClick={() => {
                      setRejectingItem(item)
                      setRejectReason('')
                    }}
                  >
                    Reject
                  </Button>
                  <Button 
                    disabled={processingId === item.id}
                    onClick={() => handleApprove(item)}
                  >
                    <Icon name="check" /> {processingId === item.id ? 'Approving...' : 'Approve'}
                  </Button>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <span><Icon name="check" size={28} /></span>
              <h3>Queue cleared</h3>
              <p>All driver applications have been reviewed.</p>
            </div>
          )
        )}

        {/* 2. Approved Drivers Tab */}
        {tab === "Approved drivers" && (
          approvedCount > 0 ? (
            approvedList.map((item) => (
              <article className="approval-card" key={item.id}>
                <div className="approval-main">
                  {item.avatar ? (
                    <img src={item.avatar} alt={item.name} />
                  ) : (
                    <div className="avatar-initial" style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#ede9fe', color: '#6d28d9', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                      {(item.name?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0 }}>{item.name}</h3>
                      <Badge tone="green">Verified Driver</Badge>
                    </div>
                    <p>{item.vehicle}</p>
                    <small>Approved & Active in Fleet</small>
                  </div>
                </div>
                <div className="approval-detail">
                  <span>CNIC NUMBER<b>{item.cnic}</b></span>
                  <span>REGISTRATION<b>{item.registration}</b></span>
                  <span>LOCATION<b>{item.city}</b></span>
                </div>
                <div className="approval-docs">
                  <div>
                    <Icon name="car" />
                    <span>{item.vehicle}<small>{item.year} · {item.color}</small></span>
                  </div>
                  <div>
                    <Icon name="check" />
                    <span>Verified License<small>{item.license}</small></span>
                  </div>
                </div>
                <div className="approval-actions">
                  <Button variant="secondary" onClick={() => setSelected(item)}>
                    View Spec Sheet
                  </Button>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <span><Icon name="car" size={28} /></span>
              <h3>No approved drivers yet</h3>
              <p>Review pending applications to verify and onboard drivers into the fleet.</p>
            </div>
          )
        )}

        {/* 3. Rejected Tab */}
        {tab === "Rejected" && (
          rejectedCount > 0 ? (
            rejectedList.map((item) => (
              <article className="approval-card" key={item.id}>
                <div className="approval-main">
                  {item.avatar ? (
                    <img src={item.avatar} alt={item.name} />
                  ) : (
                    <div className="avatar-initial" style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#ede9fe', color: '#6d28d9', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                      {(item.name?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0 }}>{item.name}</h3>
                      <Badge tone="red">Rejected</Badge>
                    </div>
                    <p>{item.vehicle}</p>
                    <small style={{ color: '#ef4444' }}>Reason: {item.rejectionReason || 'Failed document checks'}</small>
                  </div>
                </div>
                <div className="approval-detail">
                  <span>CNIC NUMBER<b>{item.cnic}</b></span>
                  <span>REGISTRATION<b>{item.registration}</b></span>
                  <span>LOCATION<b>{item.city}</b></span>
                </div>
                <div className="approval-docs">
                  <div>
                    <Icon name="alert" />
                    <span>Rejected File<small>{item.rejectionReason || 'Incomplete submission'}</small></span>
                  </div>
                </div>
                <div className="approval-actions">
                  <Button variant="secondary" onClick={() => setSelected(item)}>
                    View Details
                  </Button>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <span><Icon name="check" size={28} /></span>
              <h3>No rejected applications</h3>
              <p>No applications have been rejected.</p>
            </div>
          )
        )}
      </section>

      {/* Driver Full Review Modal */}
      {selected && (
        <DriverReview 
          application={selected} 
          onClose={() => setSelected(null)} 
          onApprove={() => handleApprove(selected)}
          onReject={() => {
            setRejectingItem(selected)
            setRejectReason('')
          }}
          onViewDocument={(title, url) => setLightboxImage({ title, url })}
        />
      )}

      {/* Rejection Prompt Modal */}
      {rejectingItem && (
        <div className="driver-modal-backdrop" onClick={() => setRejectingItem(null)}>
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                Reject Application
              </h3>
              <button 
                onClick={() => setRejectingItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b' }}>
              State the rejection reason for <strong>{rejectingItem.name}</strong> (e.g. illegible CNIC, expired vehicle inspection).
            </p>

            <textarea
              rows={3}
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Button variant="ghost" onClick={() => setRejectingItem(null)}>
                Cancel
              </Button>
              <button
                onClick={handleRejectSubmit}
                disabled={processingId === rejectingItem.id}
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {processingId === rejectingItem.id ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Lightbox Modal */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '24px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              background: '#0f172a',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '14px' }}>
                {lightboxImage.title}
              </span>
              <button 
                onClick={() => setLightboxImage(null)}
                style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <img 
              src={lightboxImage.url} 
              alt={lightboxImage.title} 
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}

function DriverReview({
  application,
  onClose,
  onApprove,
  onReject,
  onViewDocument
}: {
  application: DriverApplication
  onClose: () => void
  onApprove: () => void
  onReject: () => void
  onViewDocument: (title: string, url: string) => void
}) {
  const isApproved = application.status === 'approved'
  const isRejected = application.status === 'rejected'

  const details = [
    ["Application ID", application.id],
    ["Phone number", application.phone],
    ["Email address", application.email],
    ["CNIC number", application.cnic],
    ["City / region", application.city],
    ["Residential address", application.address],
  ]

  return (
    <div className="driver-modal-backdrop" onClick={onClose}>
      <section 
        className="driver-modal" 
        role="dialog" 
        aria-modal="true" 
        aria-label={`Review ${application.name}`} 
        onClick={(event) => event.stopPropagation()}
      >
        <header className="driver-modal-header">
          <div>
            <span>DRIVER APPLICATION</span>
            <h2>{isApproved ? 'Driver Spec Sheet' : 'Review application'}</h2>
            <p>{isApproved ? 'Official verified driver and fleet vehicle record.' : 'Verify the applicant and documents before making a decision.'}</p>
          </div>
          <button onClick={onClose} aria-label="Close review">
            <Icon name="close" />
          </button>
        </header>

        <div className="applicant-banner">
          {application.avatar ? (
            <img src={application.avatar} alt={application.name} />
          ) : (
            <div className="avatar-initial" style={{ width: '50px', height: '50px', borderRadius: '12px', background: '#ede9fe', color: '#6d28d9', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '18px' }}>
              {(application.name?.[0] || 'U').toUpperCase()}
            </div>
          )}
          <div>
            <div>
              <h3>{application.name}</h3>
              <Badge tone={isApproved ? "green" : isRejected ? "red" : "amber"}>
                {isApproved ? "Verified Driver" : isRejected ? "Rejected" : "Pending review"}
              </Badge>
            </div>
            <p>{application.email} · {application.phone}</p>
            <small>Submitted {application.time}</small>
          </div>
          <span className="application-id">{application.id}</span>
        </div>

        <div className="review-content">
          <section className="vehicle-showcase">
            {application.vehicleImage ? (
              <img src={application.vehicleImage} alt={`${application.vehicle} submitted by ${application.name}`} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#94a3b8' }}>
                <Icon name="car" size={42} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>Vehicle photo not uploaded</span>
              </div>
            )}
            <div className="vehicle-overlay">
              <span>REGISTERED VEHICLE</span>
              <h3>{application.vehicle}</h3>
              <p>{application.year} · {application.color} · {application.registration}</p>
            </div>
            <span className="photo-count">
              <Icon name="car" size={14} /> {application.vehicleImage ? 'Vehicle photo' : 'Image not uploaded'}
            </span>
          </section>

          <section className="review-section">
            <div className="review-section-heading">
              <span><Icon name="users" /></span>
              <div>
                <h3>Applicant information</h3>
                <p>Personal information returned by the driver profile.</p>
              </div>
            </div>
            <div className="review-grid">
              {details.map(([label, value]) => (
                <ReviewField key={label} label={label} value={value} wide={label === "Residential address"} />
              ))}
            </div>
          </section>

          <section className="review-section">
            <div className="review-section-heading">
              <span><Icon name="car" /></span>
              <div>
                <h3>Vehicle information</h3>
                <p>Submitted registration and ride capacity details.</p>
              </div>
            </div>
            <div className="review-grid">
              <ReviewField label="Make & model" value={application.vehicle} />
              <ReviewField label="Registration number" value={application.registration} />
              <ReviewField label="Model year" value={application.year} />
              <ReviewField label="Vehicle color" value={application.color} />
              <ReviewField label="Passenger capacity" value={`${application.seats} passenger`} />
              <ReviewField label="Air conditioning" value={application.airConditioned ? "Available" : "Not applicable"} />
            </div>
          </section>

          <section className="review-section">
            <div className="review-section-heading">
              <span><Icon name="shield" /></span>
              <div>
                <h3>Verification documents</h3>
                <p>Open each submission and compare its details with the profile.</p>
              </div>
            </div>
            <div className="document-grid">
              <DocumentCard 
                title="CNIC · Front" 
                number={application.cnic} 
                type="National identity card" 
                color="violet"
                onClick={() => {
                  if (application.cnicFrontUrl) {
                    onViewDocument(`${application.name} - CNIC Front`, application.cnicFrontUrl)
                  } else {
                    alert('CNIC front document file not attached.')
                  }
                }}
              />
              <DocumentCard 
                title="CNIC · Back" 
                number="Issued by NADRA" 
                type="National identity card" 
                color="slate" 
                onClick={() => {
                  if (application.cnicBackUrl) {
                    onViewDocument(`${application.name} - CNIC Back`, application.cnicBackUrl)
                  } else {
                    alert('CNIC back document file not attached.')
                  }
                }}
              />
              <DocumentCard 
                title="Driving license" 
                number={application.license} 
                type={`Expires ${application.licenseExpiry}`} 
                color="blue" 
                onClick={() => {
                  if (application.licenseUrl) {
                    onViewDocument(`${application.name} - Driving License`, application.licenseUrl)
                  } else {
                    alert('Driving license document file not attached.')
                  }
                }}
              />
              <DocumentCard 
                title="Vehicle registration" 
                number={application.registration} 
                type={`${application.vehicle} · ${application.year}`} 
                color="green" 
                onClick={() => {
                  if (application.registrationUrl) {
                    onViewDocument(`${application.vehicle} - Registration Document`, application.registrationUrl)
                  } else {
                    alert('Vehicle registration document file not attached.')
                  }
                }}
              />
            </div>
          </section>
        </div>

        <footer className="driver-modal-footer">
          <p>
            <Icon name="shield" /> {isApproved ? 'Driver is currently authorized and active.' : 'Approval grants immediate driver privileges.'}
          </p>
          <div>
            {!isApproved && (
              <>
                <Button variant="ghost" onClick={onReject}>
                  Reject application
                </Button>
                <Button onClick={onApprove}>
                  <Icon name="check" /> Approve driver
                </Button>
              </>
            )}
            {isApproved && (
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </footer>
      </section>
    </div>
  )
}

function ReviewField({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`review-field ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function DocumentCard({
  title,
  number,
  type,
  color,
  onClick
}: {
  title: string
  number: string
  type: string
  color: string
  onClick?: () => void
}) {
  return (
    <button className="document-card" type="button" onClick={onClick}>
      <div className={`document-preview ${color}`}>
        <span>MYWAY VERIFIED DOCUMENT</span>
        <Icon name={title.includes("license") ? "car" : "shield"} size={28} />
        <b>{number}</b>
      </div>
      <span>
        <b>{title}</b>
        <small>{type}</small>
      </span>
      <Icon name="chevron" />
    </button>
  )
}

function formatRelativeTime(dateStr?: string | null) {
  if (!dateStr) return 'Recently'
  const parsedTime = new Date(dateStr).getTime()
  if (isNaN(parsedTime) || new Date(dateStr).getFullYear() < 2020) return 'Recently'
  
  try {
    const diffMs = Date.now() - parsedTime
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minutes ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  } catch {
    return 'Recently'
  }
}
