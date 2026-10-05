'use client'

import { useState, useMemo } from 'react'
import { deleteCollectionRecord } from '../actions'
import { Badge, Button, Header, Icon } from '@/components/ui/FigmaUI'

export type EnrichedVehicle = {
  id: string
  user_id: string
  driver_name: string
  driver_phone: string | null
  driver_avatar: string | null
  reg_number: string
  brand: string
  variant: string | null
  type: string
  color: string
  model_year: number
  capacity: number
  has_ac: boolean
  is_active: boolean
  created_at: string
  registration_doc_url?: string | null
  registration_doc_signed_url?: string | null
  license_doc_url?: string | null
  license_doc_signed_url?: string | null
  application_status?: string | null
  raw_data?: any
}

export type VehicleRecord = {
  id: string
  plate: string
  make: string
  model: string
  year: number
  seats: number
  color: string
  active: boolean
  vehicleClass: string
  airConditioned: boolean
  added: string
  status: string
  driverName: string
  driverPhone: string
  driverId: string
  driverAvatar: string
  storagePath: string
  signedDocUrl?: string | null
  backendId: string
}

export default function VehiclesCollectionClient({ vehicles: initialVehicles }: { vehicles: EnrichedVehicle[] }) {
  const [vehiclesList, setVehiclesList] = useState<EnrichedVehicle[]>(initialVehicles)
  const [selected, setSelected] = useState<VehicleRecord | null>(null)
  const [acFilter, setAcFilter] = useState<'All' | 'AC' | 'Non-AC'>('All')
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Map backend vehicles to VehicleRecord
  const mappedVehicles: VehicleRecord[] = useMemo(() => {
    return vehiclesList.map((v) => {
      const addedDate = v.created_at ? new Date(v.created_at).toLocaleString() : 'Recently added'
      return {
        id: v.id,
        plate: v.reg_number || 'REG-PENDING',
        make: v.brand || 'Vehicle Make',
        model: v.variant || 'Model',
        year: v.model_year || 2022,
        seats: v.capacity || 4,
        color: v.color || 'Standard',
        active: Boolean(v.is_active),
        vehicleClass: v.type || 'Car',
        airConditioned: Boolean(v.has_ac),
        added: addedDate,
        status: v.is_active ? 'approved' : 'pending',
        driverName: v.driver_name || 'Assigned Driver',
        driverPhone: v.driver_phone || 'Phone unrecorded',
        driverId: v.user_id || `MW-${v.id.slice(0, 8)}`,
        driverAvatar: v.driver_avatar || '',
        storagePath: v.registration_doc_url || `${v.user_id || 'docs'}/vehicle_reg_${v.id.slice(0, 6)}.jpg`,
        signedDocUrl: v.registration_doc_signed_url || null,
        backendId: v.id
      }
    })
  }, [vehiclesList])

  const totalCount = mappedVehicles.length
  const activeCount = mappedVehicles.filter((v) => v.active).length
  const acCount = mappedVehicles.filter((v) => v.airConditioned).length
  const withDocsCount = mappedVehicles.filter((v) => v.signedDocUrl || v.storagePath).length

  const visibleVehicles = useMemo(() => {
    return mappedVehicles.filter((vehicle) => {
      if (acFilter === 'AC' && !vehicle.airConditioned) return false
      if (acFilter === 'Non-AC' && vehicle.airConditioned) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        vehicle.driverName.toLowerCase().includes(q) ||
        vehicle.driverPhone.toLowerCase().includes(q) ||
        vehicle.plate.toLowerCase().includes(q) ||
        vehicle.make.toLowerCase().includes(q) ||
        vehicle.model.toLowerCase().includes(q)
      )
    })
  }, [mappedVehicles, acFilter, search])

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to permanently delete this vehicle from the database?')) {
      return
    }
    setDeletingId(vehicleId)
    try {
      await deleteCollectionRecord('vehicles', vehicleId)
      setVehiclesList(prev => prev.filter(v => v.id !== vehicleId))
      setSelected(null)
    } catch (err: any) {
      alert(err.message || 'Failed to delete vehicle')
    } finally {
      setDeletingId(null)
    }
  }

  const exportCSV = () => {
    const headers = ['Vehicle ID', 'Driver Name', 'Driver Phone', 'Plate', 'Make', 'Model', 'Year', 'Color', 'Capacity', 'AC', 'Active', 'Added Date']
    const rows = visibleVehicles.map(v => [
      v.id,
      `"${v.driverName.replace(/"/g, '""')}"`,
      v.driverPhone,
      v.plate,
      v.make,
      `"${v.model.replace(/"/g, '""')}"`,
      v.year,
      v.color,
      v.seats,
      v.airConditioned ? 'Yes' : 'No',
      v.active ? 'Yes' : 'No',
      `"${v.added}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `myway_vehicles_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <Header 
        title="Vehicles" 
        description="Manage registered fleet vehicles, ownership documents and driver assignments." 
        actions={
          <Button variant="secondary" onClick={exportCSV}>
            <Icon name="download" /> Export CSV
          </Button>
        }
      />

      <section className="inline-stats">
        <div><span>Total vehicles</span><strong>{totalCount}</strong></div>
        <div><span>Active vehicles</span><strong>{activeCount}</strong></div>
        <div><span>AC equipped</span><strong>{acCount}</strong></div>
        <div><span>With documents</span><strong>{withDocsCount}</strong></div>
      </section>

      <section className="panel">
        <div className="toolbar">
          <label className="search-box">
            <Icon name="search" />
            <input 
              placeholder="Search driver, phone, plate, make or model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="filters">
            {(['All', 'AC', 'Non-AC'] as const).map((filter) => (
              <button 
                key={filter} 
                className={`filter ${acFilter === filter ? 'active' : ''}`}
                onClick={() => setAcFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="vehicle-list">
          {visibleVehicles.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              No fleet vehicles matched your search.
            </div>
          ) : (
            visibleVehicles.map((vehicle) => (
              <button 
                className="vehicle-row" 
                key={vehicle.id} 
                onClick={() => setSelected(vehicle)}
                type="button"
              >
                <span className="vehicle-list-icon">
                  <Icon name="car" />
                </span>
                <span className="vehicle-name">
                  <b>{vehicle.make} {vehicle.model}</b>
                  <small>{vehicle.year} · {vehicle.color} · {vehicle.seats} seats</small>
                </span>
                <span className="plate-mini">{vehicle.plate}</span>
                <span className="vehicle-driver">
                  {vehicle.driverAvatar ? (
                    <img src={vehicle.driverAvatar} alt="" />
                  ) : (
                    <div className="avatar-initial" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ede9fe', color: '#6d28d9', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '12px' }}>
                      {(vehicle.driverName?.[0] || 'D').toUpperCase()}
                    </div>
                  )}
                  <span>
                    <b>{vehicle.driverName}</b>
                    <small>{vehicle.driverPhone}</small>
                  </span>
                </span>
                <Badge tone={vehicle.airConditioned ? "blue" : "neutral"}>
                  {vehicle.airConditioned ? "AC" : "Non-AC"}
                </Badge>
                <Badge tone={vehicle.active ? "green" : "amber"}>
                  {vehicle.active ? "Active" : "Pending"}
                </Badge>
                <Icon name="chevron" />
              </button>
            ))
          )}
        </div>
      </section>

      {selected && (
        <VehicleDetails 
          vehicle={selected} 
          onClose={() => setSelected(null)}
          onDelete={() => handleDeleteVehicle(selected.id)}
          isDeleting={deletingId === selected.id}
        />
      )}
    </>
  )
}

function VehicleDetails({ 
  vehicle, 
  onClose,
  onDelete,
  isDeleting
}: { 
  vehicle: VehicleRecord
  onClose: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  const [enlarged, setEnlarged] = useState(false)
  const copy = (value: string) => {
    navigator.clipboard?.writeText(value)
    alert('Copied to clipboard: ' + value)
  }

  return (
    <div className="fleet-modal-backdrop" onClick={onClose}>
      <section 
        className="fleet-modal" 
        role="dialog" 
        aria-modal="true" 
        aria-label={`${vehicle.make} ${vehicle.model} details`} 
        onClick={(event) => event.stopPropagation()}
      >
        <header className="fleet-modal-header">
          <div>
            <span>FLEET VEHICLE REGISTRY</span>
            <h2>Vehicle spec sheet</h2>
            <div className="vehicle-id">
              <b>ID: {vehicle.id}</b>
              <button onClick={() => copy(vehicle.id)}>Copy</button>
            </div>
          </div>
          <div className="fleet-header-actions">
            <button 
              className="delete-vehicle" 
              onClick={onDelete}
              disabled={isDeleting}
            >
              <Icon name="alert" /> {isDeleting ? 'Deleting...' : 'Delete vehicle permanently'}
            </button>
            <button className="fleet-close" onClick={onClose} aria-label="Close vehicle details">
              <Icon name="close" />
            </button>
          </div>
        </header>

        <div className="fleet-added">
          <Icon name="clock" />
          <span>Added: {vehicle.added}</span>
        </div>

        <div className="fleet-modal-content">
          <section className="vehicle-spec-grid">
            <SpecCard icon="route" label="Registration plate" value={vehicle.plate} note="Verified government plate" plate />
            <SpecCard icon="car" label="Make & model" value={`${vehicle.make} ${vehicle.model}`} note={`${vehicle.year} model`} />
            <SpecCard icon="users" label="Capacity & comfort" value={`${vehicle.seats} seats`} note={`Color: ${vehicle.color}`} />
            <SpecCard icon="shield" label="Fleet status" value={vehicle.active ? "Active on fleet" : "Pending approval"} note={`Class: ${vehicle.vehicleClass}`} />
          </section>

          <section className="registration-section">
            <div className="fleet-section-title">
              <span><Icon name="check" /></span>
              <div>
                <h3>Vehicle registration document proof</h3>
                <p>Excise & Taxation verification</p>
              </div>
              <Badge tone={vehicle.status === "approved" ? "green" : "amber"}>
                {vehicle.status}
              </Badge>
            </div>
            <div className="registration-layout">
              <button className="registration-document" onClick={() => setEnlarged(true)} type="button">
                {vehicle.signedDocUrl ? (
                  <img 
                    src={vehicle.signedDocUrl} 
                    alt="Vehicle Registration Proof" 
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
                    <strong>{vehicle.plate}</strong>
                  </div>
                )}
                <span className="document-hover">
                  <Icon name="search" /> Click to enlarge
                </span>
              </button>
              <div className="registration-copy">
                <span>VEHICLE REGISTRATION FOR {vehicle.plate}</span>
                <h3>Official registration certificate</h3>
                <p>Inspect chassis, engine number and official government stamps before approving this fleet record.</p>
                <div className="document-details">
                  <InfoRow label="Document type" value="Vehicle Registration Certificate" />
                  <InfoRow label="Assigned plate" value={vehicle.plate} />
                  <InfoRow label="Registered driver" value={vehicle.driverName} />
                  <InfoRow label="Driver phone" value={vehicle.driverPhone} />
                  <InfoRow label="Storage path" value={vehicle.storagePath} mono />
                </div>
                <button className="resolution-button" onClick={() => setEnlarged(true)} type="button">
                  Inspect full resolution <Icon name="arrow" />
                </button>
              </div>
            </div>
          </section>

          <section className="driver-account-card">
            <span className="driver-account-icon">
              <Icon name="users" size={23} />
            </span>
            <div className="driver-account-copy">
              <span>ASSIGNED DRIVER ACCOUNT</span>
              <h3>{vehicle.driverName}</h3>
              <p>Phone: {vehicle.driverPhone}</p>
            </div>
            <div className="driver-uuid">
              <span>DRIVER UUID</span>
              <b>{vehicle.driverId}</b>
            </div>
            <button onClick={() => copy(vehicle.driverId)}>Copy</button>
          </section>
        </div>

        <footer className="fleet-modal-footer">
          <p>
            <Icon name="shield" /> Registration document is stored securely.
          </p>
          <Button variant="secondary" onClick={onClose}>
            Close vehicle record
          </Button>
        </footer>
      </section>

      {enlarged && (
        <div className="document-lightbox" onClick={(event) => { event.stopPropagation(); setEnlarged(false); }}>
          <button className="lightbox-close" onClick={() => setEnlarged(false)}>
            <Icon name="close" />
          </button>
          {vehicle.signedDocUrl ? (
            <div style={{ maxWidth: '90vw', maxHeight: '85vh', background: '#0f172a', padding: '16px', borderRadius: '16px' }} onClick={(e) => e.stopPropagation()}>
              <img 
                src={vehicle.signedDocUrl} 
                alt="Enlarged Registration Document" 
                style={{ maxWidth: '100%', maxHeight: '78vh', objectFit: 'contain', borderRadius: '8px' }}
              />
            </div>
          ) : (
            <div className="document-paper large" onClick={(event) => event.stopPropagation()}>
              <div className="document-government">
                <span>GOVERNMENT OF PAKISTAN</span>
                <b>VEHICLE REGISTRATION CERTIFICATE</b>
                <small>EXCISE, TAXATION & NARCOTICS CONTROL DEPARTMENT</small>
              </div>
              <div className="document-watermark">
                <Icon name="shield" size={100} />
              </div>
              <div className="large-document-grid">
                <InfoRow label="Registration number" value={vehicle.plate} />
                <InfoRow label="Owner" value={vehicle.driverName} />
                <InfoRow label="Make" value={vehicle.make} />
                <InfoRow label="Model" value={vehicle.model} />
                <InfoRow label="Year" value={String(vehicle.year)} />
                <InfoRow label="Color" value={vehicle.color} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SpecCard({ icon, label, value, note, plate = false }: { icon: "route" | "car" | "users" | "shield"; label: string; value: string; note: string; plate?: boolean }) {
  return (
    <div className="spec-card">
      <span className="spec-icon">
        <Icon name={icon} />
      </span>
      <div>
        <span>{label}</span>
        <strong className={plate ? "plate-value" : ""}>{value}</strong>
        <p>{note}</p>
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="vehicle-info-row">
      <span>{label}</span>
      <strong className={mono ? "mono" : ""}>{value}</strong>
    </div>
  )
}
