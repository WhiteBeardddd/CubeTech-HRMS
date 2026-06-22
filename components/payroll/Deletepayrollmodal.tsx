'use client'

import { useState } from 'react'
import type { PayrollRecord } from '@/lib/services/payrollService'

type Props = {
  payroll: PayrollRecord
  onCancel: () => void
  onConfirmed: () => void
}

export default function DeletePayrollModal({ payroll, onCancel, onConfirmed }: Props) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    setDeleting(true)
    setError('')

    try {
      const res = await fetch(`/api/payroll/${payroll.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const { error } = await res.json()
        setError(error)
        return
      }

      onConfirmed()
    } catch {
      setError('Something went wrong.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="rounded-2xl w-full max-w-sm mx-4 p-7 text-center" style={{ backgroundColor: '#12161A', border: '1px solid #1F2924' }}>
        <div className="text-4xl mb-4">🗑️</div>
        <h2 className="text-lg font-bold mb-2" style={{ color: '#EAF4EF' }}>Delete Payroll Record?</h2>
        <p className="text-sm mb-2" style={{ color: '#A8B8AF' }}>
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
        {error && <p className="text-xs mb-4" style={{ color: '#F87171' }}>{error}</p>}
        <div className="flex justify-center gap-3 mt-4">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-lg text-sm font-medium"
            style={{ color: '#A8B8AF', border: '1px solid #1F2924' }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
            style={{ backgroundColor: '#F87171', color: '#1A0A0A' }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}