'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, Printer } from 'lucide-react'
import Sidebar from '@/components/shared/Sidebar'
import { useSidebar } from '@/components/shared/SidebarContext'
import Pagination from '@/components/shared/Pagination'
import FilterTabs from '@/components/shared/FilterTabs'
import GeneratePayrollModal from '@/components/payroll/Genratepayrollmodal'
import DeletePayrollModal from '@/components/payroll/Deletepayrollmodal'
import type { Employee, Salary, PayrollRecord } from '@/lib/services/payrollService'

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

  useEffect(() => {
    const admin = localStorage.getItem('admin')
    if (!admin) { router.push('/login'); return }
    fetchAll()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, dateFilter, deptFilter])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [payRes, empRes, salRes] = await Promise.all([
        fetch('/api/payroll'),
        fetch('/api/payroll?type=employees'),
        fetch('/api/payroll?type=salaries'),
      ])
      if (!payRes.ok || !empRes.ok || !salRes.ok) throw new Error('Failed to fetch')
      const [payData, empData, salData] = await Promise.all([
        payRes.json(), empRes.json(), salRes.json(),
      ])
      setPayrolls(payData)
      setEmployees(empData)
      setSalaries(salData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin')
    router.push('/login')
  }

  const departmentOptions = Array.from(
    new Set(payrolls.map((p) => p.employees?.department).filter(Boolean) as string[])
  ).sort()

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
  const totalNet = filtered.reduce((sum, p) => sum + Number(p.net_salary || 0), 0)

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
            <h1 className="text-2xl font-bold" style={{ color: '#EAF4EF' }}>Payroll Summary</h1>
            <p className="text-sm mt-1" style={{ color: '#7C8A82' }}>View and generate employee payroll computations</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
              style={{ border: '1px solid #1F2924', color: '#A8B8AF', backgroundColor: '#12161A' }}
            >
              <Printer size={16} />
              Print Summary
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: '#34D399', color: '#08130D' }}
            >
              <Plus size={16} strokeWidth={2.5} />
              Generate Payroll
            </button>
          </div>
        </div>

        {/* Print-only header */}
        <div className="hidden print:block mb-6">
          <h1 className="text-xl font-bold">CubeTech HRMS — Payroll Summary</h1>
          <p className="text-xs">Generated on {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
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
              onClick={() => { setSearch(''); setDateFilter(''); setDeptFilter('All') }}
              className="px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{ color: '#A8B8AF', backgroundColor: '#12161A', border: '1px solid #1F2924' }}
            >
              Clear
            </button>
          )}
        </div>

        <div className="mb-5 print:hidden">
          <FilterTabs label="Department" options={departmentOptions} active={deptFilter} onChange={setDeptFilter} />
        </div>

        {/* Table — Screen */}
        <div className="rounded-[20px] overflow-hidden print:hidden" style={{ backgroundColor: '#12161A', border: '1px solid #1F2924' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#161B17' }}>
                {['Employee', 'Department', 'Basic Salary', 'Allowance', 'Deductions', 'Net Salary', 'Payroll Date', 'Actions'].map((h, i) => (
                  <th
                    key={h}
                    className={`px-5 py-3 font-semibold text-xs uppercase ${i >= 2 && i <= 5 ? 'text-right' : i === 7 ? 'text-right' : 'text-left'}`}
                    style={{ color: '#7C8A82' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10" style={{ color: '#7C8A82' }}>Loading payroll records...</td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10" style={{ color: '#7C8A82' }}>No payroll records found.</td>
                </tr>
              ) : (
                paginated.map((p) => (
                  <tr key={p.id} style={{ borderTop: '1px solid #1A211D' }}>
                    <td className="px-5 py-3.5">
                      <p className="font-medium" style={{ color: '#EAF4EF' }}>{p.employees?.full_name ?? '—'}</p>
                      <p className="text-xs" style={{ color: '#7C8A82' }}>{p.employees?.employee_id}</p>
                    </td>
                    <td className="px-5 py-3.5" style={{ color: '#A8B8AF' }}>{p.employees?.department}</td>
                    <td className="px-5 py-3.5 text-right" style={{ color: '#EAF4EF' }}>₱{Number(p.basic_salary).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td className="px-5 py-3.5 text-right" style={{ color: '#EAF4EF' }}>₱{Number(p.allowance).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td className="px-5 py-3.5 text-right" style={{ color: '#F87171' }}>−₱{Number(p.deductions).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td className="px-5 py-3.5 text-right font-semibold" style={{ color: '#34D399' }}>₱{Number(p.net_salary).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td className="px-5 py-3.5" style={{ color: '#A8B8AF' }}>{new Date(p.payroll_date).toLocaleDateString('en-US', { dateStyle: 'medium' })}</td>
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
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Table — Print */}
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
              <td />
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
        <GeneratePayrollModal
          employees={employees}
          salaries={salaries}
          existingPayrolls={payrolls}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchAll() }}
        />
      )}

      {deleteTarget && (
        <DeletePayrollModal
          payroll={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirmed={() => { setDeleteTarget(null); fetchAll() }}
        />
      )}

      <style jsx global>{`
        @media print {
          @page { size: A4 portrait; margin: 16mm 14mm; }
          body { background: white !important; }
          .payroll-print-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 10pt; color: #111; }
          .payroll-print-table thead { display: table-header-group; }
          .payroll-print-table tfoot { display: table-footer-group; }
          .payroll-print-table tr { page-break-inside: avoid; break-inside: avoid; }
          .payroll-print-table th, .payroll-print-table td { padding: 7px 9px; border-bottom: 1px solid #ddd; text-align: left; vertical-align: top; }
          .payroll-print-table th { font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.04em; color: #555; border-bottom: 1.5px solid #999; }
          .payroll-print-table .num { text-align: right; }
          .payroll-print-table .muted { font-size: 8.5pt; color: #777; }
          .payroll-print-table th:nth-child(1), .payroll-print-table td:nth-child(1) { width: 28%; }
          .payroll-print-table th:nth-child(6), .payroll-print-table td:nth-child(6) { width: 14%; }
          .payroll-print-table tfoot td { border-top: 1.5px solid #999; border-bottom: none; padding-top: 10px; }
        }
      `}</style>
    </div>
  )
}