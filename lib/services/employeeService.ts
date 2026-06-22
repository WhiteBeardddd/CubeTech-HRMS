import { supabase } from '@/lib/supabase'

export type Employee = {
  id: string
  employee_id: string
  full_name: string
  email: string
  contact_number: string
  position: string
  department: string
  date_hired: string
  employment_status: 'Active' | 'Resigned' | 'On Leave'
  created_at: string
}

export type EmployeeForm = Omit<Employee, 'id' | 'created_at'>

export async function getAllEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('employee_id', { ascending: true })

  if (error) throw new Error(error.message)
  return data as Employee[]
}

export async function createEmployee(form: EmployeeForm) {
  // Validate required fields
  if (!form.employee_id || !form.full_name || !form.email) {
    throw new Error('Employee ID, Full Name, and Email are required.')
  }

  // Check for duplicate employee_id
  const { data: existingId } = await supabase
    .from('employees')
    .select('id')
    .eq('employee_id', form.employee_id)
    .single()

  if (existingId) throw new Error('An employee with this ID already exists.')

  // Check for duplicate email
  const { data: existingEmail } = await supabase
    .from('employees')
    .select('id')
    .eq('email', form.email)
    .single()

  if (existingEmail) throw new Error('An employee with this email already exists.')

  const { data, error } = await supabase
    .from('employees')
    .insert(form)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Employee
}

export async function updateEmployee(id: string, form: Partial<EmployeeForm>) {
  if (!form.full_name || !form.email) {
    throw new Error('Full Name and Email are required.')
  }

  const { data, error } = await supabase
    .from('employees')
    .update(form)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Employee
}

export async function deleteEmployee(id: string) {
  // Guard: don't delete if payroll records exist
  const { count } = await supabase
    .from('payroll')
    .select('*', { count: 'exact', head: true })
    .eq('employee_id', id)

  if (count && count > 0) {
    throw new Error('Cannot delete employee with existing payroll records.')
  }

  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function getDepartmentBreakdown() {
  const { data, error } = await supabase
    .from('employees')
    .select('department')

  if (error) throw new Error(error.message)

  const grouped: Record<string, number> = {}
  data?.forEach((row) => {
    const dept = row.department || 'Unassigned'
    grouped[dept] = (grouped[dept] || 0) + 1
  })

  return Object.entries(grouped).map(([name, value]) => ({ name, value }))
}