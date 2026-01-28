# Estrutura do Projeto – velotax-painel

Resumo da estrutura e das rotas principais. Atualizado após remoção da página estática "movido para Velohub".

---

## Raiz e rotas públicas

| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/` | `pages/index.js` | Home: "Atendimento Velotax" – cards para Painel, Aumento Limite Pix, Erros/Bugs, link externo Velohub |
| `/painel` | `pages/painel.js` | Painel de solicitações (formulário, lista, stats, SSE de respostas) |
| `/erros-bugs` | `pages/erros-bugs.js` | Registro de erros/bugs com imagens e envio WhatsApp |
| `/restituicao` | `pages/restituicao.js` | Página de restituição |
| `/atendimento` | `pages/atendimento.js` | Atendimento |
| `/monitoria-cobranca` | `pages/monitoria-cobranca.js` | Monitoria de cobrança |
| `/monitoria-cobranca-dashboard` | `pages/monitoria-cobranca-dashboard.js` | Dashboard da monitoria |

**Nota:** O arquivo `public/index.html` (tela "Este painel foi movido para o Velohub") foi **removido**. Quem acessar `/index.html` é redirecionado para `/` via `netlify.toml`.

---

## API (pages/api)

| Endpoint | Uso |
|---------|-----|
| `GET/POST /api/requests` | Lista/cria solicitações (usa Prisma/DATABASE_URL) |
| `POST /api/requests/auto-status` | Atualiza status por reação WhatsApp (waMessageId, reaction, reactor) – chamado pela whatsapp-api quando PANEL_URL está configurado |
| `GET /api/requests/[id]/status` | Status de uma solicitação |
| `POST /api/requests/reply` | Resposta/registro de reply |
| `GET /api/logs` | Logs (usa DATABASE_URL) |
| `/api/auth/[...nextauth]` | NextAuth (login) |
| `/api/health`, `/api/hello` | Health/debug |
| `/api/atendimento*`, `/api/monitoria-cobranca/*` | Atendimento e monitoria |

---

## Admin

| Rota | Arquivo |
|------|---------|
| `/admin/erros` | `pages/admin/erros.js` |
| `/admin/logs` | `pages/admin/logs.js` |
| `/admin/solicitacoes` | `pages/admin/solicitacoes.js` |
| `/admin/atendimento-logs` | `pages/admin/atendimento-logs.js` |

---

## Componentes e dados

- **components/** – `FormSolicitacao.jsx`, `Logs.jsx`, `Navbar.jsx`, `NavbarCobranca.jsx`
- **lib/prisma.js** – Cliente Prisma (PostgreSQL via DATABASE_URL)
- **prisma/schema.prisma** – Modelos (Request, UsageLog, etc.)
- **data/** – FAQ, textos, JSON (antecipação, cadastro, etc.)
- **public/** – Assets, brand, favicon, módulo crédito trabalhador (SPA em `public/modulo_credito_trabalhador/`)

---

## Deploy e variáveis

- **Netlify:** `netlify.toml` – build `npm run build`, plugin Next.js. Variáveis: `DATABASE_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_DEFAULT_JID` (ver `NETLIFY_ENV.md`).
- **Render:** `render.yaml` – referência; painel é deployado na Netlify.

---

## Fluxo WhatsApp

1. Usuário envia solicitação no painel → `FormSolicitacao`/`erros-bugs` chama `NEXT_PUBLIC_API_URL/send` (whatsapp-api no Render).
2. Reação ✅/❌ na mensagem no WhatsApp → whatsapp-api chama `PANEL_URL/api/requests/auto-status` (este painel) para atualizar o status da solicitação.
