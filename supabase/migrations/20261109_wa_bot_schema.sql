-- WhatsApp bot (Fase 1): conversaciones, mensajes, envios de campaña, info de campañas
-- Aplicada en Supabase via MCP apply_migration el 2026-11-09

create table wa_conversations (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,              -- E.164 sin prefijo whatsapp:
  profile_name text,
  mode text not null default 'bot',        -- 'bot' | 'human'
  campaign_id uuid references campaigns(id),
  transfer_reason text,
  transferred_at timestamptz,
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table wa_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references wa_conversations(id) on delete cascade,
  role text not null,                      -- 'user' | 'assistant' | 'advisor' | 'system'
  content text not null,
  message_sid text,
  button_payload text,
  created_at timestamptz default now()
);
create index on wa_messages (conversation_id, created_at);

create table campaign_sends (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  contact_id uuid references contacts(id),
  phone text not null,
  message_sid text,
  status text not null default 'sent',     -- 'sent' | 'failed'
  error text,
  created_at timestamptz default now()
);
create index on campaign_sends (phone, created_at desc);
create index on campaign_sends (message_sid);

create table wa_campaign_info (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,               -- ej. 'cunpacks', 'posadas'
  title text not null,
  details text not null,                   -- texto libre que se inyecta al prompt
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: solo service role (API), sin acceso anon
alter table wa_conversations enable row level security;
alter table wa_messages enable row level security;
alter table campaign_sends enable row level security;
alter table wa_campaign_info enable row level security;
