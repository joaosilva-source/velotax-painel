# Variáveis de ambiente – Netlify (painel-velotax)

Para o painel funcionar na Netlify, configure estas variáveis em **Site settings** → **Environment variables**:

## Obrigatórias

| Variável | Descrição |
|----------|-----------|
| **DATABASE_URL** | URI do PostgreSQL (Supabase ou outro). Ex.: `postgresql://user:pass@host:5432/db?sslmode=require` |
| **NEXT_PUBLIC_API_URL** | URL da API WhatsApp. **Use a URL do seu serviço no Render.** Ex.: `https://whatsapp-api-6152.onrender.com` (fallback no código se não definir). |
| **NEXT_PUBLIC_DEFAULT_JID** | ID do grupo/canal. Ex.: `120363400851545835@g.us` |

Sem **DATABASE_URL**, `/api/requests` retorna 503 (GET devolve lista vazia para o painel carregar) e o painel não salva solicitações. `/api/logs` GET devolve lista vazia.

Se aparecer 500 ou "Erro ao salvar no banco", confira a URI (senha com `(` → `%28`) e garanta que as tabelas existem no Postgres (`npx prisma db push` ou `prisma migrate deploy` no projeto).

Depois de adicionar as variáveis, faça um novo deploy (Deploys → Trigger deploy).
