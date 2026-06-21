'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Plus, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { useSidebar } from '@/components/SidebarContext'
import Pagination from '@/components/Pagination'
import FilterTabs from '@/components/FilterTabs'

// ─── Types ────────────────────────────────────────────────
type Employee = {
  id: string
  employee_id: string
  full_name: string
  department: string
  position: string
  employment_status: string
}

type Salary = {
  id: string
  employee_id: string
  basic_salary: number
  allowance: number
  deductions: number
  net_salary: number
  updated_at: string
  employee?: Employee
}

type SalaryForm = {
  basic_salary: string
  allowance: string
  deductions: string
}

type SortKey = 'full_name' | 'basic_salary' | 'allowance' | 'deductions' | 'net_salary' | 'updated_at'
type SortDir = 'asc' | 'desc'

const emptyForm: SalaryForm = {
  basic_salary: '',
  allowance: '',
  deductions: '',
}

const PAGE_SIZE = 10

// ─── Sortable Header Cell ──────────────────────────────────
function SortableHeader({
  label,
  sortKey,
  activeKey,
  activeDir,
  onSort,
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
        {isActive ? (
          activeDir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
        ) : (
          <ArrowUpDown size={13} style={{ opacity: 0.4 }} />
        )}
      </div>
    </th>
  )
}

// ─── Main Page ────────────────────────────────────────────
export default function SalaryPage() {
  const router = useRouter()
  const { collapsed } = useSidebar()
  const [salaries, setSalaries] = useState<Salary[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('All')
  const [roleFilter, setRoleFilter] = useState('All')
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [showModal, setShowModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [editTarget, setEditTarget] = useState<Salary | null>(null)
  const [form, setForm] = useState<SalaryForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const admin = localStorage.getItem('admin')
    if (!admin) { router.push('/login'); return }
    fetchData()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, deptFilter, roleFilter])

  // ─── Fetch ───────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true)

    const { data: salaryData } = await supabase
      .from('salaries')
      .select(`
        *,
        employee:employees(id, employee_id, full_name, department, position, employment_status)
      `)
      .order('updated_at', { ascending: false })

    const { data: empData } = await supabase
      .from('employees')
      .select('id, employee_id, full_name, department, position, employment_status')
      .neq('employment_status', 'Resigned')
      .order('full_name')

    if (salaryData) setSalaries(salaryData)
    if (empData) setEmployees(empData)
    setLoading(false)
  }

  // ─── Compute net salary ──────────────────────────────────
  const computeNet = (f: SalaryForm) => {
    const basic = parseFloat(f.basic_salary) || 0
    const allowance = parseFloat(f.allowance) || 0
    const deductions = parseFloat(f.deductions) || 0
    return basic + allowance - deductions
  }

  // ─── Open Add Modal ──────────────────────────────────────
  const openAdd = () => {
    setEditTarget(null)
    setSelectedEmployee(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  // ─── Open Edit Modal ─────────────────────────────────────
  const openEdit = (salary: Salary) => {
    setEditTarget(salary)
    setSelectedEmployee(salary.employee ?? null)
    setForm({
      basic_salary: String(salary.basic_salary),
      allowance: String(salary.allowance),
      deductions: String(salary.deductions),
    })
    setError('')
    setShowModal(true)
  }

  // ─── Save ────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedEmployee) { setError('Please select an employee.'); return }
    if (!form.basic_salary) { setError('Basic Salary is required.'); return }

    setSaving(true)
    setError('')

    const payload = {
      employee_id: selectedEmployee.id,
      basic_salary: parseFloat(form.basic_salary) || 0,
      allowance: parseFloat(form.allowance) || 0,
      deductions: parseFloat(form.deductions) || 0,
      updated_at: new Date().toISOString(),
    }

    if (editTarget) {
      const { error } = await supabase.from('salaries').update(payload).eq('id', editTarget.id)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { data: existing } = await supabase
        .from('salaries')
        .select('id')
        .eq('employee_id', selectedEmployee.id)
        .single()

      if (existing) {
        const { error } = await supabase.from('salaries').update(payload).eq('id', existing.id)
        if (error) { setError(error.message); setSaving(false); return }
      } else {
        const { error } = await supabase.from('salaries').insert(payload)
        if (error) { setError(error.message); setSaving(false); return }
      }
    }

    setSaving(false)
    setShowModal(false)
    fetchData()
  }

  // ─── Delete ──────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Remove this salary record?')) return
    await supabase.from('salaries').delete().eq('id', id)
    fetchData()
  }

  const handleLogout = () => {
    localStorage.removeItem('admin')
    router.push('/login')
  }

  // ─── Sort handler ────────────────────────────────────────
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  // Department / Role options, derived from data
  const departmentOptions = Array.from(
    new Set(salaries.map((s) => s.employee?.department).filter(Boolean) as string[])
  ).sort()
  const roleOptions = Array.from(
    new Set(salaries.map((s) => s.employee?.position).filter(Boolean) as string[])
  ).sort()

  // ─── Filtered ────────────────────────────────────────────
  let filtered = salaries.filter((s) => {
    const matchSearch = [s.employee?.full_name, s.employee?.employee_id, s.employee?.department, s.employee?.position]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
    const matchDept = deptFilter === 'All' ? true : s.employee?.department === deptFilter
    const matchRole = roleFilter === 'All' ? true : s.employee?.position === roleFilter
    return matchSearch && matchDept && matchRole
  })

  // ─── Sorted ──────────────────────────────────────────────
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

  const net = computeNet(form)

  // ─── Employees without a salary record (for Add dropdown) ─
  const salaryEmployeeIds = new Set(salaries.map((s) => s.employee_id))
  const unassigned = employees.filter((e) => !salaryEmployeeIds.has(e.id))

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
          <FilterTabs label="Role" options={roleOptions} active={roleFilter} onChange={setRoleFilter} />
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
                            onClick={() => handleDelete(s.id)}
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

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="rounded-2xl w-full max-w-md mx-4 p-7" style={{ backgroundColor: '#12161A', border: '1px solid #1F2924' }}>
            <h2 className="text-lg font-bold mb-5" style={{ color: '#EAF4EF' }}>
              {editTarget ? 'Edit Salary' : 'Set Employee Salary'}
            </h2>

            {/* Employee selector (only on Add) */}
            {!editTarget && (
              <div className="mb-4">
                <label className="text-xs font-semibold block mb-1" style={{ color: '#7C8A82' }}>Employee *</label>
                <select
                  value={selectedEmployee?.id ?? ''}
                  onChange={(e) => {
                    const emp = employees.find((em) => em.id === e.target.value) ?? null
                    setSelectedEmployee(emp)
                  }}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={inputStyle}
                >
                  <option value="">— Select Employee —</option>
                  {unassigned.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.full_name} ({e.employee_id})
                    </option>
                  ))}
                </select>
                {unassigned.length === 0 && (
                  <p className="text-xs mt-1" style={{ color: '#7C8A82' }}>All active employees already have salary records.</p>
                )}
              </div>
            )}

            {/* Editing — show employee name read-only */}
            {editTarget && (
              <div className="mb-4 px-3 py-2.5 rounded-lg text-sm" style={{ backgroundColor: '#181F1B', border: '1px solid #1F2924', color: '#EAF4EF' }}>
                {selectedEmployee?.full_name} <span className="text-xs font-mono" style={{ color: '#7C8A82' }}>({selectedEmployee?.employee_id})</span>
              </div>
            )}

            {/* Salary fields */}
            <div className="flex flex-col gap-4">
              <NumberField
                label="Basic Salary *"
                value={form.basic_salary}
                onChange={(v) => setForm({ ...form, basic_salary: v })}
                placeholder="0.00"
              />
              <NumberField
                label="Allowance"
                value={form.allowance}
                onChange={(v) => setForm({ ...form, allowance: v })}
                placeholder="0.00"
              />
              <NumberField
                label="Deductions"
                value={form.deductions}
                onChange={(v) => setForm({ ...form, deductions: v })}
                placeholder="0.00"
              />

              {/* Net salary preview */}
              <div className="rounded-lg px-4 py-3 flex items-center justify-between" style={{ backgroundColor: '#34D39915', border: '1px solid #34D39940' }}>
                <span className="text-sm font-semibold" style={{ color: '#34D399' }}>Net Salary</span>
                <span className="text-lg font-bold" style={{ color: '#34D399' }}>
                  ₱{net.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
              </div>
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
                {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Set Salary'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Number Field ─────────────────────────────────────────
function NumberField({
  label, value, onChange, placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold" style={{ color: '#7C8A82' }}>{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#7C8A82' }}>₱</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-7 pr-3 py-2.5 rounded-lg text-sm outline-none"
          style={{ border: '1px solid #1F2924', backgroundColor: '#181F1B', color: '#EAF4EF' }}
        />
      </div>
    </div>
  )
}