// app/api/activity/recent/route.ts
import { NextResponse } from 'next/server'
import { getRecentActivity } from '@/lib/services/activityService'

export async function GET() {
  try {
    const data = await getRecentActivity()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}