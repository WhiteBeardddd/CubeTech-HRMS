'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

// ─── Types ───────────────────────────────────────────────
type Employee = {
  id: string
  employee_id: string
  full_name: string
  department: string
  employment_status: string
}

type Salary = {
  employee_id: string
  basic_salary: number
  allowance: number
  deductions: number
}

type PayrollRecord = {
  id: string
  employee_id: string
  basic_salary: number
  allowance: number
  deductions: number
  net_salary: number
  payroll_date: string
  created_at: string
  employees: {
    employee_id: string
    full_name: string
    department: string
  } | null
}

export default function PayrollPage() {
  const router = useRouter()

  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [salaries, setSalaries] = useState<Salary[]>([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)

  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<PayrollRecord | null>(null)

  // ─── Auth Guard ──────────────────────────────────────────
  useEffect(() => {
    const admin = localStorage.getItem('admin')
    if (!admin) {
      router.push('/login')
      return
    }
    fetchAll()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('admin')
    router.push('/login')
  }

  // ─── Fetch ───────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true)

    const [{ data: payrollData }, { data: empData }, { data: salData }] = await Promise.all([
      supabase
        .from('payroll')
        .select('*, employees(employee_id, full_name, department)')
        .order('payroll_date', { ascending: false }),
      supabase
        .from('employees')
        .select('id, employee_id, full_name, department, employment_status')
        .neq('employment_status', 'Resigned')
        .order('full_name'),
      supabase.from('salaries').select('employee_id, basic_salary, allowance, deductions'),
    ])

    if (payrollData) setPayrolls(payrollData as PayrollRecord[])
    if (empData) setEmployees(empData)
    if (salData) setSalaries(salData)

    setLoading(false)
  }

  // ─── Filtering ───────────────────────────────────────────
  const filtered = payrolls.filter((p) => {
    const matchesSearch =
      p.employees?.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.employees?.employee_id.toLowerCase().includes(search.toLowerCase()) ||
      p.employees?.department.toLowerCase().includes(search.toLowerCase())

    const matchesDate = dateFilter ? p.payroll_date === dateFilter : true

    return matchesSearch && matchesDate
  })

  const totalNet = filtered.reduce((sum, p) => sum + Number(p.net_salary || 0), 0)

  // ─── Print ───────────────────────────────────────────────
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F0F2F5' }}>
      <div className="print:hidden">
        <Sidebar onLogout={handleLogout} />
      </div>

      <div className="flex-1 ml-64 p-8 print:ml-0 print:p-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 print:hidden">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>
              Payroll Summary
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              View and generate employee payroll computations
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold border transition-all"
              style={{ borderColor: '#D1D5DB', color: '#1A2B4A', backgroundColor: '#fff' }}
            >
              🖨️ Print Summary
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all"
              style={{ backgroundColor: '#2F80ED' }}
            >
              + Generate Payroll
            </button>
          </div>
        </div>

        {/* Print-only header */}
        <div className="hidden print:block mb-6">
          <h1 className="text-xl font-bold" style={{ color: '#1A2B4A' }}>
            CubeTech HRMS — Payroll Summary
          </h1>
          <p className="text-xs text-gray-500">
            Generated on {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5 print:hidden">
          <input
            type="text"
            placeholder="Search by name, ID, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2.5 rounded-lg border text-sm outline-none flex-1 min-w-[220px]"
            style={{ borderColor: '#D1D5DB', backgroundColor: '#fff', color: '#1A2B4A' }}
          />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg border text-sm outline-none"
            style={{ borderColor: '#D1D5DB', backgroundColor: '#fff', color: '#1A2B4A' }}
          />
          {(search || dateFilter) && (
            <button
              onClick={() => {
                setSearch('')
                setDateFilter('')
              }}
              className="px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{ color: '#6B7280', backgroundColor: '#fff', border: '1px solid #D1D5DB' }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden print:shadow-none print:rounded-none" style={{ border: '1px solid #E5E7EB' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB' }}>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Employee</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase print:hidden">Department</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Basic Salary</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Allowance</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Deductions</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Net Salary</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Payroll Date</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">
                    Loading payroll records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">
                    No payroll records found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-t" style={{ borderColor: '#F0F2F5' }}>
                    <td className="px-5 py-3.5">
                      <p className="font-medium" style={{ color: '#1A2B4A' }}>
                        {p.employees?.full_name ?? '—'}
                      </p>
                      <p className="text-xs text-gray-400">{p.employees?.employee_id}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 print:hidden">{p.employees?.department}</td>
                    <td className="px-5 py-3.5 text-right text-gray-700">
                      ₱{Number(p.basic_salary).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-700">
                      ₱{Number(p.allowance).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 text-right" style={{ color: '#DC2626' }}>
                      −₱{Number(p.deductions).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold" style={{ color: '#059669' }}>
                      ₱{Number(p.net_salary).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {new Date(p.payroll_date).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                    </td>
                    <td className="px-5 py-3.5 text-right print:hidden">
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="text-xs font-medium px-3 py-1.5 rounded-md"
                        style={{ color: '#DC2626', backgroundColor: '#FEF2F2' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ backgroundColor: '#F9FAFB', borderTop: '2px solid #E5E7EB' }}>
                  <td colSpan={5} className="px-5 py-3.5 text-right font-semibold text-sm print:hidden" style={{ color: '#1A2B4A' }}>
                    Total Net Payroll:
                  </td>
                  <td colSpan={3} className="px-5 py-3.5 text-right font-semibold text-sm hidden print:table-cell" style={{ color: '#1A2B4A' }}>
                    Total Net Payroll:
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold" style={{ color: '#059669' }}>
                    ₱{totalNet.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="print:hidden"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {showModal && (
        <PayrollModal
          employees={employees}
          salaries={salaries}
          existingPayrolls={payrolls}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false)
            fetchAll()
          }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          payroll={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirmed={() => {
            setDeleteTarget(null)
            fetchAll()
          }}
        />
      )}

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  )
}

// ─── Generate Payroll Modal ─────────────────────────
function PayrollModal({
  employees,
  salaries,
  existingPayrolls,
  onClose,
  onSaved,
}: {
  employees: Employee[]
  salaries: Salary[]
  existingPayrolls: PayrollRecord[]
  onClose: () => void
  onSaved: () => void
}) {
  const [employeeId, setEmployeeId] = useState('')
  const [basicSalary, setBasicSalary] = useState('')
  const [allowance, setAllowance] = useState('')
  const [deductions, setDeductions] = useState('')
  const [payrollDate, setPayrollDate] = useState(new Date().toISOString().split('T')[0])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Pre-fill from salaries table when employee is selected
  const handleEmployeeSelect = (id: string) => {
    setEmployeeId(id)
    const sal = salaries.find((s) => s.employee_id === id)
    if (sal) {
      setBasicSalary(String(sal.basic_salary))
      setAllowance(String(sal.allowance))
      setDeductions(String(sal.deductions))
    } else {
      setBasicSalary('')
      setAllowance('')
      setDeductions('')
    }
  }

  const netSalary =
    (parseFloat(basicSalary) || 0) + (parseFloat(allowance) || 0) - (parseFloat(deductions) || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!employeeId) {
      setError('Please select an employee.')
      return
    }
    if (!payrollDate) {
      setError('Please select a payroll date.')
      return
    }

    // Prevent duplicate payroll for same employee + same date
    const duplicate = existingPayrolls.find(
      (p) => p.employee_id === employeeId && p.payroll_date === payrollDate
    )
    if (duplicate) {
      setError('A payroll record already exists for this employee on this date.')
      return
    }

    setSaving(true)

    const payload = {
      employee_id: employeeId,
      basic_salary: parseFloat(basicSalary) || 0,
      allowance: parseFloat(allowance) || 0,
      deductions: parseFloat(deductions) || 0,
      net_salary: netSalary,
      payroll_date: payrollDate,
    }

    const { error: dbError } = await supabase.from('payroll').insert(payload)

    if (dbError) {
      setError(dbError.message)
      setSaving(false)
      return
    }

    onSaved()
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
    >
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
        <h2 className="text-lg font-bold mb-1" style={{ color: '#1A2B4A' }}>
          Generate Payroll
        </h2>
        <p className="text-xs text-gray-400 mb-5">
          Select an employee — salary details will pre-fill automatically.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#1A2B4A' }}>
              Employee
            </label>
            <select
              value={employeeId}
              onChange={(e) => handleEmployeeSelect(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
              style={{ borderColor: '#D1D5DB', color: '#1A2B4A' }}
            >
              <option value="">Select employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} — {emp.employee_id}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#1A2B4A' }}>
                Basic Salary
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={basicSalary}
                onChange={(e) => setBasicSalary(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
                style={{ borderColor: '#D1D5DB', color: '#1A2B4A' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#1A2B4A' }}>
                Allowance
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={allowance}
                onChange={(e) => setAllowance(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
                style={{ borderColor: '#D1D5DB', color: '#1A2B4A' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#1A2B4A' }}>
                Deductions
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={deductions}
                onChange={(e) => setDeductions(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
                style={{ borderColor: '#D1D5DB', color: '#1A2B4A' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#1A2B4A' }}>
                Payroll Date
              </label>
              <input
                type="date"
                value={payrollDate}
                onChange={(e) => setPayrollDate(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
                style={{ borderColor: '#D1D5DB', color: '#1A2B4A' }}
              />
            </div>
          </div>

          {/* Live Net Salary Preview */}
          <div
            className="px-4 py-3 rounded-lg flex items-center justify-between"
            style={{ backgroundColor: '#ECFDF5' }}
          >
            <span className="text-xs font-medium" style={{ color: '#065F46' }}>
              Net Salary
            </span>
            <span className="font-bold" style={{ color: '#059669' }}>
              ₱{netSalary.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {error && (
            <div
              className="text-sm px-4 py-2.5 rounded-lg"
              style={{ backgroundColor: '#FEE2E2', color: '#B91C1C' }}
            >
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold border"
              style={{ borderColor: '#D1D5DB', color: '#1A2B4A' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: '#2F80ED', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Saving...' : 'Generate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete Confirmation Modal ─────────────────────────────
function DeleteConfirmModal({
  payroll,
  onCancel,
  onConfirmed,
}: {
  payroll: PayrollRecord
  onCancel: () => void
  onConfirmed: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    await supabase.from('payroll').delete().eq('id', payroll.id)
    setDeleting(false)
    onConfirmed()
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
    >
      <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl">
        <h2 className="text-lg font-bold mb-2" style={{ color: '#1A2B4A' }}>
          Delete Payroll Record?
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          This will permanently delete the payroll record for{' '}
          <span className="font-semibold" style={{ color: '#1A2B4A' }}>
            {payroll.employees?.full_name}
          </span>{' '}
          dated{' '}
          <span className="font-semibold" style={{ color: '#1A2B4A' }}>
            {new Date(payroll.payroll_date).toLocaleDateString('en-US', { dateStyle: 'medium' })}
          </span>
          . This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold border"
            style={{ borderColor: '#D1D5DB', color: '#1A2B4A' }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: '#DC2626', opacity: deleting ? 0.7 : 1 }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}