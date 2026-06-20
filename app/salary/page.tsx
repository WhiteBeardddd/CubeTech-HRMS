'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { useSidebar } from '@/components/SidebarContext'
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

const emptyForm: SalaryForm = {
  basic_salary: '',
  allowance: '',
  deductions: '',
}

// ─── Main Page ────────────────────────────────────────────
export default function SalaryPage() {
  const router = useRouter()
  const { collapsed } = useSidebar()
  const [salaries, setSalaries] = useState<Salary[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [editTarget, setEditTarget] = useState<Salary | null>(null)
  const [form, setForm] = useState<SalaryForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const admin = localStorage.getItem('admin')
    if (!admin) { router.push('/login'); return }
    fetchData()
  }, [])

  // ─── Fetch ───────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true)

    // Fetch salaries joined with employee info
    const { data: salaryData } = await supabase
      .from('salaries')
      .select(`
        *,
        employee:employees(id, employee_id, full_name, department, position, employment_status)
      `)
      .order('updated_at', { ascending: false })

    // Fetch all active/on-leave employees for the dropdown
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
      // Check if salary record already exists for this employee
      const { data: existing } = await supabase
        .from('salaries')
        .select('id')
        .eq('employee_id', selectedEmployee.id)
        .single()

      if (existing) {
        // Upsert instead of duplicate
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

  // ─── Filtered ────────────────────────────────────────────
  const filtered = salaries.filter((s) =>
    [s.employee?.full_name, s.employee?.employee_id, s.employee?.department, s.employee?.position]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const net = computeNet(form)

  // ─── Employees without a salary record (for Add dropdown) ─
  const salaryEmployeeIds = new Set(salaries.map((s) => s.employee_id))
  const unassigned = employees.filter((e) => !salaryEmployeeIds.has(e.id))

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
            <h1 className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>Salary Management</h1>
            <p className="text-sm text-gray-500 mt-1">Set and manage employee salary details</p>
          </div>
          <button
            onClick={openAdd}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#2F80ED' }}
          >
            + Set Salary
          </button>
        </div>

        {/* Search */}
        <div className="mb-5">
          <input
            type="text"
            placeholder="Search by name, ID, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ border: '1px solid #E5E7EB', backgroundColor: '#fff', color: '#1A2B4A' }}
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
          {loading ? (
            <div className="p-8 text-sm text-gray-400 text-center">Loading salary records...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-sm text-gray-400 text-center">No salary records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E5E7EB' }}>
                    {['Employee', 'Department', 'Position', 'Basic Salary', 'Allowance', 'Deductions', 'Net Salary', 'Last Updated', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: '#64748B' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                      <td className="px-5 py-4" style={{ color: '#1A2B4A' }}>
                        <p className="font-medium">{s.employee?.full_name ?? '—'}</p>
                        <p className="text-xs text-gray-400 font-mono">{s.employee?.employee_id ?? ''}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-500">{s.employee?.department ?? '—'}</td>
                      <td className="px-5 py-4 text-gray-500">{s.employee?.position ?? '—'}</td>
                      <td className="px-5 py-4 text-gray-700">₱{s.basic_salary.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-4 text-gray-700">₱{s.allowance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-4" style={{ color: '#EF4444' }}>₱{s.deductions.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-4 font-semibold" style={{ color: '#10B981' }}>₱{s.net_salary.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-4 text-gray-400 text-xs">
                        {new Date(s.updated_at).toLocaleDateString('en-PH')}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <button onClick={() => openEdit(s)} className="text-xs font-medium hover:opacity-70" style={{ color: '#2F80ED' }}>Edit</button>
                          <button onClick={() => handleDelete(s.id)} className="text-xs font-medium hover:opacity-70" style={{ color: '#EF4444' }}>Delete</button>
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
            Showing {filtered.length} of {salaries.length} salary records
          </p>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-7">
            <h2 className="text-lg font-bold mb-5" style={{ color: '#1A2B4A' }}>
              {editTarget ? 'Edit Salary' : 'Set Employee Salary'}
            </h2>

            {/* Employee selector (only on Add) */}
            {!editTarget && (
              <div className="mb-4">
                <label className="text-xs font-semibold block mb-1" style={{ color: '#64748B' }}>Employee *</label>
                <select
                  value={selectedEmployee?.id ?? ''}
                  onChange={(e) => {
                    const emp = employees.find((em) => em.id === e.target.value) ?? null
                    setSelectedEmployee(emp)
                  }}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: '1px solid #E5E7EB', color: '#1A2B4A' }}
                >
                  <option value="">— Select Employee —</option>
                  {unassigned.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.full_name} ({e.employee_id})
                    </option>
                  ))}
                </select>
                {unassigned.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">All active employees already have salary records.</p>
                )}
              </div>
            )}

            {/* Editing — show employee name read-only */}
            {editTarget && (
              <div className="mb-4 px-3 py-2.5 rounded-lg text-sm" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB', color: '#1A2B4A' }}>
                {selectedEmployee?.full_name} <span className="text-gray-400 text-xs font-mono">({selectedEmployee?.employee_id})</span>
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
              <div className="rounded-lg px-4 py-3 flex items-center justify-between" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <span className="text-sm font-semibold" style={{ color: '#065F46' }}>Net Salary</span>
                <span className="text-lg font-bold" style={{ color: '#10B981' }}>
                  ₱{net.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ color: '#64748B', border: '1px solid #E5E7EB' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: '#2F80ED' }}
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
      <label className="text-xs font-semibold" style={{ color: '#64748B' }}>{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₱</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-7 pr-3 py-2.5 rounded-lg text-sm outline-none"
          style={{ border: '1px solid #E5E7EB', color: '#1A2B4A' }}
        />
      </div>
    </div>
  )
}