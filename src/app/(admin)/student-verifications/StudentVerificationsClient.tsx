'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { adminReviewStudentVerification, adminRevokeStudentBadge } from './actions'
import { Header, Button, Icon, Badge } from '@/components/ui/FigmaUI'

type Verification = {
  id: string
  full_name: string
  university_name: string
  card_signed_url: string | null
  submitted_at: string
  profiles?: {
    full_name: string
    phone: string
  }
}

export type ActiveStudent = {
  id: string
  full_name: string | null
  phone: string | null
  verification_expiry_date: string | null
  created_at: string | null
}

export default function StudentVerificationsClient({ 
  verifications, 
  activeStudents 
}: { 
  verifications: Verification[]
  activeStudents: ActiveStudent[] 
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'Pending applications' | 'Active students'>('Active students')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingItem, setRejectingItem] = useState<Verification | null>(null)
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null)

  // Dropdown menu & Suspended badge state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [suspendingStudent, setSuspendingStudent] = useState<any | null>(null)
  const [isSuspending, setIsSuspending] = useState(false)

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuId(null)
    }
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  const handleApprove = async (id: string) => {
    setLoadingId(id)
    try {
      await adminReviewStudentVerification(id, 'approved')
    } catch (err: any) {
      alert(err.message || 'Error approving application')
    } finally {
      setLoadingId(null)
    }
  }

  const handleRejectSubmit = async () => {
    if (!rejectingItem) return
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejecting this student verification.')
      return
    }
    setLoadingId(rejectingItem.id)
    try {
      await adminReviewStudentVerification(rejectingItem.id, 'rejected', rejectReason)
      setRejectingItem(null)
      setRejectReason('')
    } catch (err: any) {
      alert(err.message || 'Error rejecting application')
    } finally {
      setLoadingId(null)
    }
  }

  // Calculate parsed student metrics
  const parsedStudents = useMemo(() => {
    const now = new Date()
    const colors = ['violet', 'blue', 'green'] as const

    return activeStudents.map((student, idx) => {
      const name = student.full_name || 'Student'
      const initial = (name.charAt(0) || 'S').toUpperCase()
      const phone = (student.phone && student.phone.trim().length > 0) ? student.phone.trim() : 'N/A'
      const approvalDate = student.created_at
        ? new Date(student.created_at).toLocaleDateString()
        : '—'

      let expiryDate: Date
      if (student.verification_expiry_date) {
        expiryDate = new Date(student.verification_expiry_date)
      } else if (student.created_at) {
        expiryDate = new Date(student.created_at)
        expiryDate.setMonth(expiryDate.getMonth() + 6)
      } else {
        expiryDate = new Date()
        expiryDate.setMonth(expiryDate.getMonth() + 6)
      }

      const diffMs = expiryDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

      let validity = 'Expired'
      let progress = 0
      let tone: 'green' | 'amber' | 'red' = 'green'

      if (diffDays <= 0) {
        validity = 'Expired'
        progress = 0
        tone = 'red'
      } else {
        const m = Math.floor(diffDays / 30)
        const d = diffDays % 30
        validity = `${m}m ${d}d left`
        progress = Math.min(100, Math.max(0, Math.round((diffDays / 180) * 100)))
        tone = diffDays < 30 ? 'amber' : 'green'
      }

      return {
        id: student.id,
        name,
        initial,
        phone,
        approvalDate,
        validity,
        expiry: expiryDate.toLocaleDateString(),
        progress,
        color: colors[idx % colors.length],
        university: 'Verified campus account',
        diffDays,
        tone
      }
    })
  }, [activeStudents])

  // Summary statistics
  const summaryStats = useMemo(() => {
    const total = parsedStudents.length
    if (total === 0) {
      return { total: 0, averageValidity: '0m 0d', expiringSoon: 0 }
    }
    const totalDays = parsedStudents.reduce((acc, s) => acc + Math.max(0, s.diffDays), 0)
    const avgDays = Math.round(totalDays / total)
    const avgM = Math.floor(avgDays / 30)
    const avgD = avgDays % 30
    const expiringSoon = parsedStudents.filter((s) => s.diffDays > 0 && s.diffDays <= 30).length

    return {
      total,
      averageValidity: `${avgM}m ${avgD}d`,
      expiringSoon
    }
  }, [parsedStudents])

  const handleExportActiveStudents = () => {
    if (parsedStudents.length === 0) {
      alert('No active students to export.')
      return
    }
    const headers = ['Student Name', 'Phone Number', 'Approval Date', 'Expiry Date', 'Validity', 'University']
    const rows = parsedStudents.map((s) => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.phone}"`,
      `"${s.approvalDate}"`,
      `"${s.expiry}"`,
      `"${s.validity}"`,
      `"${s.university}"`
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `active_students_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="page-studentverifications">
      <Header 
        title="Student verifications" 
        description="Review student cards and manage active campus ride discount limits."
      />

      <div className="tabs student-tabs">
        <button 
          className={tab === 'Pending applications' ? 'active' : ''} 
          onClick={() => setTab('Pending applications')}
        >
          Pending applications
          <span>{verifications.length}</span>
        </button>
        <button 
          className={tab === 'Active students' ? 'active' : ''} 
          onClick={() => setTab('Active students')}
        >
          Active students
          <span>{activeStudents.length}</span>
        </button>
      </div>

      {tab === 'Active students' ? (
        <section className="student-directory panel">
          <header className="student-directory-header">
            <div className="benefit-heading">
              <span><Icon name="student" size={22}/></span>
              <div>
                <h2>Active Student Benefits</h2>
                <p>Students currently receiving subsidized fare rates with time-limited validity.</p>
              </div>
            </div>
            <div className="active-record-count">
              <i/>
              <span><b>{summaryStats.total}</b> Active records</span>
            </div>
          </header>

          <div className="student-summary">
            <div>
              <span className="summary-icon violet"><Icon name="student"/></span>
              <span>
                <small>Active students</small>
                <strong>{summaryStats.total}</strong>
              </span>
            </div>
            <div>
              <span className="summary-icon green"><Icon name="trend"/></span>
              <span>
                <small>Average validity</small>
                <strong>{summaryStats.averageValidity}</strong>
              </span>
            </div>
            <div>
              <span className="summary-icon amber"><Icon name="clock"/></span>
              <span>
                <small>Expiring in 30 days</small>
                <strong>{summaryStats.expiringSoon}</strong>
              </span>
            </div>
          </div>

          <div className="active-student-table">
            <div className="student-table-head">
              <span>Student name</span>
              <span>Phone number</span>
              <span>Approval date</span>
              <span>6-month validity status</span>
              <span/>
            </div>
            {parsedStudents.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                No active verified students found in database.
              </div>
            ) : (
              parsedStudents.map((student) => (
                <div className="student-row" key={student.id}>
                  <div className="active-student-name">
                    <span className={`student-avatar ${student.color}`}>{student.initial}</span>
                    <span>
                      <b>{student.name}</b>
                      <small>{student.university}</small>
                    </span>
                  </div>
                  <span className="student-phone">{student.phone}</span>
                  <div className="approval-date">
                    <Icon name="clock" size={14}/>
                    <span>
                      <b>{student.approvalDate}</b>
                      <small>Approved</small>
                    </span>
                  </div>
                  <div className="validity-cell">
                    <div>
                      <Badge tone={student.tone}>{student.validity}</Badge>
                      <small>Expires {student.expiry}</small>
                    </div>
                    <span className="validity-track">
                      <i style={{ width: `${student.progress}%` }}/>
                    </span>
                  </div>
                  <div className="student-menu-wrapper" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="student-actions" 
                      aria-label={`Actions for ${student.name}`}
                      onClick={() => setActiveMenuId(activeMenuId === student.id ? null : student.id)}
                    >
                      <Icon name="more"/>
                    </button>
                    {activeMenuId === student.id && (
                      <div className="student-dropdown-menu">
                        <button
                          className="student-dropdown-item danger"
                          onClick={() => {
                            setActiveMenuId(null)
                            setSuspendingStudent(student)
                          }}
                        >
                          <Icon name="close" size={15}/>
                          <span>Suspend / Remove Student Badge</span>
                        </button>
                        <button
                          className="student-dropdown-item"
                          onClick={() => {
                            navigator.clipboard.writeText(student.id)
                            setActiveMenuId(null)
                            alert(`Copied Student User ID: ${student.id}`)
                          }}
                        >
                          <Icon name="copy" size={15}/>
                          <span>Copy Student User ID</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <footer className="student-directory-footer">
            <p>
              <Icon name="shield"/> Student benefits automatically expire after six months unless renewed.
            </p>
            <Button variant="secondary" onClick={handleExportActiveStudents}>
              <Icon name="download"/> Export active students
            </Button>
          </footer>
        </section>
      ) : verifications.length === 0 ? (
        <section className="student-empty">
          <span><Icon name="check" size={28}/></span>
          <h2>No pending applications</h2>
          <p>All submitted student cards have been reviewed. New applications will appear here.</p>
        </section>
      ) : (
        <section className="approval-list">
          {verifications.map((v) => (
            <article className="approval-card" key={v.id}>
              <div className="approval-main">
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: '#ede9fe',
                  color: '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '18px',
                  flexShrink: 0
                }}>
                  {v.full_name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div>
                  <h3>{v.full_name}</h3>
                  <p>{v.university_name || 'Academic Institution'}</p>
                  <small>Submitted {new Date(v.submitted_at).toLocaleString()}</small>
                </div>
              </div>

              <div className="approval-detail">
                <span>
                  UNIVERSITY
                  <b>{v.university_name || 'Unspecified'}</b>
                </span>
                <span>
                  ACCOUNT PHONE
                  <b>{(v.profiles?.phone && v.profiles.phone.trim().length > 0) ? v.profiles.phone.trim() : 'N/A'}</b>
                </span>
                <span>
                  DOCUMENTS
                  <b>{v.card_signed_url ? '1 File attached' : 'No document'}</b>
                </span>
              </div>

              <div className="approval-docs">
                {v.card_signed_url ? (
                  <div 
                    style={{ cursor: 'pointer' }}
                    onClick={() => setPreviewImage({ url: v.card_signed_url!, title: `${v.full_name} - Student ID Card` })}
                  >
                    <Icon name="student" />
                    <span>
                      Student ID / Challan
                      <small style={{ color: '#6366f1', fontWeight: 600 }}>Click to preview full size</small>
                    </span>
                  </div>
                ) : (
                  <div>
                    <Icon name="close" />
                    <span>No Student Card Image<small>Applicant did not upload file</small></span>
                  </div>
                )}
              </div>

              <div className="approval-actions">
                <Button 
                  variant="ghost" 
                  disabled={loadingId === v.id}
                  onClick={() => {
                    setRejectingItem(v)
                    setRejectReason('')
                  }}
                >
                  Reject
                </Button>
                <Button 
                  disabled={loadingId === v.id}
                  onClick={() => handleApprove(v.id)}
                >
                  <Icon name="check" /> {loadingId === v.id ? 'Approving...' : 'Approve Student'}
                </Button>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Reject Modal */}
      {rejectingItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                Reject Student Application
              </h3>
              <button 
                onClick={() => setRejectingItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b' }}>
              Provide clear feedback to <strong>{rejectingItem.full_name}</strong> why their student verification was rejected (e.g., blurry card, expired semester challan).
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
                disabled={loadingId === rejectingItem.id}
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
                {loadingId === rejectingItem.id ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend / Revoke Student Badge Modal */}
      {suspendingStudent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '460px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'grid',
                  placeItems: 'center'
                }}>
                  <Icon name="alert" size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                  Revoke Student Badge
                </h3>
              </div>
              <button 
                onClick={() => setSuspendingStudent(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b', lineHeight: 1.5 }}>
              Are you sure you want to suspend/revoke the active student badge for <strong>{suspendingStudent.name}</strong>?
            </p>
            
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: '#475569' }}>
              <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>Resets verification tier from <b>Student</b> to <b>Standard</b>.</li>
                <li>Immediately terminates campus ride discount validity.</li>
                <li>Recorded in the database and audit log.</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <Button variant="ghost" onClick={() => setSuspendingStudent(null)}>
                Cancel
              </Button>
              <button
                onClick={async () => {
                  setIsSuspending(true)
                  try {
                    await adminRevokeStudentBadge(suspendingStudent.id)
                    setSuspendingStudent(null)
                    router.refresh()
                  } catch (err: any) {
                    alert(err.message || 'Failed to revoke student badge')
                  } finally {
                    setIsSuspending(false)
                  }
                }}
                disabled={isSuspending}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {isSuspending ? 'Revoking...' : 'Revoke & Suspend Badge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
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
                {previewImage.title}
              </span>
              <button 
                onClick={() => setPreviewImage(null)}
                style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <img 
              src={previewImage.url} 
              alt={previewImage.title} 
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
    </div>
  )
}
