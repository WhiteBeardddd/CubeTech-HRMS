# 🏢 Mini HRMS System

## About the System

The **Mini HRMS (Human Resource Management System)** is a web-based admin tool designed to help organizations manage their workforce efficiently. It allows an admin to handle core HR operations in one place — from tracking employee records and monitoring attendance, to computing salaries and generating payroll summaries.

The system is built with simplicity and usability in mind, making it easy for non-technical admin users to navigate and operate day-to-day HR tasks without hassle.

---

## 🛠 Tech Stack

| Layer    | Technology                |
|----------|---------------------------|
| Frontend | React (Next.js)           |
| Backend  | Next.js API Routes        |
| Database | Supabase (PostgreSQL)     |
| Styling  | Tailwind CSS              |

---

## ✨ Core Features

- **Admin Login** — Secure login page for authorized admin access
- **Employee Management** — Add, view, update, and remove employee records including position, department, and employment status
- **Salary Management** — Set and manage each employee's basic salary, allowances, and deductions with automatic net salary computation
- **Attendance Tracking** — Record and monitor daily employee attendance with statuses such as Present, Late, Absent, or On Leave
- **Payroll Summary** — View a complete breakdown of employee salary computations per payroll period
- **Dashboard** — At-a-glance overview of total employees, active headcount, employees on leave, and total monthly payroll

---

## 🧮 Salary Computation

```
Net Salary = Basic Salary + Allowance - Deductions
```

---

## ⚙️ How to Run the Project

### 1. Clone the Repository

```bash
git clone https://github.com/WhiteBeardddd/CubeTech-HRMS.git
cd CubeTech-HRMS
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a free project at [https://supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy your **Project URL** and **Anon Key**

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Set Up the Database

In your Supabase project, open the **SQL Editor** and run the contents of:

```
database/schema.sql
```

### 6. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Default Admin Credentials

```
Email:    admin@test.com
Password: admin123
```

---

## 📁 Folder Structure

```
mini-hrms/
├── app/
│   ├── login/             # Login page
│   ├── dashboard/         # Dashboard overview
│   ├── employees/         # Employee management
│   ├── salary/            # Salary management
│   ├── attendance/        # Attendance tracking
│   └── payroll/           # Payroll summary
├── components/            # Reusable UI components
├── lib/                   # Supabase client setup
├── database/
│   └── schema.sql         # Database tables
├── public/                # Static assets
└── .env.local             # Environment variables (not committed)
```

---

## 📸 Screenshots

> *(To be added once the system is complete)*

---

## 👤 Author

**Charles Benedict Boquecosa**
