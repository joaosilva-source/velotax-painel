# Configuração completa – Supabase (Painel Velotax)

Tudo que deve estar no Supabase para o painel funcionar: extensões, tabelas, colunas e variáveis.

---

## 1. Variáveis de ambiente (Vercel)

Configure na **Vercel** (projeto do painel) → **Settings** → **Environment Variables**:

| Variável | Obrigatório | Exemplo / Descrição |
|----------|-------------|----------------------|
| **DATABASE_URL** | Sim | URI do Postgres. **Use a URL do pooler** (porta **6543**): Supabase → Settings → Database → Connection string → **Session mode** ou **Transaction mode**. Ex.: `postgresql://postgres.[ref]:[SENHA]@aws-0-us-east-1.pooler.supabase.com:6543/postgres` |
| **NEXT_PUBLIC_API_URL** | Recomendado | URL da API WhatsApp. Ex.: `https://whatsapp-api-new-54aw.onrender.com` |
| **NEXTAUTH_URL** | Se usar NextAuth | URL do painel. Ex.: `https://velotax-painel-eta.vercel.app` |
| **NEXTAUTH_SECRET** | Se usar NextAuth | Chave secreta para sessão |

---

## 2. SQL no Supabase (SQL Editor)

Acesse **Supabase** → seu projeto → **SQL Editor**. Execute na ordem abaixo.

### 2.1 Tabela `Request` (solicitações do painel)

```sql
-- (Supabase usa Postgres 15; gen_random_uuid() é nativo. Se der erro, use: CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; e troque por uuid_generate_v4()::text)
CREATE TABLE IF NOT EXISTS "Request" (
  "id"              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "agente"           TEXT NOT NULL DEFAULT '',
  "cpf"              TEXT NOT NULL DEFAULT '',
  "tipo"             TEXT NOT NULL DEFAULT '',
  "payload"          JSONB NOT NULL DEFAULT '{}',
  "status"           TEXT NOT NULL DEFAULT 'em aberto',
  "responded_at"     TIMESTAMPTZ,
  "responded_by"     TEXT,
  "agent_contact"    TEXT,
  "wa_message_id"    TEXT,
  "replies"          JSONB
);

-- Índices úteis para o painel
CREATE INDEX IF NOT EXISTS "Request_created_at_idx" ON "Request" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "Request_wa_message_id_idx" ON "Request" ("wa_message_id") WHERE "wa_message_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Request_status_idx" ON "Request" ("status");
```

### 2.2 Tabela `UsageLog` (logs de uso / auditoria)

```sql
CREATE TABLE IF NOT EXISTS "UsageLog" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "user_email" TEXT,
  "action"     TEXT NOT NULL,
  "detail"     JSONB,
  "ip"         TEXT
);

CREATE INDEX IF NOT EXISTS "UsageLog_created_at_idx" ON "UsageLog" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "UsageLog_action_idx" ON "UsageLog" ("action");
```

### 2.3 Coluna `replies` (se a tabela Request já existia sem ela)

Se você criou a tabela antes e não tem a coluna de respostas no grupo:

```sql
ALTER TABLE "Request"
ADD COLUMN IF NOT EXISTS "replies" JSONB DEFAULT NULL;
```

---

## 3. Script único (criar tudo de uma vez)

Copie e execute **uma vez** no **SQL Editor** do Supabase:

```sql
-- Request (gen_random_uuid() é nativo no Postgres 13+)
CREATE TABLE IF NOT EXISTS "Request" (
  "id"              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "agente"          TEXT NOT NULL DEFAULT '',
  "cpf"             TEXT NOT NULL DEFAULT '',
  "tipo"            TEXT NOT NULL DEFAULT '',
  "payload"         JSONB NOT NULL DEFAULT '{}',
  "status"          TEXT NOT NULL DEFAULT 'em aberto',
  "responded_at"    TIMESTAMPTZ,
  "responded_by"    TEXT,
  "agent_contact"   TEXT,
  "wa_message_id"   TEXT,
  "replies"         JSONB
);
CREATE INDEX IF NOT EXISTS "Request_created_at_idx" ON "Request" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "Request_wa_message_id_idx" ON "Request" ("wa_message_id") WHERE "wa_message_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Request_status_idx" ON "Request" ("status");

-- UsageLog
CREATE TABLE IF NOT EXISTS "UsageLog" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "user_email" TEXT,
  "action"     TEXT NOT NULL,
  "detail"     JSONB,
  "ip"         TEXT
);
CREATE INDEX IF NOT EXISTS "UsageLog_created_at_idx" ON "UsageLog" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "UsageLog_action_idx" ON "UsageLog" ("action");

-- Garantir coluna replies (caso Request já existisse)
ALTER TABLE "Request" ADD COLUMN IF NOT EXISTS "replies" JSONB DEFAULT NULL;
```

---

## 4. Conferir no Supabase

- **Table Editor**: devem existir as tabelas **Request** e **UsageLog**.
- **Request**: colunas `id`, `created_at`, `agente`, `cpf`, `tipo`, `payload`, `status`, `responded_at`, `responded_by`, `agent_contact`, `wa_message_id`, `replies`.
- **UsageLog**: colunas `id`, `created_at`, `user_email`, `action`, `detail`, `ip`.

---

## 5. Alternativa: Prisma (na sua máquina)

Com a **mesma DATABASE_URL** que está na Vercel (pooler, porta 6543):

```bash
cd repos-joaosilva/velotax-painel
# PowerShell:
$env:DATABASE_URL = "postgresql://postgres.[ref]:[SENHA]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
npx prisma db push
```

Isso alinha o banco ao `prisma/schema.prisma` (cria/altera tabelas conforme o schema).

---

## 6. Erro "Tenant or user not found"

Esse erro vem do **pooler do Supabase** quando a conexão é rejeitada (usuário/senha ou formato da URL).

**O que fazer:**

1. **Copiar de novo a Connection string**  
   Supabase → **Settings** → **Database** → **Connection string** → escolha **Session mode** ou **Transaction mode** (porta **6543**). O usuário deve estar no formato `postgres.PROJECT_REF` (ex.: `postgres.ooystigvanwktbjqnxhr`). Não use a URL direta (porta 5432) nas variáveis do painel.

2. **Senha**  
   Se você alterou a senha do banco ou retomou um projeto pausado, atualize a senha na URL e salve de novo em **Vercel** → **Settings** → **Environment Variables** → `DATABASE_URL`. Caracteres especiais na senha (ex.: `#`, `@`) devem ser codificados (ex.: `%23`, `%40`).

3. **Redeploy**  
   Depois de alterar `DATABASE_URL` na Vercel, faça **Redeploy** do projeto para as funções usarem a nova variável.

---

## 7. Resumo

| Onde | O quê |
|------|--------|
| **Vercel** | `DATABASE_URL` = URL do **pooler** (porta 6543); `NEXT_PUBLIC_API_URL` = API WhatsApp |
| **Supabase → SQL Editor** | Rodar o script da seção 3 (uma vez) para criar tabelas e índices |
| **Supabase → Settings → Database** | Copiar Connection string (Session/Transaction mode) para colar na Vercel em `DATABASE_URL` |

Depois: **Redeploy** do projeto na Vercel para garantir que as variáveis estão em uso.
