'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, Printer } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { useSidebar } from '@/components/SidebarContext'
import Pagination from '@/components/Pagination'
import FilterTabs from '@/components/FilterTabs'

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

const PAGE_SIZE = 10

export default function PayrollPage() {
  const router = useRouter()
  const { collapsed } = useSidebar()

  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [salaries, setSalaries] = useState<Salary[]>([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)

  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [deptFilter, setDeptFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)

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

  useEffect(() => {
    setCurrentPage(1)
  }, [search, dateFilter, deptFilter])

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

  // ─── Department options, derived from data ────────────────
  const departmentOptions = Array.from(
    new Set(payrolls.map((p) => p.employees?.department).filter(Boolean) as string[])
  ).sort()

  // ─── Filtering ───────────────────────────────────────────
  const filtered = payrolls.filter((p) => {
    const matchesSearch =
      p.employees?.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.employees?.employee_id.toLowerCase().includes(search.toLowerCase()) ||
      p.employees?.department.toLowerCase().includes(search.toLowerCase())

    const matchesDate = dateFilter ? p.payroll_date === dateFilter : true
    const matchesDept = deptFilter === 'All' ? true : p.employees?.department === deptFilter

    return matchesSearch && matchesDate && matchesDept
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // Total reflects the full filtered set, not just the current page
  const totalNet = filtered.reduce((sum, p) => sum + Number(p.net_salary || 0), 0)

  // ─── Print ───────────────────────────────────────────────
  const handlePrint = () => {
    window.print()
  }

  const inputStyle = {
    border: '1px solid #1F2924',
    backgroundColor: '#181F1B',
    color: '#EAF4EF',
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0A0E0C' }}>
      <div className="print:hidden">
        <Sidebar onLogout={handleLogout} />
      </div>

      <div
        className="flex-1 p-8 transition-all duration-200 print:ml-0 print:p-0"
        style={{ marginLeft: collapsed ? '5rem' : '16rem' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#EAF4EF' }}>
              Payroll Summary
            </h1>
            <p className="text-sm mt-1" style={{ color: '#7C8A82' }}>
              View and generate employee payroll computations
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{ border: '1px solid #1F2924', color: '#A8B8AF', backgroundColor: '#12161A' }}
            >
              <Printer size={16} />
              Print Summary
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{ backgroundColor: '#34D399', color: '#08130D' }}
            >
              <Plus size={16} strokeWidth={2.5} />
              Generate Payroll
            </button>
          </div>
        </div>

        {/* Print-only header */}
        <div className="hidden print:block mb-6">
          <h1 className="text-xl font-bold" style={{ color: '#000' }}>
            CubeTech HRMS — Payroll Summary
          </h1>
          <p className="text-xs" style={{ color: '#444' }}>
            Generated on {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4 print:hidden">
          <input
            type="text"
            placeholder="Search by name, ID, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2.5 rounded-lg text-sm outline-none flex-1 min-w-[220px]"
            style={inputStyle}
          />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg text-sm outline-none"
            style={inputStyle}
          />
          {(search || dateFilter || deptFilter !== 'All') && (
            <button
              onClick={() => {
                setSearch('')
                setDateFilter('')
                setDeptFilter('All')
              }}
              className="px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{ color: '#A8B8AF', backgroundColor: '#12161A', border: '1px solid #1F2924' }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Department filter tabs */}
        <div className="mb-5 print:hidden">
          <FilterTabs label="Department" options={departmentOptions} active={deptFilter} onChange={setDeptFilter} />
        </div>

        {/* Table — Screen view (paginated) */}
        <div
          className="rounded-[20px] overflow-hidden print:hidden"
          style={{ backgroundColor: '#12161A', border: '1px solid #1F2924' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#161B17' }}>
                <th className="text-left px-5 py-3 font-semibold text-xs uppercase" style={{ color: '#7C8A82' }}>Employee</th>
                <th className="text-left px-5 py-3 font-semibold text-xs uppercase" style={{ color: '#7C8A82' }}>Department</th>
                <th className="text-right px-5 py-3 font-semibold text-xs uppercase" style={{ color: '#7C8A82' }}>Basic Salary</th>
                <th className="text-right px-5 py-3 font-semibold text-xs uppercase" style={{ color: '#7C8A82' }}>Allowance</th>
                <th className="text-right px-5 py-3 font-semibold text-xs uppercase" style={{ color: '#7C8A82' }}>Deductions</th>
                <th className="text-right px-5 py-3 font-semibold text-xs uppercase" style={{ color: '#7C8A82' }}>Net Salary</th>
                <th className="text-left px-5 py-3 font-semibold text-xs uppercase" style={{ color: '#7C8A82' }}>Payroll Date</th>
                <th className="text-right px-5 py-3 font-semibold text-xs uppercase" style={{ color: '#7C8A82' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10" style={{ color: '#7C8A82' }}>
                    Loading payroll records...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10" style={{ color: '#7C8A82' }}>
                    No payroll records found.
                  </td>
                </tr>
              ) : (
                paginated.map((p) => (
                  <tr key={p.id} style={{ borderTop: '1px solid #1A211D' }}>
                    <td className="px-5 py-3.5">
                      <p className="font-medium" style={{ color: '#EAF4EF' }}>
                        {p.employees?.full_name ?? '—'}
                      </p>
                      <p className="text-xs" style={{ color: '#7C8A82' }}>{p.employees?.employee_id}</p>
                    </td>
                    <td className="px-5 py-3.5" style={{ color: '#A8B8AF' }}>{p.employees?.department}</td>
                    <td className="px-5 py-3.5 text-right" style={{ color: '#EAF4EF' }}>
                      ₱{Number(p.basic_salary).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 text-right" style={{ color: '#EAF4EF' }}>
                      ₱{Number(p.allowance).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 text-right" style={{ color: '#F87171' }}>
                      −₱{Number(p.deductions).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold" style={{ color: '#34D399' }}>
                      ₱{Number(p.net_salary).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5" style={{ color: '#A8B8AF' }}>
                      {new Date(p.payroll_date).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setDeleteTarget(p)}
                        title="Delete"
                        className="inline-flex p-1.5 rounded-md hover:opacity-70 transition-opacity"
                        style={{ color: '#F87171' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ backgroundColor: '#161B17', borderTop: '2px solid #1F2924' }}>
                  <td colSpan={5} className="px-5 py-3.5 text-right font-semibold text-sm" style={{ color: '#EAF4EF' }}>
                    Total Net Payroll (all filtered records):
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold" style={{ color: '#34D399' }}>
                    ₱{totalNet.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Table — Print view (full filtered set, not just the current page) */}
        <table className="hidden print:table payroll-print-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th className="num">Basic Salary</th>
              <th className="num">Allowance</th>
              <th className="num">Deductions</th>
              <th className="num">Net Salary</th>
              <th>Payroll Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.employees?.full_name ?? '—'}</strong>
                  <br />
                  <span className="muted">{p.employees?.employee_id} · {p.employees?.department}</span>
                </td>
                <td className="num">₱{Number(p.basic_salary).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                <td className="num">₱{Number(p.allowance).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                <td className="num">−₱{Number(p.deductions).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                <td className="num"><strong>₱{Number(p.net_salary).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></td>
                <td>{new Date(p.payroll_date).toLocaleDateString('en-US', { dateStyle: 'medium' })}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="num"><strong>Total Net Payroll:</strong></td>
              <td className="num"><strong>₱{totalNet.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        {!loading && filtered.length > 0 && (
          <div className="print:hidden">
            <p className="text-xs mt-3 text-center" style={{ color: '#7C8A82' }}>
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} records
            </p>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
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
          @page {
            size: A4 portrait;
            margin: 16mm 14mm;
          }
          body {
            background: white !important;
          }
          .payroll-print-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 10pt;
            color: #111;
          }
          .payroll-print-table thead {
            display: table-header-group; /* repeat header on every printed page */
          }
          .payroll-print-table tfoot {
            display: table-footer-group;
          }
          .payroll-print-table tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .payroll-print-table th,
          .payroll-print-table td {
            padding: 7px 9px;
            border-bottom: 1px solid #ddd;
            text-align: left;
            vertical-align: top;
          }
          .payroll-print-table th {
            font-size: 8.5pt;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #555;
            border-bottom: 1.5px solid #999;
          }
          .payroll-print-table .num {
            text-align: right;
          }
          .payroll-print-table .muted {
            font-size: 8.5pt;
            color: #777;
          }
          .payroll-print-table th:nth-child(1),
          .payroll-print-table td:nth-child(1) {
            width: 28%;
          }
          .payroll-print-table th:nth-child(6),
          .payroll-print-table td:nth-child(6) {
            width: 14%;
          }
          .payroll-print-table tfoot td {
            border-top: 1.5px solid #999;
            border-bottom: none;
            padding-top: 10px;
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

  const inputStyle = {
    border: '1px solid #1F2924',
    backgroundColor: '#181F1B',
    color: '#EAF4EF',
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
    >
      <div className="rounded-xl w-full max-w-md p-6" style={{ backgroundColor: '#12161A', border: '1px solid #1F2924' }}>
        <h2 className="text-lg font-bold mb-1" style={{ color: '#EAF4EF' }}>
          Generate Payroll
        </h2>
        <p className="text-xs mb-5" style={{ color: '#7C8A82' }}>
          Select an employee — salary details will pre-fill automatically.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#7C8A82' }}>
              Employee
            </label>
            <select
              value={employeeId}
              onChange={(e) => handleEmployeeSelect(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
              style={inputStyle}
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
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#7C8A82' }}>
                Basic Salary
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={basicSalary}
                onChange={(e) => setBasicSalary(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#7C8A82' }}>
                Allowance
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={allowance}
                onChange={(e) => setAllowance(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#7C8A82' }}>
                Deductions
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={deductions}
                onChange={(e) => setDeductions(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#7C8A82' }}>
                Payroll Date
              </label>
              <input
                type="date"
                value={payrollDate}
                onChange={(e) => setPayrollDate(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Live Net Salary Preview */}
          <div
            className="px-4 py-3 rounded-lg flex items-center justify-between"
            style={{ backgroundColor: '#34D39915', border: '1px solid #34D39940' }}
          >
            <span className="text-xs font-medium" style={{ color: '#34D399' }}>
              Net Salary
            </span>
            <span className="font-bold" style={{ color: '#34D399' }}>
              ₱{netSalary.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {error && (
            <div
              className="text-sm px-4 py-2.5 rounded-lg"
              style={{ backgroundColor: '#F8717120', color: '#F87171' }}
            >
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
              style={{ border: '1px solid #1F2924', color: '#A8B8AF' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: '#34D399', color: '#08130D', opacity: saving ? 0.7 : 1 }}
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
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
    >
      <div className="rounded-xl w-full max-w-sm p-6" style={{ backgroundColor: '#12161A', border: '1px solid #1F2924' }}>
        <h2 className="text-lg font-bold mb-2" style={{ color: '#EAF4EF' }}>
          Delete Payroll Record?
        </h2>
        <p className="text-sm mb-6" style={{ color: '#A8B8AF' }}>
          This will permanently delete the payroll record for{' '}
          <span className="font-semibold" style={{ color: '#EAF4EF' }}>
            {payroll.employees?.full_name}
          </span>{' '}
          dated{' '}
          <span className="font-semibold" style={{ color: '#EAF4EF' }}>
            {new Date(payroll.payroll_date).toLocaleDateString('en-US', { dateStyle: 'medium' })}
          </span>
          . This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
            style={{ border: '1px solid #1F2924', color: '#A8B8AF' }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: '#F87171', color: '#1A0A0A', opacity: deleting ? 0.7 : 1 }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}