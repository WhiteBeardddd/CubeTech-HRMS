// app/api/payroll/by-department/route.ts
import { NextResponse } from 'next/server'
import { getPayrollByDepartment } from '@/lib/services/payrollService'

export async function GET() {
  try {
    const data = await getPayrollByDepartment()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}