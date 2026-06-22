import { NextRequest, NextResponse } from 'next/server'
import { upsertSalary, deleteSalary } from '@/lib/services/salaryService'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { employeeId, form } = await req.json()
    const record = await upsertSalary(employeeId, form, id)
    return NextResponse.json(record)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await deleteSalary(id)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}