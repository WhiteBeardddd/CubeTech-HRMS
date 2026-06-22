import { NextRequest, NextResponse } from 'next/server'
import { getAllSalaries, getEmployeesForSalary, upsertSalary } from '@/lib/services/salaryService'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  try {
    if (type === 'employees') {
      const data = await getEmployeesForSalary()
      return NextResponse.json(data)
    }
    const data = await getAllSalaries()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { employeeId, form } = await req.json()
    const record = await upsertSalary(employeeId, form)
    return NextResponse.json(record, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}