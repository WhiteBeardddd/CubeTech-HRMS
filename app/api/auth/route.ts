import { NextRequest, NextResponse } from 'next/server'
import { loginAdmin } from '@/lib/services/authService'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    const admin = await loginAdmin(email, password)
    return NextResponse.json(admin)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 })
  }
}