// app/api/employees/departments/route.ts

import { NextResponse } from 'next/server'
import { getDepartmentBreakdown } from '@/lib/services/employeeService'

export async function GET() {
  try {
    const data = await getDepartmentBreakdown()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}