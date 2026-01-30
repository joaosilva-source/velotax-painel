# IMPORTANTE: URL da API no painel (Vercel)

O painel está chamando a **API errada**.

- **Antes (serviço antigo):** `https://whatsapp-api-6152.onrender.com`
- **API que está no ar e conectada:** `https://whatsapp-api-new-54aw.onrender.com`

## O que fazer na Vercel

1. Abra o projeto do painel na Vercel (**velotax-painel-eta**).
2. **Settings** → **Environment Variables**.
3. Ache **NEXT_PUBLIC_API_URL** e altere para:
   ```
   https://whatsapp-api-new-54aw.onrender.com
   ```
   (sem barra no final.)
4. Se não existir, crie a variável **NEXT_PUBLIC_API_URL** com esse valor.
5. Faça **Redeploy** do projeto (Deployments → ⋮ → Redeploy).

Depois disso o painel passa a usar a API que está online e com WhatsApp conectado.

## Variáveis do painel (resumo)

| Variável | Valor (exemplo) |
|----------|------------------|
| DATABASE_URL | `postgresql://...` |
| **NEXT_PUBLIC_API_URL** | **`https://whatsapp-api-new-54aw.onrender.com`** |
| NEXT_PUBLIC_DEFAULT_JID | `120363400851545835@g.us` (id do grupo, pegar em /grupos na API) |
| NEXTAUTH_SECRET | Gere com: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` — **obrigatório** para evitar 500 em /api/auth/session |
| NEXTAUTH_URL | `https://velotax-painel-eta.vercel.app` — **obrigatório** para evitar 500 |

## No Render (API)

No serviço **whatsapp-api-new-54aw**, em **Environment**, defina:

- **PANEL_URL** = `https://velotax-painel-eta.vercel.app` (para auto-status por reação ✅/❌).
