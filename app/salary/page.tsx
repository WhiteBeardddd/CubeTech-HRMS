'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Plus, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import Sidebar from '@/components/shared/Sidebar'
import { useSidebar } from '@/components/shared/SidebarContext'
import Pagination from '@/components/shared/Pagination'
import FilterTabs from '@/components/shared/FilterTabs'
import AddSalaryModal from '@/components/salary/Addsalarymodal'
import type { SalaryRecord, Employee } from '@/lib/services/salaryService'

type SortKey = 'full_name' | 'basic_salary' | 'allowance' | 'deductions' | 'net_salary' | 'updated_at'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 10

function SortableHeader({
  label, sortKey, activeKey, activeDir, onSort,
}: {
  label: string
  sortKey: SortKey
  activeKey: SortKey | null
  activeDir: SortDir
  onSort: (key: SortKey) => void
}) {
  const isActive = activeKey === sortKey
  return (
    <th
      onClick={() => onSort(sortKey)}
      className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider cursor-pointer select-none"
      style={{ color: isActive ? '#34D399' : '#7C8A82' }}
    >
      <div className="flex items-center gap-1.5">
        {label}
        {isActive
          ? activeDir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
          : <ArrowUpDown size={13} style={{ opacity: 0.4 }} />}
      </div>
    </th>
  )
}

export default function SalaryPage() {
  const router = useRouter()
  const { collapsed } = useSidebar()
  const [salaries, setSalaries] = useState<SalaryRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('All')
  const [roleFilter, setRoleFilter] = useState('All')
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<SalaryRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SalaryRecord | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const admin = localStorage.getItem('admin')
    if (!admin) { router.push('/login'); return }
    fetchData()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, deptFilter, roleFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [salRes, empRes] = await Promise.all([
        fetch('/api/salary'),
        fetch('/api/salary?type=employees'),
      ])
      if (!salRes.ok || !empRes.ok) throw new Error('Failed to fetch')
      const [salData, empData] = await Promise.all([salRes.json(), empRes.json()])
      setSalaries(salData)
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

  const openEdit = (salary: SalaryRecord) => {
    setEditTarget(salary)
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteError('')
    try {
      const res = await fetch(`/api/salary/${deleteTarget.id}`, { method: 'DELETE' })
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

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const departmentOptions = Array.from(
    new Set(salaries.map((s) => s.employee?.department).filter(Boolean) as string[])
  ).sort()

  const roleOptions = Array.from(
    new Set(salaries.map((s) => s.employee?.position).filter(Boolean) as string[])
  ).sort()

  const salaryEmployeeIds = new Set(salaries.map((s) => s.employee_id))
  const unassigned = employees.filter((e) => !salaryEmployeeIds.has(e.id))

  let filtered = salaries.filter((s) => {
    const matchSearch = [s.employee?.full_name, s.employee?.employee_id, s.employee?.department, s.employee?.position]
      .join(' ').toLowerCase().includes(search.toLowerCase())
    const matchDept = deptFilter === 'All' ? true : s.employee?.department === deptFilter
    const matchRole = roleFilter === 'All' ? true : s.employee?.position === roleFilter
    return matchSearch && matchDept && matchRole
  })

  if (sortKey) {
    filtered = [...filtered].sort((a, b) => {
      let aVal: string | number
      let bVal: string | number

      if (sortKey === 'full_name') {
        aVal = a.employee?.full_name ?? ''
        bVal = b.employee?.full_name ?? ''
      } else if (sortKey === 'updated_at') {
        aVal = new Date(a.updated_at).getTime()
        bVal = new Date(b.updated_at).getTime()
      } else {
        aVal = a[sortKey]
        bVal = b[sortKey]
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })
  }

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
            <h1 className="text-2xl font-bold" style={{ color: '#EAF4EF' }}>Salary Management</h1>
            <p className="text-sm mt-1" style={{ color: '#7C8A82' }}>Set and manage employee salary details</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#34D399', color: '#08130D' }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Set Salary
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name, ID, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2.5 rounded-lg text-sm outline-none"
            style={inputStyle}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-col gap-3 mb-5">
          <FilterTabs label="Department" options={departmentOptions} active={deptFilter} onChange={setDeptFilter} />
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7C8A82' }}>Role</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                border: '1px solid #1F2924',
                backgroundColor: '#181F1B',
                color: roleFilter === 'All' ? '#7C8A82' : '#EAF4EF',
              }}
            >
              <option value="All">All Roles</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-[20px] overflow-hidden" style={{ backgroundColor: '#12161A', border: '1px solid #1F2924' }}>
          {loading ? (
            <div className="p-8 text-sm text-center" style={{ color: '#7C8A82' }}>Loading salary records...</div>
          ) : paginated.length === 0 ? (
            <div className="p-8 text-sm text-center" style={{ color: '#7C8A82' }}>No salary records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#161B17', borderBottom: '1px solid #1F2924' }}>
                    <SortableHeader label="Employee" sortKey="full_name" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} />
                    <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#7C8A82' }}>Department</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#7C8A82' }}>Position</th>
                    <SortableHeader label="Basic Salary" sortKey="basic_salary" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Allowance" sortKey="allowance" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Deductions" sortKey="deductions" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Net Salary" sortKey="net_salary" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Last Updated" sortKey="updated_at" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} />
                    <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#7C8A82' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: i < paginated.length - 1 ? '1px solid #1A211D' : 'none' }}>
                      <td className="px-5 py-4" style={{ color: '#EAF4EF' }}>
                        <p className="font-medium">{s.employee?.full_name ?? '—'}</p>
                        <p className="text-xs font-mono" style={{ color: '#7C8A82' }}>{s.employee?.employee_id ?? ''}</p>
                      </td>
                      <td className="px-5 py-4" style={{ color: '#A8B8AF' }}>{s.employee?.department ?? '—'}</td>
                      <td className="px-5 py-4" style={{ color: '#A8B8AF' }}>{s.employee?.position ?? '—'}</td>
                      <td className="px-5 py-4" style={{ color: '#EAF4EF' }}>₱{s.basic_salary.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-4" style={{ color: '#EAF4EF' }}>₱{s.allowance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-4" style={{ color: '#F87171' }}>₱{s.deductions.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-4 font-semibold" style={{ color: '#34D399' }}>₱{s.net_salary.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-4 text-xs" style={{ color: '#7C8A82' }}>
                        {new Date(s.updated_at).toLocaleDateString('en-PH')}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openEdit(s)}
                            title="Edit"
                            className="p-1.5 rounded-md hover:opacity-70 transition-opacity"
                            style={{ color: '#2DD4BF' }}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => { setDeleteError(''); setDeleteTarget(s) }}
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
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} salary records
            </p>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <AddSalaryModal
          editTarget={editTarget}
          employees={unassigned}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchData() }}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="rounded-2xl w-full max-w-sm mx-4 p-7 text-center" style={{ backgroundColor: '#12161A', border: '1px solid #1F2924' }}>
            <div className="text-4xl mb-4">🗑️</div>
            <h2 className="text-lg font-bold mb-2" style={{ color: '#EAF4EF' }}>Remove Salary Record?</h2>
            <p className="text-sm mb-2" style={{ color: '#A8B8AF' }}>
              Are you sure you want to remove the salary record for{' '}
              <span className="font-semibold" style={{ color: '#EAF4EF' }}>{deleteTarget.employee?.full_name}</span>?
              This action cannot be undone.
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