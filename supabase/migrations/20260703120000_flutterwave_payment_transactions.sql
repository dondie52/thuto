-- Flutterwave payment records for Thuto Pro one-time checkout

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  tx_ref text not null unique,
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id text not null,
  amount numeric(12, 2) not null,
  currency text not null default 'BWP',
  flutterwave_transaction_id text,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'failed', 'cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists payment_transactions_user_id_idx
  on public.payment_transactions (user_id);

create index if not exists payment_transactions_status_idx
  on public.payment_transactions (status);

alter table public.payment_transactions enable row level security;

drop policy if exists "Users can read own payment transactions" on public.payment_transactions;
create policy "Users can read own payment transactions"
  on public.payment_transactions
  for select
  to authenticated
  using (auth.uid() = user_id);

grant select on public.payment_transactions to authenticated;
