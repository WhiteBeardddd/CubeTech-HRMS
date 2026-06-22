import { supabase } from '@/lib/supabase'

export async function getRecentActivity() {
  const [{ data: attendance }, { data: payroll }] = await Promise.all([
    supabase
      .from('attendance')
      .select('id, date, status, employees(full_name, department)')
      .order('date', { ascending: false })
      .limit(10),
    supabase
      .from('payroll')
      .select('id, payroll_date, net_salary, employees(full_name, department)')
      .order('payroll_date', { ascending: false })
      .limit(5),
  ])

  const attendanceItems = (attendance ?? []).map((r: any) => ({
    id: `att-${r.id}`,
    type: 'attendance' as const,
    name: r.employees?.full_name ?? 'Unknown',
    department: r.employees?.department ?? '',
    status: r.status,
    date: r.date,
  }))

  const payrollItems = (payroll ?? []).map((r: any) => ({
    id: `pay-${r.id}`,
    type: 'payroll' as const,
    name: r.employees?.full_name ?? 'Unknown',
    department: r.employees?.department ?? '',
    amount: r.net_salary,
    date: r.payroll_date,
  }))

  return [...attendanceItems, ...payrollItems].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}