import { supabase } from '@/lib/supabase'
import type { Employee } from '@/lib/services/employeeService'

export type { Employee }

export type SalaryRecord = {
  id: string
  employee_id: string
  basic_salary: number
  allowance: number
  deductions: number
  net_salary: number
  updated_at: string
  employee?: Employee
}

export type SalaryForm = {
  basic_salary: string
  allowance: string
  deductions: string
}

export async function getAllSalaries() {
  const { data, error } = await supabase
    .from('salaries')
    .select(`
      *,
      employee:employees(id, employee_id, full_name, department, position, employment_status)
    `)
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as SalaryRecord[]
}

export async function getEmployeesForSalary() {
  const { data, error } = await supabase
    .from('employees')
    .select('id, employee_id, full_name, department, position, employment_status')
    .neq('employment_status', 'Resigned')
    .order('full_name')

  if (error) throw new Error(error.message)
  return data as Employee[]
}

export async function upsertSalary(employeeId: string, form: SalaryForm, editId?: string) {
  if (!employeeId) throw new Error('Please select an employee.')
  if (!form.basic_salary) throw new Error('Basic Salary is required.')

  const payload = {
    employee_id: employeeId,
    basic_salary: parseFloat(form.basic_salary) || 0,
    allowance: parseFloat(form.allowance) || 0,
    deductions: parseFloat(form.deductions) || 0,
    updated_at: new Date().toISOString(),
  }

  if (editId) {
    const { data, error } = await supabase
      .from('salaries')
      .update(payload)
      .eq('id', editId)
      .select(`*, employee:employees(id, employee_id, full_name, department, position, employment_status)`)
      .single()

    if (error) throw new Error(error.message)
    return data as SalaryRecord
  }

  const { data: existing } = await supabase
    .from('salaries')
    .select('id')
    .eq('employee_id', employeeId)
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('salaries')
      .update(payload)
      .eq('id', existing.id)
      .select(`*, employee:employees(id, employee_id, full_name, department, position, employment_status)`)
      .single()

    if (error) throw new Error(error.message)
    return data as SalaryRecord
  }

  const { data, error } = await supabase
    .from('salaries')
    .insert(payload)
    .select(`*, employee:employees(id, employee_id, full_name, department, position, employment_status)`)
    .single()

  if (error) throw new Error(error.message)
  return data as SalaryRecord
}

export async function deleteSalary(id: string) {
  const { error } = await supabase.from('salaries').delete().eq('id', id)
  if (error) throw new Error(error.message)
}