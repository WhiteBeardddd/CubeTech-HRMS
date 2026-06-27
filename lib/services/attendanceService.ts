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
  // Step 1: Get the latest date
  const { data: latestRow, error: latestError } = await supabase
    .from('attendance')
    .select('date')
    .order('date', { ascending: false })
    .limit(1)
    .single()

  if (latestError) throw new Error(latestError.message)

  const latestDate = latestRow.date
  const [y, m, d] = latestDate.split('-').map(Number)
  const sinceObj = new Date(Date.UTC(y, m - 1, d - (days - 1)))
  const sinceDate = sinceObj.toISOString().split('T')[0]

  // Step 2: Fetch with pagination to bypass the 1000-row default limit
  let allRows: { date: string; status: string }[] = []
  let from = 0
  const pageSize = 1000

  while (true) {
    const { data, error } = await supabase
      .from('attendance')
      .select('date, status')
      .gte('date', sinceDate)
      .lte('date', latestDate)
      .order('date', { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break

    allRows = allRows.concat(data)
    if (data.length < pageSize) break
    from += pageSize
  }

  // Step 3: Group in JS
  const grouped: Record<string, {
    date: string
    Present: number
    Absent: number
    Late: number
    onLeave: number
  }> = {}

  for (const row of allRows) {
    if (!grouped[row.date]) {
      grouped[row.date] = { date: row.date, Present: 0, Absent: 0, Late: 0, onLeave: 0 }
    }
    switch (row.status) {
      case 'Present':  grouped[row.date].Present++;  break
      case 'Absent':   grouped[row.date].Absent++;   break
      case 'Late':     grouped[row.date].Late++;     break
      case 'On Leave': grouped[row.date].onLeave++;  break
    }
  }

  return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date))
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