-- Group company documents under three sections: Internal Documents,
-- Australian Standards, and NCC. Existing rows (none expected yet)
-- fall back to 'internal' via the column default.
-- Idempotent: column add is gated, check constraint dropped/recreated.

alter table public.company_documents
  add column if not exists category text not null default 'internal';

alter table public.company_documents
  drop constraint if exists company_documents_category_check;

alter table public.company_documents
  add constraint company_documents_category_check
  check (category in ('internal', 'australian_standard', 'ncc'));

create index if not exists company_documents_category_idx
  on public.company_documents (category);
