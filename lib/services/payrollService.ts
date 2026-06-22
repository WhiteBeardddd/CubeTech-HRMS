import { supabase } from '@/lib/supabase'
import type { Employee } from '@/lib/services/employeeService'

export type { Employee }

export type Salary = {
  employee_id: string
  basic_salary: number
  allowance: number
  deductions: number
}

export type PayrollRecord = {
  id: string
  employee_id: string
  basic_salary: number
  allowance: number
  deductions: number
  net_salary: number
  payroll_date: string
  created_at: string
  employees: {
    employee_id: string
    full_name: string
    department: string
  } | null
}

export type PayrollForm = {
  employee_id: string
  basic_salary: string
  allowance: string
  deductions: string
  payroll_date: string
}

export async function getAllPayrolls() {
  const { data, error } = await supabase
    .from('payroll')
    .select('*, employees(employee_id, full_name, department)')
    .order('payroll_date', { ascending: false })

  if (error) throw new Error(error.message)
  return data as PayrollRecord[]
}

export async function getEmployeesForPayroll() {
  const { data, error } = await supabase
    .from('employees')
    .select('id, employee_id, full_name, department, position, employment_status')
    .neq('employment_status', 'Resigned')
    .order('full_name')

  if (error) throw new Error(error.message)
  return data as Employee[]
}

export async function getSalariesForPayroll() {
  const { data, error } = await supabase
    .from('salaries')
    .select('employee_id, basic_salary, allowance, deductions')

  if (error) throw new Error(error.message)
  return data as Salary[]
}

export async function createPayroll(form: PayrollForm, existingPayrolls: PayrollRecord[]) {
  if (!form.employee_id) throw new Error('Please select an employee.')
  if (!form.payroll_date) throw new Error('Please select a payroll date.')

  const duplicate = existingPayrolls.find(
    (p) => p.employee_id === form.employee_id && p.payroll_date === form.payroll_date
  )
  if (duplicate) throw new Error('A payroll record already exists for this employee on this date.')

  const basic = parseFloat(form.basic_salary) || 0
  const allowance = parseFloat(form.allowance) || 0
  const deductions = parseFloat(form.deductions) || 0

  const payload = {
    employee_id: form.employee_id,
    basic_salary: basic,
    allowance: allowance,
    deductions: deductions,
    net_salary: basic + allowance - deductions,
    payroll_date: form.payroll_date,
  }

  const { data, error } = await supabase
    .from('payroll')
    .insert(payload)
    .select('*, employees(employee_id, full_name, department)')
    .single()

  if (error) throw new Error(error.message)
  return data as PayrollRecord
}

export async function deletePayroll(id: string) {
  const { error } = await supabase.from('payroll').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getPayrollTrend(months: number = 6) {
  const since = new Date()
  since.setMonth(since.getMonth() - months)

  const { data, error } = await supabase
    .from('payroll')
    .select('net_salary, payroll_date')
    .gte('payroll_date', since.toISOString().split('T')[0])

  if (error) throw new Error(error.message)

  const grouped: Record<string, number> = {}
  data?.forEach((row) => {
    const monthKey = new Date(row.payroll_date).toLocaleString('default', {
      month: 'short',
      year: '2-digit',
    })
    grouped[monthKey] = (grouped[monthKey] || 0) + Number(row.net_salary || 0)
  })

  return Object.entries(grouped).map(([month, total]) => ({ month, total }))
}

export async function getPayrollByDepartment() {
  const { data: latest, error: dateError } = await supabase
    .from('payroll')
    .select('payroll_date')
    .order('payroll_date', { ascending: false })
    .limit(1)
    .single()

  if (dateError) throw new Error(dateError.message)

  const { data, error } = await supabase
    .from('payroll')
    .select('net_salary, employees(department)')
    .eq('payroll_date', latest.payroll_date)

  if (error) throw new Error(error.message)

  const totals: Record<string, number> = {}
  data?.forEach((row: any) => {
    const dept = row.employees?.department
    if (!dept) return
    totals[dept] = (totals[dept] || 0) + (row.net_salary || 0)
  })

  return {
    date: latest.payroll_date,
    departments: Object.entries(totals)
      .map(([department, total]) => ({ department, total }))
      .sort((a, b) => b.total - a.total),
  }
}