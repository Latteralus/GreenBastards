-- ============================================================================
-- Employee Management System Migration
-- Date: 2026-02-24
-- Purpose: Add employees, paystubs, and multi-employee order assignments
-- ============================================================================

-- Step 1: Extend accounts table
alter table accounts
  add column if not exists full_name text,
  add column if not exists ic_name text,
  add column if not exists discord_username text,
  add column if not exists email text,
  add column if not exists hire_date date,
  add column if not exists wage numeric(10,2),
  add column if not exists wage_type text check (
    wage_type in ('Hourly', 'Salary', 'Per Order')
  ),
  add column if not exists status text default 'Active' check (
    status in ('Active', 'Terminated')
  ),
  add column if not exists contract_text text,
  add column if not exists contract_agreed boolean default false,
  add column if not exists contract_agreed_at timestamptz;

-- Ensure existing accounts get a default status
update accounts set status = 'Active' where status is null;

-- Step 2: Add paystubs table
create table if not exists paystubs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id),
  transaction_id uuid references transactions(id),
  pay_period_start date,
  pay_period_end date,
  hours_worked numeric(6,2),
  hourly_rate numeric(10,2),
  gross_pay numeric(10,2),
  notes text,
  created_at timestamptz default now()
);

-- Step 3: Add order assignments table
alter table orders drop column if exists assigned_to;

create table if not exists order_assignments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  account_id uuid references accounts(id),
  ic_name text not null,
  assigned_at timestamptz default now(),
  unique(order_id, account_id)
);
