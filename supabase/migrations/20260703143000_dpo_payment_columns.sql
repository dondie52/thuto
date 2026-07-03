-- Generalize payment_transactions for DPO (from earlier Flutterwave draft)

alter table public.payment_transactions
  add column if not exists payment_provider text not null default 'dpo';

alter table public.payment_transactions
  add column if not exists dpo_trans_token text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'payment_transactions'
      and column_name = 'flutterwave_transaction_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'payment_transactions'
      and column_name = 'provider_transaction_id'
  ) then
    alter table public.payment_transactions
      rename column flutterwave_transaction_id to provider_transaction_id;
  end if;
end $$;

alter table public.payment_transactions
  add column if not exists provider_transaction_id text;
