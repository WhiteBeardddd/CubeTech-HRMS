'use client'

import { useState } from 'react'
import type { Employee, Salary, PayrollRecord, PayrollForm } from '@/lib/services/payrollService'

type Props = {
  employees: Employee[]
  salaries: Salary[]
  existingPayrolls: PayrollRecord[]
  onClose: () => void
  onSaved: () => void
}

const inputStyle = {
  border: '1px solid #1F2924',
  backgroundColor: '#181F1B',
  color: '#EAF4EF',
}

export default function GeneratePayrollModal({ employees, salaries, existingPayrolls, onClose, onSaved }: Props) {
  const [form, setForm] = useState<PayrollForm>({
    employee_id: '',
    basic_salary: '',
    allowance: '',
    deductions: '',
    payroll_date: new Date().toISOString().split('T')[0],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleEmployeeSelect = (id: string) => {
    const sal = salaries.find((s) => s.employee_id === id)
    setForm((prev) => ({
      ...prev,
      employee_id: id,
      basic_salary: sal ? String(sal.basic_salary) : '',
      allowance: sal ? String(sal.allowance) : '',
      deductions: sal ? String(sal.deductions) : '',
    }))
  }

  const netSalary =
    (parseFloat(form.basic_salary) || 0) +
    (parseFloat(form.allowance) || 0) -
    (parseFloat(form.deductions) || 0)

  const handleSave = async () => {
    if (!form.employee_id) { setError('Please select an employee.'); return }
    if (!form.payroll_date) { setError('Please select a payroll date.'); return }

    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, existingPayrolls }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        setError(error)
        return
      }

      onSaved()
    } catch {
      setError('Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="rounded-2xl w-full max-w-md mx-4 p-7" style={{ backgroundColor: '#12161A', border: '1px solid #1F2924' }}>
        <h2 className="text-lg font-bold mb-1" style={{ color: '#EAF4EF' }}>Generate Payroll</h2>
        <p className="text-xs mb-5" style={{ color: '#7C8A82' }}>
          Select an employee — salary details will pre-fill automatically.
        </p>

        <div className="flex flex-col gap-4">
          {/* Employee */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: '#7C8A82' }}>Employee *</label>
            <select
              value={form.employee_id}
              onChange={(e) => handleEmployeeSelect(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={inputStyle}
            >
              <option value="">— Select Employee —</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name} — {e.employee_id}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: '#7C8A82' }}>Basic Salary</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.basic_salary}
                onChange={(e) => setForm({ ...form, basic_salary: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: '#7C8A82' }}>Allowance</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.allowance}
                onChange={(e) => setForm({ ...form, allowance: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: '#7C8A82' }}>Deductions</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.deductions}
                onChange={(e) => setForm({ ...form, deductions: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: '#7C8A82' }}>Payroll Date *</label>
              <input
                type="date"
                value={form.payroll_date}
                onChange={(e) => setForm({ ...form, payroll_date: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Net preview */}
          <div
            className="px-4 py-3 rounded-lg flex items-center justify-between"
            style={{ backgroundColor: '#34D39915', border: '1px solid #34D39940' }}
          >
            <span className="text-xs font-medium" style={{ color: '#34D399' }}>Net Salary</span>
            <span className="font-bold" style={{ color: '#34D399' }}>
              ₱{netSalary.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {error && (
          <div
            className="text-sm px-4 py-2.5 rounded-lg mt-3"
            style={{ backgroundColor: '#F8717120', color: '#F87171' }}
          >
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
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
            {saving ? 'Saving...' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  )
}