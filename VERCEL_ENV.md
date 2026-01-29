# Variáveis de ambiente – Vercel (velotax-painel)

Painel hospedado na **Vercel**; API WhatsApp no **Render**. Para o fluxo completo (deploy da API + variáveis), veja na pasta da API: **CONFIGURAR_API_RENDER.md**.

Para o painel funcionar na Vercel, configure estas variáveis em **Project** → **Settings** → **Environment Variables**.

## Obrigatórias

| Variável | Descrição |
|----------|-----------|
| **DATABASE_URL** | URI do PostgreSQL (Supabase ou outro). Ex.: `postgresql://user:pass@host:5432/db?sslmode=require` |
| **NEXT_PUBLIC_API_URL** | URL da API WhatsApp (Render). Ex.: `https://whatsapp-api-6152.onrender.com` |
| **NEXT_PUBLIC_DEFAULT_JID** | ID do grupo/canal. Ex.: `120363400851545835@g.us` |

Sem **DATABASE_URL**, `/api/requests` retorna 503 (GET devolve lista vazia para o painel carregar) e o painel não salva solicitações. `/api/logs` GET devolve lista vazia.

Se aparecer 500 ou "Erro ao salvar no banco", confira a URI (senha com `(` → `%28`) e garanta que as tabelas existem no Postgres (`npx prisma db push` ou `prisma migrate deploy` no projeto).

## Deploy na Vercel

1. **Importar projeto**: [vercel.com](https://vercel.com) → **Add New** → **Project** → importar o repositório `velotax-painel`.
2. **Framework**: Next.js é detectado automaticamente; o build usa `npm run build` (já inclui `prisma generate`).
3. **Variáveis**: em **Settings** → **Environment Variables**, adicionar as três variáveis acima (Production, Preview e Development conforme necessidade).
4. **Deploy**: após o primeiro deploy, a URL será algo como `https://velotax-painel-xxx.vercel.app`.

## API WhatsApp (Render)

Para o auto-status (reação nas mensagens) funcionar, no serviço **whatsapp-api** no Render configure:

- **PANEL_URL** = URL do painel na Vercel (ex.: `https://velotax-painel-xxx.vercel.app`).

Depois de alterar variáveis na Vercel, um novo deploy é disparado automaticamente se **Redeploy** estiver habilitado; ou faça **Deployments** → **Redeploy**.
