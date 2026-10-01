-- PRAMANA schema migration: case metadata + immutable audit logs.
-- Safe to re-run (idempotent). Requires the pgcrypto extension for
-- gen_random_uuid() on older Postgres instances.

create extension if not exists "pgcrypto";

-- ============================================================
-- CASES
-- ============================================================
create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  mode text not null check (mode in ('diary', 'hiring', 'investigation')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

-- ============================================================
-- IMMUTABLE AUDIT LOGS (tamper-evident via sha256 chain)
-- ============================================================
create table if not exists case_audit_logs (
  id uuid default gen_random_uuid() primary key,
  case_id uuid references cases(id) on delete cascade,
  action_type text not null, -- 'STATEMENT_ADDED' | 'EVIDENCE_MODIFIED' | 'CLAIM_DELETED' | 'CASE_UPDATED' | 'CASE_CREATED'
  changed_by text not null default 'system_user',
  previous_state jsonb,
  new_state jsonb,
  timestamp timestamptz not null default now(),
  sha256_hash text not null
);

create index if not exists case_audit_logs_case_id_idx on case_audit_logs (case_id, timestamp);

-- ============================================================
-- Existing tables alignment (no-ops when columns already exist)
-- ============================================================
alter table cases add column if not exists updated_at timestamptz not null default now();
alter table cases add column if not exists version integer not null default 1;

-- NOTE ON IMMUTABILITY: do NOT add UPDATE/DELETE grants on case_audit_logs to
-- the anon role. The table must remain append-only for the hash chain to be
-- meaningful in an audit context.
