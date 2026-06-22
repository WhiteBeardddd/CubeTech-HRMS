import { NextRequest, NextResponse } from 'next/server'
import {
  getAllPayrolls,
  getEmployeesForPayroll,
  getSalariesForPayroll,
  createPayroll,
} from '@/lib/services/payrollService'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  try {
    if (type === 'employees') {
      const data = await getEmployeesForPayroll()
      return NextResponse.json(data)
    }
    if (type === 'salaries') {
      const data = await getSalariesForPayroll()
      return NextResponse.json(data)
    }
    const data = await getAllPayrolls()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { form, existingPayrolls } = await req.json()
    const record = await createPayroll(form, existingPayrolls)
    return NextResponse.json(record, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}