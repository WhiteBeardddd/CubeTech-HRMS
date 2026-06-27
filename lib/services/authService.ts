import { supabase } from '@/lib/supabase'

export type Admin = {
  id: string
  email: string
  password: string
}

export async function loginAdmin(email: string, password: string) {
  if (!email || !password) throw new Error('Email and password are required.')

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .single()

  if (error || !data) throw new Error('Invalid email or password. Please try again.')

  return data as Admin
}