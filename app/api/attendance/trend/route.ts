// app/api/attendance/trend/route.ts
import { NextResponse } from 'next/server'
import { getAttendanceTrend } from '@/lib/services/attendanceService'

export async function GET() {
  try {
    const data = await getAttendanceTrend()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}