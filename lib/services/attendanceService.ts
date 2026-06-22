import { supabase } from '@/lib/supabase'

export type Employee = {
  id: string
  employee_id: string
  full_name: string
  department: string
  position: string
}

export type Attendance = {
  id: string
  employee_id: string
  date: string
  time_in: string | null
  time_out: string | null
  status: 'Present' | 'Late' | 'Absent' | 'On Leave'
  created_at: string
  employee?: Employee
}

export type AttendanceForm = {
  employee_id: string
  date: string
  time_in: string
  time_out: string
  status: 'Present' | 'Late' | 'Absent' | 'On Leave'
}

export async function getAllAttendance() {
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      employee:employees(id, employee_id, full_name, department, position)
    `)
    .order('date', { ascending: false })

  if (error) throw new Error(error.message)
  return data as Attendance[]
}

export async function getEmployeesForAttendance() {
  const { data, error } = await supabase
    .from('employees')
    .select('id, employee_id, full_name, department, position')
    .neq('employment_status', 'Resigned')
    .order('full_name')

  if (error) throw new Error(error.message)
  return data as Employee[]
}

export async function createAttendance(form: AttendanceForm) {
  if (!form.employee_id) throw new Error('Please select an employee.')
  if (!form.date) throw new Error('Date is required.')
  if (!form.status) throw new Error('Status is required.')

  const { data: existing } = await supabase
    .from('attendance')
    .select('id')
    .eq('employee_id', form.employee_id)
    .eq('date', form.date)
    .single()

  if (existing) throw new Error('Attendance for this employee on this date already exists. Edit the existing record instead.')

  const payload = {
    employee_id: form.employee_id,
    date: form.date,
    time_in: form.time_in || null,
    time_out: form.time_out || null,
    status: form.status,
  }

  const { data, error } = await supabase
    .from('attendance')
    .insert(payload)
    .select(`*, employee:employees(id, employee_id, full_name, department, position)`)
    .single()

  if (error) throw new Error(error.message)
  return data as Attendance
}

export async function updateAttendance(id: string, form: AttendanceForm) {
  if (!form.date) throw new Error('Date is required.')
  if (!form.status) throw new Error('Status is required.')

  const payload = {
    employee_id: form.employee_id,
    date: form.date,
    time_in: form.time_in || null,
    time_out: form.time_out || null,
    status: form.status,
  }

  const { data, error } = await supabase
    .from('attendance')
    .update(payload)
    .eq('id', id)
    .select(`*, employee:employees(id, employee_id, full_name, department, position)`)
    .single()

  if (error) throw new Error(error.message)
  return data as Attendance
}

export async function deleteAttendance(id: string) {
  const { error } = await supabase
    .from('attendance')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function getAttendanceTrend(days: number = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from('attendance')
    .select('date, status')
    .gte('date', since.toISOString().split('T')[0])
    .order('date', { ascending: true })

  if (error) throw new Error(error.message)

  const grouped: Record<string, { date: string; Present: number; Absent: number; Late: number; 'On Leave': number }> = {}

  data?.forEach((row) => {
    const day = row.date
    if (!grouped[day]) {
      grouped[day] = { date: day, Present: 0, Absent: 0, Late: 0, 'On Leave': 0 }
    }
    if (row.status in grouped[day]) {
      // @ts-ignore
      grouped[day][row.status] += 1
    }
  })

  return Object.values(grouped)
}

export async function getTodaySnapshot() {
  const { data: latest, error: dateError } = await supabase
    .from('attendance')
    .select('date')
    .order('date', { ascending: false })
    .limit(1)
    .single()

  if (dateError) throw new Error(dateError.message)

  const { data, error } = await supabase
    .from('attendance')
    .select('status')
    .eq('date', latest.date)

  if (error) throw new Error(error.message)

  const counts: Record<string, number> = {}
  data?.forEach((r) => {
    counts[r.status] = (counts[r.status] || 0) + 1
  })

  return { date: latest.date, counts }
}