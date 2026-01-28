# Variáveis de ambiente – Netlify (painel-velotax)

Para o painel funcionar na Netlify, configure estas variáveis em **Site settings** → **Environment variables**:

## Obrigatórias

| Variável | Descrição |
|----------|-----------|
| **DATABASE_URL** | URI do PostgreSQL (Supabase ou outro). Ex.: `postgresql://user:pass@host:5432/db?sslmode=require` |
| **NEXT_PUBLIC_API_URL** | URL da API WhatsApp. **Use a URL do seu serviço no Render.** Ex.: `https://whatsapp-api-6152.onrender.com` (fallback no código se não definir). |
| **NEXT_PUBLIC_DEFAULT_JID** | ID do grupo/canal. Ex.: `120363400851545835@g.us` |

Sem **DATABASE_URL**, as rotas `/api/requests` e `/api/logs` retornam 500 e o painel não salva nem lista solicitações.

Depois de adicionar as variáveis, faça um novo deploy (Deploys → Trigger deploy).
