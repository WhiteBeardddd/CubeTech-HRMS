'use client'

import { useState } from 'react'
import type { Attendance, AttendanceForm, Employee } from '@/lib/services/attendanceService'

const emptyForm: AttendanceForm = {
  employee_id: '',
  date: new Date().toISOString().split('T')[0],
  time_in: '',
  time_out: '',
  status: 'Present',
}

type Props = {
  editTarget: Attendance | null
  employees: Employee[]
  onClose: () => void
  onSaved: () => void
}

const inputStyle = {
  border: '1px solid #1F2924',
  backgroundColor: '#181F1B',
  color: '#EAF4EF',
}

export default function AddAttendanceModal({ editTarget, employees, onClose, onSaved }: Props) {
  const [form, setForm] = useState<AttendanceForm>(
    editTarget
      ? {
          employee_id: editTarget.employee_id,
          date: editTarget.date,
          time_in: editTarget.time_in ?? '',
          time_out: editTarget.time_out ?? '',
          status: editTarget.status,
        }
      : emptyForm
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleTimeInChange = (val: string) => {
    setForm((prev) => {
      let suggested = prev.status
      if (val) {
        const [h, m] = val.split(':').map(Number)
        const totalMin = h * 60 + m
        suggested = totalMin > 540 ? 'Late' : 'Present'
      }
      return { ...prev, time_in: val, status: suggested }
    })
  }

  const handleSave = async () => {
    if (!form.employee_id) { setError('Please select an employee.'); return }
    if (!form.date) { setError('Date is required.'); return }
    if (!form.status) { setError('Status is required.'); return }

    setSaving(true)
    setError('')

    try {
      const url = editTarget ? `/api/attendance/${editTarget.id}` : '/api/attendance'
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
      <div className="rounded-2xl w-full max-w-md mx-4 p-7" style={{ backgroundColor: '#12161A', border: '1px solid #1F2924' }}>
        <h2 className="text-lg font-bold mb-5" style={{ color: '#EAF4EF' }}>
          {editTarget ? 'Edit Attendance' : 'Record Attendance'}
        </h2>

        <div className="flex flex-col gap-4">
          {/* Employee */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: '#7C8A82' }}>Employee *</label>
            {editTarget ? (
              <div
                className="px-3 py-2.5 rounded-lg text-sm"
                style={{ backgroundColor: '#181F1B', border: '1px solid #1F2924', color: '#EAF4EF' }}
              >
                {editTarget.employee?.full_name ?? '—'}
              </div>
            ) : (
              <select
                value={form.employee_id}
                onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                className="px-3 py-2.5 rounded-lg text-sm outline-none"
                style={inputStyle}
              >
                <option value="">— Select Employee —</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.full_name} ({e.employee_id})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: '#7C8A82' }}>Date *</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="px-3 py-2.5 rounded-lg text-sm outline-none"
              style={inputStyle}
            />
          </div>

          {/* Time In / Time Out */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: '#7C8A82' }}>Time In</label>
              <input
                type="time"
                value={form.time_in}
                onChange={(e) => handleTimeInChange(e.target.value)}
                className="px-3 py-2.5 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: '#7C8A82' }}>Time Out</label>
              <input
                type="time"
                value={form.time_out}
                onChange={(e) => setForm({ ...form, time_out: e.target.value })}
                className="px-3 py-2.5 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: '#7C8A82' }}>Status *</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as AttendanceForm['status'] })}
              className="px-3 py-2.5 rounded-lg text-sm outline-none"
              style={inputStyle}
            >
              <option>Present</option>
              <option>Late</option>
              <option>Absent</option>
              <option>On Leave</option>
            </select>
          </div>

          <p className="text-xs -mt-2" style={{ color: '#7C8A82' }}>
            💡 Status auto-suggests based on Time In — after 9:00 AM is marked Late.
          </p>
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
            {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Record'}
          </button>
        </div>
      </div>
    </div>
  )
}