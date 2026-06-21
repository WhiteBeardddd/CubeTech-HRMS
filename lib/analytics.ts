import { supabase } from "./supabase"; // adjust path to match your existing client

/**
 * NOTE: Column names below are based on what you confirmed:
 * - employees.department (text)
 * - attendance.status ('Present' | 'Absent' | 'Late' | 'On Leave')
 *
 * For payroll, I've assumed `net_pay` and `created_at` columns since I
 * don't have your exact payroll schema in front of me. If your columns
 * are named differently (e.g. `net_salary`, `pay_period`, `month`),
 * just swap the field names in getPayrollTrend() below.
 */

// ---------- 1. Attendance Trend ----------
export async function getAttendanceTrend(days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("attendance")
    .select("date, status")
    .gte("date", since.toISOString().split("T")[0])
    .order("date", { ascending: true });

  if (error) throw error;

  // Group by date -> count per status
  const grouped: Record<string, { date: string; Present: number; Absent: number; Late: number; "On Leave": number }> = {};

  data?.forEach((row) => {
    const day = row.date;
    if (!grouped[day]) {
      grouped[day] = { date: day, Present: 0, Absent: 0, Late: 0, "On Leave": 0 };
    }
    if (row.status in grouped[day]) {
      // @ts-ignore
      grouped[day][row.status] += 1;
    }
  });

  return Object.values(grouped);
}

// ---------- 2. Payroll Trend (monthly totals) ----------
export async function getPayrollTrend(months: number = 6) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const { data, error } = await supabase
    .from("payroll")
    .select("net_salary, payroll_date")
    .gte("payroll_date", since.toISOString().split("T")[0]);

  if (error) throw error;

  const grouped: Record<string, number> = {};

  data?.forEach((row) => {
    const monthKey = new Date(row.payroll_date).toLocaleString("default", {
      month: "short",
      year: "2-digit",
    }); // e.g. "Jun 26"
    grouped[monthKey] = (grouped[monthKey] || 0) + Number(row.net_salary || 0);
  });

  return Object.entries(grouped).map(([month, total]) => ({ month, total }));
}

// ---------- 3. Department Breakdown ----------
export async function getDepartmentBreakdown() {
  const { data, error } = await supabase
    .from("employees")
    .select("department");

  if (error) throw error;

  const grouped: Record<string, number> = {};
  data?.forEach((row) => {
    const dept = row.department || "Unassigned";
    grouped[dept] = (grouped[dept] || 0) + 1;
  });

  return Object.entries(grouped).map(([name, value]) => ({ name, value }));
}