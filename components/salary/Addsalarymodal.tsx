'use client'

import { useState } from 'react'
import type { Employee, SalaryRecord, SalaryForm } from '@/lib/services/salaryService'

const emptyForm: SalaryForm = {
  basic_salary: '',
  allowance: '',
  deductions: '',
}

type Props = {
  editTarget: SalaryRecord | null
  employees: Employee[]
  onClose: () => void
  onSaved: () => void
}

const inputStyle = {
  border: '1px solid #1F2924',
  backgroundColor: '#181F1B',
  color: '#EAF4EF',
}

export default function AddSalaryModal({ editTarget, employees, onClose, onSaved }: Props) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    editTarget?.employee_id ?? ''
  )
  const [form, setForm] = useState<SalaryForm>(
    editTarget
      ? {
          basic_salary: String(editTarget.basic_salary),
          allowance: String(editTarget.allowance),
          deductions: String(editTarget.deductions),
        }
      : emptyForm
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const computeNet = () => {
    const basic = parseFloat(form.basic_salary) || 0
    const allowance = parseFloat(form.allowance) || 0
    const deductions = parseFloat(form.deductions) || 0
    return basic + allowance - deductions
  }

  const handleSave = async () => {
    if (!selectedEmployeeId) { setError('Please select an employee.'); return }
    if (!form.basic_salary) { setError('Basic Salary is required.'); return }

    setSaving(true)
    setError('')

    try {
      const url = editTarget ? `/api/salary/${editTarget.id}` : '/api/salary'
      const method = editTarget ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: selectedEmployeeId, form }),
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

  const net = computeNet()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="rounded-2xl w-full max-w-md mx-4 p-7" style={{ backgroundColor: '#12161A', border: '1px solid #1F2924' }}>
        <h2 className="text-lg font-bold mb-5" style={{ color: '#EAF4EF' }}>
          {editTarget ? 'Edit Salary' : 'Set Employee Salary'}
        </h2>

        {/* Employee — read-only on edit, dropdown on add */}
        {editTarget ? (
          <div className="mb-4 px-3 py-2.5 rounded-lg text-sm" style={{ backgroundColor: '#181F1B', border: '1px solid #1F2924', color: '#EAF4EF' }}>
            {editTarget.employee?.full_name}{' '}
            <span className="text-xs font-mono" style={{ color: '#7C8A82' }}>
              ({editTarget.employee?.employee_id})
            </span>
          </div>
        ) : (
          <div className="mb-4">
            <label className="text-xs font-semibold block mb-1" style={{ color: '#7C8A82' }}>Employee *</label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={inputStyle}
            >
              <option value="">— Select Employee —</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name} ({e.employee_id})
                </option>
              ))}
            </select>
          </div>
        )}

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

          {/* Net preview */}
          <div
            className="rounded-lg px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: '#34D39915', border: '1px solid #34D39940' }}
          >
            <span className="text-sm font-semibold" style={{ color: '#34D399' }}>Net Salary</span>
            <span className="text-lg font-bold" style={{ color: '#34D399' }}>
              ₱{net.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {error && <p className="text-xs mt-3" style={{ color: '#F87171' }}>{error}</p>}

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
            {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Set Salary'}
          </button>
        </div>
      </div>
    </div>
  )
}

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