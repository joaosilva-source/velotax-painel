# Estrutura e deploy: Painel (Vercel) + API WhatsApp (Render)

## Visão geral

- **Painel:** Next.js na Vercel (`velotax-painel-eta.vercel.app`)
- **API WhatsApp:** Express + Baileys no Render (`whatsapp-api-new-54aw.onrender.com`)
- O painel chama a API para enviar mensagens e receber stream de respostas. A API chama o painel para atualizar status por reação ✅/❌.

## Por que “não chega nada no Render”

1. O painel na Vercel estava usando a **URL antiga** da API (`whatsapp-api-6152.onrender.com`), que está fora do ar ou é outro serviço.
2. A API que está no ar é **whatsapp-api-new-54aw.onrender.com**. As requisições precisam ir para essa URL.

**Solução:** na Vercel, defina `NEXT_PUBLIC_API_URL` = `https://whatsapp-api-new-54aw.onrender.com` e faça **Redeploy**. O código do painel já usa essa URL como padrão em `lib/apiConfig.js`; a variável de ambiente sobrescreve no build.

## Checklist Vercel (Painel)

1. **Settings** → **Environment Variables**
2. Confira/crie:

| Variável | Valor | Obrigatório |
|----------|--------|-------------|
| DATABASE_URL | `postgresql://user:pass@host:5432/db?schema=public` | Sim |
| **NEXT_PUBLIC_API_URL** | **`https://whatsapp-api-new-54aw.onrender.com`** | Sim (evita CORS/503) |
| NEXT_PUBLIC_DEFAULT_JID | `120363400851545835@g.us` (id do grupo em /grupos na API) | Para envio WhatsApp |
| **NEXTAUTH_SECRET** | String longa aleatória (ex.: `openssl rand -base64 32`) | Sim (evita 500 em /api/auth/session) |
| **NEXTAUTH_URL** | **`https://velotax-painel-eta.vercel.app`** | Sim (evita 500) |

3. **Redeploy** após alterar variáveis (Deployments → ⋮ → Redeploy).

### Gerar NEXTAUTH_SECRET

No terminal (PowerShell ou Git Bash):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Cole o resultado em **NEXTAUTH_SECRET** na Vercel.

## Checklist Render (API)

1. Repo: **JoaoPedroAFK/whatsapp-api**
2. **Build Command:** `npm install`
3. **Start Command:** `npm start` ou `node index.js`
4. **Health Check Path:** `/ping`
5. **Disco:** mount `/app/auth` (1 GB) para persistir sessão WhatsApp
6. **Environment:**

| Variável | Valor |
|----------|--------|
| NODE_ENV | `production` |
| PORT | `3000` |
| **PANEL_URL** | **`https://velotax-painel-eta.vercel.app`** |

## Estrutura do código (Painel)

- **lib/apiConfig.js** — URL única da API: `getApiUrl()` e `DEFAULT_API_URL` (= 54aw). Todas as páginas que chamam a API usam `getApiUrl()`.
- **pages/api/auth/[...nextauth].js** — NextAuth com fallback de `secret` e `url` (VERCEL_URL) para evitar 500 quando NEXTAUTH_* não estão definidos.
- **pages/painel.js**, **components/FormSolicitacao.jsx**, **pages/erros-bugs.js**, **pages/admin/erros.js** — usam `getApiUrl()` para `/send` e `/stream/replies`.

## Resumo

1. **Vercel:** NEXT_PUBLIC_API_URL = URL do serviço no Render (54aw), NEXTAUTH_SECRET e NEXTAUTH_URL definidos → Redeploy.
2. **Render:** PANEL_URL = URL do painel na Vercel; Build = `npm install`, Start = `npm start`; CORS já configurado no `index.js` (middleware OPTIONS + cors).
3. Se ainda aparecer 503 ou CORS, confira se o painel está mesmo usando a URL 54aw (variável na Vercel) e se o serviço no Render está “live” e com WhatsApp conectado.
