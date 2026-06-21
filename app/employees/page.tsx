'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { useSidebar } from '@/components/SidebarContext'
import AddEmployeeModal from '@/components/Addemployeemodal'
import Pagination from '@/components/Pagination'
import FilterTabs from '@/components/FilterTabs'

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

const STATUS_COLORS: Record<string, string> = {
  Active: '#34D399',
  Resigned: '#F87171',
  'On Leave': '#F5A623',
}

const PAGE_SIZE = 10

// ─── Main Page ────────────────────────────────────────────
export default function EmployeesPage() {
  const router = useRouter()
  const { collapsed } = useSidebar()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Employee | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const admin = localStorage.getItem('admin')
    if (!admin) { router.push('/login'); return }
    fetchEmployees()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, deptFilter, statusFilter])

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

  // Unique department list, derived from actual data
  const departmentOptions = Array.from(
    new Set(employees.map((e) => e.department).filter(Boolean))
  ).sort()

  const statusOptions = ['Active', 'On Leave', 'Resigned']

  const filtered = employees.filter((e) => {
    const matchSearch = [e.full_name, e.employee_id, e.email, e.department, e.position]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
    const matchDept = deptFilter === 'All' ? true : e.department === deptFilter
    const matchStatus = statusFilter === 'All' ? true : e.employment_status === statusFilter
    return matchSearch && matchDept && matchStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

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
            <h1 className="text-2xl font-bold" style={{ color: '#EAF4EF' }}>Employees</h1>
            <p className="text-sm mt-1" style={{ color: '#7C8A82' }}>Manage all employee records</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#34D399', color: '#08130D' }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Add Employee
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name, ID, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ border: '1px solid #1F2924', backgroundColor: '#181F1B', color: '#EAF4EF' }}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-col gap-3 mb-5">
          <FilterTabs label="Department" options={departmentOptions} active={deptFilter} onChange={setDeptFilter} />
          <FilterTabs label="Status" options={statusOptions} active={statusFilter} onChange={setStatusFilter} />
        </div>

        {/* Table */}
        <div className="rounded-[20px] overflow-hidden" style={{ backgroundColor: '#12161A', border: '1px solid #1F2924' }}>
          {loading ? (
            <div className="p-8 text-sm text-center" style={{ color: '#7C8A82' }}>Loading employees...</div>
          ) : paginated.length === 0 ? (
            <div className="p-8 text-sm text-center" style={{ color: '#7C8A82' }}>No employees found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#161B17', borderBottom: '1px solid #1F2924' }}>
                    {['Emp ID', 'Full Name', 'Email', 'Contact', 'Position', 'Department', 'Date Hired', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#7C8A82' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((emp, i) => (
                    <tr key={emp.id} style={{ borderBottom: i < paginated.length - 1 ? '1px solid #1A211D' : 'none' }}>
                      <td className="px-5 py-4 font-mono text-xs" style={{ color: '#7C8A82' }}>{emp.employee_id}</td>
                      <td className="px-5 py-4 font-medium" style={{ color: '#EAF4EF' }}>{emp.full_name}</td>
                      <td className="px-5 py-4" style={{ color: '#A8B8AF' }}>{emp.email}</td>
                      <td className="px-5 py-4" style={{ color: '#A8B8AF' }}>{emp.contact_number || '—'}</td>
                      <td className="px-5 py-4" style={{ color: '#A8B8AF' }}>{emp.position || '—'}</td>
                      <td className="px-5 py-4" style={{ color: '#A8B8AF' }}>{emp.department || '—'}</td>
                      <td className="px-5 py-4" style={{ color: '#A8B8AF' }}>
                        {emp.date_hired ? new Date(emp.date_hired).toLocaleDateString('en-PH') : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: `${STATUS_COLORS[emp.employment_status]}1F`,
                            color: STATUS_COLORS[emp.employment_status],
                          }}
                        >
                          {emp.employment_status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openEdit(emp)}
                            title="Edit"
                            className="p-1.5 rounded-md hover:opacity-70 transition-opacity"
                            style={{ color: '#2DD4BF' }}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(emp)}
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
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} employees
            </p>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="rounded-2xl w-full max-w-sm mx-4 p-7 text-center" style={{ backgroundColor: '#12161A', border: '1px solid #1F2924' }}>
            <div className="text-4xl mb-4">🗑️</div>
            <h2 className="text-lg font-bold mb-2" style={{ color: '#EAF4EF' }}>Delete Employee?</h2>
            <p className="text-sm mb-6" style={{ color: '#A8B8AF' }}>
              Are you sure you want to delete <span className="font-semibold" style={{ color: '#EAF4EF' }}>{deleteTarget.full_name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-5 py-2 rounded-lg text-sm font-medium" style={{ color: '#A8B8AF', border: '1px solid #1F2924' }}>
                Cancel
              </button>
              <button onClick={handleDelete} className="px-5 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#F87171', color: '#1A0A0A' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}