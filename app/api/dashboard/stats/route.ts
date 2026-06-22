// app/api/dashboard/stats/route.ts

import { NextResponse } from 'next/server'
import { getDashboardStats } from '@/lib/services/dashboardService'

export async function GET() {
  try {
    const stats = await getDashboardStats()
    return NextResponse.json(stats)
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}