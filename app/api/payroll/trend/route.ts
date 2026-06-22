// app/api/payroll/trend/route.ts
import { NextResponse } from 'next/server'
import { getPayrollTrend } from '@/lib/services/payrollService'

export async function GET() {
  try {
    const data = await getPayrollTrend()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}