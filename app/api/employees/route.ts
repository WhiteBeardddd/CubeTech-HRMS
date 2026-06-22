import { NextRequest, NextResponse } from 'next/server'
import { getAllEmployees, createEmployee } from '@/lib/services/employeeService'

export async function GET() {
  try {
    const data = await getAllEmployees()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const employee = await createEmployee(body)
    return NextResponse.json(employee, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}