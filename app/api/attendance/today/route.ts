// app/api/attendance/today/route.ts
import { NextResponse } from 'next/server'
import { getTodaySnapshot } from '@/lib/services/attendanceService'

export async function GET() {
  try {
    const data = await getTodaySnapshot()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}