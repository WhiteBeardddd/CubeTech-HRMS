'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { useSidebar } from '@/components/SidebarContext'
import Pagination from '@/components/Pagination'
// ─── Types ────────────────────────────────────────────────
type Employee = {
  id: string
  employee_id: string
  full_name: string
  department: string
  position: string
}

type Attendance = {
  id: string
  employee_id: string
  date: string
  time_in: string | null
  time_out: string | null
  status: 'Present' | 'Late' | 'Absent' | 'On Leave'
  created_at: string
  employee?: Employee
}

type AttendanceForm = {
  employee_id: string
  date: string
  time_in: string
  time_out: string
  status: 'Present' | 'Late' | 'Absent' | 'On Leave'
}

const emptyForm: AttendanceForm = {
  employee_id: '',
  date: new Date().toISOString().split('T')[0],
  time_in: '',
  time_out: '',
  status: 'Present',
}

const STATUS_COLORS: Record<string, string> = {
  Present: '#34D399',
  Late: '#F5A623',
  Absent: '#F87171',
  'On Leave': '#60A5FA',
}

const PAGE_SIZE = 10

// ─── Main Page ────────────────────────────────────────────
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
  const [form, setForm] = useState<AttendanceForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Attendance | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const admin = localStorage.getItem('admin')
    if (!admin) { router.push('/login'); return }
    fetchData()
  }, [])

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterDate, filterStatus])

  // ─── Fetch ───────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true)

    const { data: attData } = await supabase
      .from('attendance')
      .select(`
        *,
        employee:employees(id, employee_id, full_name, department, position)
      `)
      .order('date', { ascending: false })

    const { data: empData } = await supabase
      .from('employees')
      .select('id, employee_id, full_name, department, position')
      .neq('employment_status', 'Resigned')
      .order('full_name')

    if (attData) setAttendance(attData)
    if (empData) setEmployees(empData)
    setLoading(false)
  }

  // ─── Open Add ────────────────────────────────────────────
  const openAdd = () => {
    setEditTarget(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  // ─── Open Edit ───────────────────────────────────────────
  const openEdit = (rec: Attendance) => {
    setEditTarget(rec)
    setForm({
      employee_id: rec.employee_id,
      date: rec.date,
      time_in: rec.time_in ?? '',
      time_out: rec.time_out ?? '',
      status: rec.status,
    })
    setError('')
    setShowModal(true)
  }

  // ─── Save ────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.employee_id) { setError('Please select an employee.'); return }
    if (!form.date) { setError('Date is required.'); return }
    if (!form.status) { setError('Status is required.'); return }

    setSaving(true)
    setError('')

    const payload = {
      employee_id: form.employee_id,
      date: form.date,
      time_in: form.time_in || null,
      time_out: form.time_out || null,
      status: form.status,
    }

    if (editTarget) {
      const { error } = await supabase.from('attendance').update(payload).eq('id', editTarget.id)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      // Prevent duplicate entry for same employee + date
      const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('employee_id', form.employee_id)
        .eq('date', form.date)
        .single()

      if (existing) {
        setError('Attendance for this employee on this date already exists. Edit the existing record instead.')
        setSaving(false)
        return
      }

      const { error } = await supabase.from('attendance').insert(payload)
      if (error) { setError(error.message); setSaving(false); return }
    }

    setSaving(false)
    setShowModal(false)
    fetchData()
  }

  // ─── Delete ──────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    await supabase.from('attendance').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    fetchData()
  }

  const handleLogout = () => {
    localStorage.removeItem('admin')
    router.push('/login')
  }

  // ─── Filtered ────────────────────────────────────────────
  const filtered = attendance.filter((a) => {
    const matchSearch = [a.employee?.full_name, a.employee?.employee_id, a.employee?.department]
      .join(' ').toLowerCase().includes(search.toLowerCase())
    const matchDate = filterDate ? a.date === filterDate : true
    const matchStatus = filterStatus ? a.status === filterStatus : true
    return matchSearch && matchDate && matchStatus
  })

  // ─── Paginated slice ───────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // ─── Status auto-suggest based on time_in ────────────────
  const handleTimeInChange = (val: string) => {
    setForm((prev) => {
      let suggested = prev.status
      if (val) {
        const [h, m] = val.split(':').map(Number)
        const totalMin = h * 60 + m
        // Late if after 9:00 AM (540 min)
        suggested = totalMin > 540 ? 'Late' : 'Present'
      }
      return { ...prev, time_in: val, status: suggested }
    })
  }

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
                            onClick={() => setDeleteTarget(a)}
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

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="rounded-2xl w-full max-w-md mx-4 p-7" style={{ backgroundColor: '#12161A', border: '1px solid #1F2924' }}>
            <h2 className="text-lg font-bold mb-5" style={{ color: '#EAF4EF' }}>
              {editTarget ? 'Edit Attendance' : 'Record Attendance'}
            </h2>

            <div className="flex flex-col gap-4">
              {/* Employee */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold" style={{ color: '#7C8A82' }}>Employee *</label>
                {editTarget ? (
                  <div className="px-3 py-2.5 rounded-lg text-sm" style={{ backgroundColor: '#181F1B', border: '1px solid #1F2924', color: '#EAF4EF' }}>
                    {attendance.find(a => a.id === editTarget.id)?.employee?.full_name ?? '—'}
                  </div>
                ) : (
                  <select
                    value={form.employee_id}
                    onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                    className="px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={inputStyle}
                  >
                    <option value="">— Select Employee —</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.full_name} ({e.employee_id})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Date */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold" style={{ color: '#7C8A82' }}>Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={inputStyle}
                />
              </div>

              {/* Time In / Time Out */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold" style={{ color: '#7C8A82' }}>Time In</label>
                  <input
                    type="time"
                    value={form.time_in}
                    onChange={(e) => handleTimeInChange(e.target.value)}
                    className="px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold" style={{ color: '#7C8A82' }}>Time Out</label>
                  <input
                    type="time"
                    value={form.time_out}
                    onChange={(e) => setForm({ ...form, time_out: e.target.value })}
                    className="px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold" style={{ color: '#7C8A82' }}>Status *</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as AttendanceForm['status'] })}
                  className="px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={inputStyle}
                >
                  <option>Present</option>
                  <option>Late</option>
                  <option>Absent</option>
                  <option>On Leave</option>
                </select>
              </div>

              {/* Status hint */}
              <p className="text-xs -mt-2" style={{ color: '#7C8A82' }}>
                💡 Status auto-suggests based on Time In — after 9:00 AM is marked Late.
              </p>
            </div>

            {error && <p className="text-xs mt-3" style={{ color: '#F87171' }}>{error}</p>}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ color: '#A8B8AF', border: '1px solid #1F2924' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
                style={{ backgroundColor: '#34D399', color: '#08130D' }}
              >
                {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="rounded-2xl w-full max-w-sm mx-4 p-7 text-center" style={{ backgroundColor: '#12161A', border: '1px solid #1F2924' }}>
            <div className="text-4xl mb-4">🗑️</div>
            <h2 className="text-lg font-bold mb-2" style={{ color: '#EAF4EF' }}>Delete Record?</h2>
            <p className="text-sm mb-6" style={{ color: '#A8B8AF' }}>
              Delete attendance record for <span className="font-semibold" style={{ color: '#EAF4EF' }}>{deleteTarget.employee?.full_name}</span> on{' '}
              <span className="font-semibold" style={{ color: '#EAF4EF' }}>{new Date(deleteTarget.date + 'T00:00:00').toLocaleDateString('en-PH')}</span>?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
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