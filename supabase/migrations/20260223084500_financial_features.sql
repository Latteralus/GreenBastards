-- 1. Create Loans Table
create table public.loans (
  id uuid default gen_random_uuid() primary key,
  name text not null, -- e.g. "Start-up Loan"
  lender text not null,
  principal_amount numeric(10, 2) not null,
  interest_rate numeric(5, 2) default 0,
  start_date date default CURRENT_DATE,
  status text default 'Active' check (status in ('Active', 'Paid', 'Defaulted')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Add loan_id to transactions
alter table public.transactions add column loan_id uuid references public.loans(id);

-- 3. Insert New Categories
-- We introduce new types: 'Asset', 'Liability', 'Equity' to distinguish from pure Revenue/Expense
insert into public.categories (name, type)
values
  ('Savings', 'Asset'),
  ('Loan Proceeds', 'Liability'),
  ('Loan Repayment', 'Liability'),
  ('Capital Contribution', 'Equity');
