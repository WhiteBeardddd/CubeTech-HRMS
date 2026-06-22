'use client'

import { useState } from 'react'
import type { Employee, EmployeeForm } from '@/lib/services/employeeService'

const emptyForm: EmployeeForm = {
  employee_id: '',
  full_name: '',
  email: '',
  contact_number: '',
  position: '',
  department: '',
  date_hired: '',
  employment_status: 'Active',
}

type Props = {
  editTarget: Employee | null
  onClose: () => void
  onSaved: () => void
}

export default function AddEmployeeModal({ editTarget, onClose, onSaved }: Props) {
  const [form, setForm] = useState<EmployeeForm>(
    editTarget
      ? {
          employee_id: editTarget.employee_id,
          full_name: editTarget.full_name,
          email: editTarget.email,
          contact_number: editTarget.contact_number,
          position: editTarget.position,
          department: editTarget.department,
          date_hired: editTarget.date_hired,
          employment_status: editTarget.employment_status,
        }
      : emptyForm
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!form.employee_id || !form.full_name || !form.email) {
      setError('Employee ID, Full Name, and Email are required.')
      return
    }
    setSaving(true)
    setError('')

    try {
      const url = editTarget ? `/api/employees/${editTarget.id}` : '/api/employees'
      const method = editTarget ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
      <div className="rounded-2xl w-full max-w-lg mx-4 p-7" style={{ backgroundColor: '#12161A', border: '1px solid #1F2924' }}>
        <h2 className="text-lg font-bold mb-5" style={{ color: '#EAF4EF' }}>
          {editTarget ? 'Edit Employee' : 'Add New Employee'}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Employee ID *" value={form.employee_id} onChange={(v) => setForm({ ...form, employee_id: v })} placeholder="EMP-001" />
          <Field label="Full Name *" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} placeholder="Juan Dela Cruz" />
          <Field label="Email *" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="juan@email.com" type="email" />
          <Field label="Contact Number" value={form.contact_number} onChange={(v) => setForm({ ...form, contact_number: v })} placeholder="09xxxxxxxxx" />
          <Field label="Position" value={form.position} onChange={(v) => setForm({ ...form, position: v })} placeholder="Developer" />
          <Field label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} placeholder="Engineering" />
          <Field label="Date Hired" value={form.date_hired} onChange={(v) => setForm({ ...form, date_hired: v })} type="date" />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: '#7C8A82' }}>Employment Status</label>
            <select
              value={form.employment_status}
              onChange={(e) => setForm({ ...form, employment_status: e.target.value as EmployeeForm['employment_status'] })}
              className="px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: '1px solid #1F2924', backgroundColor: '#181F1B', color: '#EAF4EF' }}
            >
              <option>Active</option>
              <option>Resigned</option>
              <option>On Leave</option>
            </select>
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
            {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Add Employee'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder = '', type = 'text' }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold" style={{ color: '#7C8A82' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="px-3 py-2.5 rounded-lg text-sm outline-none"
        style={{ border: '1px solid #1F2924', backgroundColor: '#181F1B', color: '#EAF4EF' }}
      />
    </div>
  )
}