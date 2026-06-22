'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Plus } from 'lucide-react'
import Sidebar from '@/components/shared/Sidebar'
import { useSidebar } from '@/components/shared/SidebarContext'
import Pagination from '@/components/shared/Pagination'
import AddAttendanceModal from '@/components/attendance/Addattendancemodal'
import type { Attendance, Employee } from '@/lib/services/attendanceService'

const STATUS_COLORS: Record<string, string> = {
  Present: '#34D399',
  Late: '#F5A623',
  Absent: '#F87171',
  'On Leave': '#60A5FA',
}

const PAGE_SIZE = 10

export default function AttendancePage() {
  const router = useRouter()
  const { collapsed } = useSidebar()
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Attendance | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Attendance | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const admin = localStorage.getItem('admin')
    if (!admin) { router.push('/login'); return }
    fetchData()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterDate, filterStatus])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [attRes, empRes] = await Promise.all([
        fetch('/api/attendance'),
        fetch('/api/attendance?type=employees'),
      ])
      if (!attRes.ok || !empRes.ok) throw new Error('Failed to fetch')
      const [attData, empData] = await Promise.all([attRes.json(), empRes.json()])
      setAttendance(attData)
      setEmployees(empData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openAdd = () => {
    setEditTarget(null)
    setShowModal(true)
  }

  const openEdit = (rec: Attendance) => {
    setEditTarget(rec)
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteError('')
    try {
      const res = await fetch(`/api/attendance/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const { error } = await res.json()
        setDeleteError(error)
        return
      }
      setDeleteTarget(null)
      fetchData()
    } catch {
      setDeleteError('Something went wrong.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin')
    router.push('/login')
  }

  const filtered = attendance.filter((a) => {
    const matchSearch = [a.employee?.full_name, a.employee?.employee_id, a.employee?.department]
      .join(' ').toLowerCase().includes(search.toLowerCase())
    const matchDate = filterDate ? a.date === filterDate : true
    const matchStatus = filterStatus ? a.status === filterStatus : true
    return matchSearch && matchDate && matchStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const inputStyle = {
    border: '1px solid #1F2924',
    backgroundColor: '#181F1B',
    color: '#EAF4EF',
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0A0E0C' }}>
      <Sidebar onLogout={handleLogout} />

      <div
        className="flex-1 p-8 transition-all duration-200"
        style={{ marginLeft: collapsed ? '5rem' : '16rem' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#EAF4EF' }}>Attendance</h1>
            <p className="text-sm mt-1" style={{ color: '#7C8A82' }}>Record and manage employee attendance</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#34D399', color: '#08130D' }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Record Attendance
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <input
            type="text"
            placeholder="Search by name, ID, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ ...inputStyle, minWidth: '260px' }}
          />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2.5 rounded-lg text-sm outline-none"
            style={inputStyle}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 rounded-lg text-sm outline-none"
            style={inputStyle}
          >
            <option value="">All Statuses</option>
            <option>Present</option>
            <option>Late</option>
            <option>Absent</option>
            <option>On Leave</option>
          </select>
          {(filterDate || filterStatus) && (
            <button
              onClick={() => { setFilterDate(''); setFilterStatus('') }}
              className="px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{ color: '#A8B8AF', border: '1px solid #1F2924', backgroundColor: '#12161A' }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-[20px] overflow-hidden" style={{ backgroundColor: '#12161A', border: '1px solid #1F2924' }}>
          {loading ? (
            <div className="p-8 text-sm text-center" style={{ color: '#7C8A82' }}>Loading attendance records...</div>
          ) : paginated.length === 0 ? (
            <div className="p-8 text-sm text-center" style={{ color: '#7C8A82' }}>No attendance records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#161B17', borderBottom: '1px solid #1F2924' }}>
                    {['Employee', 'Department', 'Date', 'Time In', 'Time Out', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#7C8A82' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((a, i) => (
                    <tr key={a.id} style={{ borderBottom: i < paginated.length - 1 ? '1px solid #1A211D' : 'none' }}>
                      <td className="px-5 py-4" style={{ color: '#EAF4EF' }}>
                        <p className="font-medium">{a.employee?.full_name ?? '—'}</p>
                        <p className="text-xs font-mono" style={{ color: '#7C8A82' }}>{a.employee?.employee_id ?? ''}</p>
                      </td>
                      <td className="px-5 py-4" style={{ color: '#A8B8AF' }}>{a.employee?.department ?? '—'}</td>
                      <td className="px-5 py-4" style={{ color: '#A8B8AF' }}>
                        {new Date(a.date + 'T00:00:00').toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-5 py-4" style={{ color: '#A8B8AF' }}>{a.time_in ?? '—'}</td>
                      <td className="px-5 py-4" style={{ color: '#A8B8AF' }}>{a.time_out ?? '—'}</td>
                      <td className="px-5 py-4">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: `${STATUS_COLORS[a.status]}1F`,
                            color: STATUS_COLORS[a.status],
                          }}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openEdit(a)}
                            title="Edit"
                            className="p-1.5 rounded-md hover:opacity-70 transition-opacity"
                            style={{ color: '#2DD4BF' }}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => { setDeleteError(''); setDeleteTarget(a) }}
                            title="Delete"
                            className="p-1.5 rounded-md hover:opacity-70 transition-opacity"
                            style={{ color: '#F87171' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <>
            <p className="text-xs mt-3 text-center" style={{ color: '#7C8A82' }}>
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} records
            </p>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <AddAttendanceModal
          editTarget={editTarget}
          employees={employees}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchData() }}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="rounded-2xl w-full max-w-sm mx-4 p-7 text-center" style={{ backgroundColor: '#12161A', border: '1px solid #1F2924' }}>
            <div className="text-4xl mb-4">🗑️</div>
            <h2 className="text-lg font-bold mb-2" style={{ color: '#EAF4EF' }}>Delete Record?</h2>
            <p className="text-sm mb-2" style={{ color: '#A8B8AF' }}>
              Delete attendance record for{' '}
              <span className="font-semibold" style={{ color: '#EAF4EF' }}>{deleteTarget.employee?.full_name}</span> on{' '}
              <span className="font-semibold" style={{ color: '#EAF4EF' }}>
                {new Date(deleteTarget.date + 'T00:00:00').toLocaleDateString('en-PH')}
              </span>?
            </p>
            {deleteError && (
              <p className="text-xs mb-4" style={{ color: '#F87171' }}>{deleteError}</p>
            )}
            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={() => { setDeleteTarget(null); setDeleteError('') }}
                className="px-5 py-2 rounded-lg text-sm font-medium"
                style={{ color: '#A8B8AF', border: '1px solid #1F2924' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: '#F87171', color: '#1A0A0A' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}