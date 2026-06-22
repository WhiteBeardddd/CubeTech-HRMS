// lib/services/dashboardService.ts

import { supabase } from '@/lib/supabase'

export async function getDashboardStats() {
  const [
    { count: total },
    { count: active },
    { count: onLeave },
    { data: payrollData },
  ] = await Promise.all([
    supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .neq('employment_status', 'Resigned'),
    supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('employment_status', 'Active'),
    supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('employment_status', 'On Leave'),
    supabase
      .from('salaries')
      .select('net_salary'),
  ])

  const totalMonthlyPayroll =
    payrollData?.reduce((sum, row) => sum + (row.net_salary || 0), 0) ?? 0

  return {
    totalEmployees: total ?? 0,
    activeEmployees: active ?? 0,
    onLeave: onLeave ?? 0,
    totalMonthlyPayroll,
  }
}