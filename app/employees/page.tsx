'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { useSidebar } from '@/components/SidebarContext'
import AddEmployeeModal from '@/components/Addemployeemodal'

// ─── Types ────────────────────────────────────────────────
type Employee = {
  id: string
  employee_id: string
  full_name: string
  email: string
  contact_number: string
  position: string
  department: string
  date_hired: string
  employment_status: 'Active' | 'Resigned' | 'On Leave'
  created_at: string
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Active:     { bg: '#D1FAE5', text: '#065F46' },
  Resigned:   { bg: '#FEE2E2', text: '#991B1B' },
  'On Leave': { bg: '#FEF3C7', text: '#92400E' },
}

// ─── Main Page ────────────────────────────────────────────
export default function EmployeesPage() {
  const router = useRouter()
  const { collapsed } = useSidebar()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Employee | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)

  useEffect(() => {
    const admin = localStorage.getItem('admin')
    if (!admin) { router.push('/login'); return }
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setEmployees(data)
    setLoading(false)
  }

  const openAdd = () => {
    setEditTarget(null)
    setShowModal(true)
  }

  const openEdit = (emp: Employee) => {
    setEditTarget(emp)
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await supabase.from('employees').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    fetchEmployees()
  }

  const handleLogout = () => {
    localStorage.removeItem('admin')
    router.push('/login')
  }

  const filtered = employees.filter((e) =>
    [e.full_name, e.employee_id, e.email, e.department, e.position]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F0F2F5' }}>
      <Sidebar onLogout={handleLogout} />

      <div
        className="flex-1 p-8 transition-all duration-200"
        style={{ marginLeft: collapsed ? '5rem' : '16rem' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>Employees</h1>
            <p className="text-sm text-gray-500 mt-1">Manage all employee records</p>
          </div>
          <button
            onClick={openAdd}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#2F80ED' }}
          >
            + Add Employee
          </button>
        </div>

        {/* Search */}
        <div className="mb-5">
          <input
            type="text"
            placeholder="Search by name, ID, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ border: '1px solid #E5E7EB', backgroundColor: '#fff', color: '#1A2B4A' }}
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
          {loading ? (
            <div className="p-8 text-sm text-gray-400 text-center">Loading employees...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-sm text-gray-400 text-center">No employees found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E5E7EB' }}>
                    {['Emp ID', 'Full Name', 'Email', 'Contact', 'Position', 'Department', 'Date Hired', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#64748B' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp, i) => (
                    <tr key={emp.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                      <td className="px-5 py-4 font-mono text-xs" style={{ color: '#64748B' }}>{emp.employee_id}</td>
                      <td className="px-5 py-4 font-medium" style={{ color: '#1A2B4A' }}>{emp.full_name}</td>
                      <td className="px-5 py-4 text-gray-500">{emp.email}</td>
                      <td className="px-5 py-4 text-gray-500">{emp.contact_number || '—'}</td>
                      <td className="px-5 py-4 text-gray-500">{emp.position || '—'}</td>
                      <td className="px-5 py-4 text-gray-500">{emp.department || '—'}</td>
                      <td className="px-5 py-4 text-gray-500">
                        {emp.date_hired ? new Date(emp.date_hired).toLocaleDateString('en-PH') : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: STATUS_COLORS[emp.employment_status]?.bg,
                            color: STATUS_COLORS[emp.employment_status]?.text,
                          }}
                        >
                          {emp.employment_status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <button onClick={() => openEdit(emp)} className="text-xs font-medium hover:opacity-70" style={{ color: '#2F80ED' }}>
                            Edit
                          </button>
                          <button onClick={() => setDeleteTarget(emp)} className="text-xs font-medium hover:opacity-70" style={{ color: '#EF4444' }}>
                            Delete
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

        {!loading && (
          <p className="text-xs text-gray-400 mt-3">
            Showing {filtered.length} of {employees.length} employees
          </p>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <AddEmployeeModal
          editTarget={editTarget}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false)
            fetchEmployees()
          }}
        />
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-7 text-center">
            <div className="text-4xl mb-4">🗑️</div>
            <h2 className="text-lg font-bold mb-2" style={{ color: '#1A2B4A' }}>Delete Employee?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete <span className="font-semibold">{deleteTarget.full_name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-5 py-2 rounded-lg text-sm font-medium" style={{ color: '#64748B', border: '1px solid #E5E7EB' }}>
                Cancel
              </button>
              <button onClick={handleDelete} className="px-5 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#EF4444' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}