# Conexão API (whatsapp-api) ↔ Front (painel)

Documento minucioso de como o **painel** (Netlify) e a **API WhatsApp** (Render) se conectam.

---

## 1. Visão geral

| Quem | Onde | URL base |
|------|------|----------|
| **Painel** | Netlify | `https://painel-velotax.netlify.app` |
| **API WhatsApp** | Render | `https://whatsapp-api-6152.onrender.com` |

O painel **chama** a API para enviar mensagens e para SSE de respostas. A API **chama** o painel para atualizar status por reação (✅/❌).

---

## 2. Painel → API

### 2.1 Envio de mensagem (POST /send)

**Quem chama:** `FormSolicitacao.jsx`, `erros-bugs.js`, `admin/erros.js`

**URL:** `{NEXT_PUBLIC_API_URL}/send`  
Fallback no código: `https://whatsapp-api-6152.onrender.com/send`

**Payload (JSON):**
```json
{
  "jid": "120363400851545835@g.us",
  "mensagem": "texto da mensagem",
  "cpf": "12345678900",
  "solicitacao": "Cancelamento",
  "agente": "Nome do Agente"
}
```
- **erros-bugs** envia também: `imagens`, `videos` (arrays com `{ data, type }` em base64).

**Resposta da API (sucesso 200):**
```json
{
  "ok": true,
  "messageId": "3EB0...",
  "messageIds": ["3EB0..."]
}
```

**Resposta da API (erro 503 – WhatsApp desconectado):**
```json
{
  "ok": false,
  "error": "WhatsApp desconectado"
}
```

**O que o painel faz:**
- Lê `data?.messageId || data?.key?.id` e salva como `waMessageId` no Request.
- Persiste a solicitação em `POST /api/requests` com `waMessageId` e `payload.messageIds: [waMessageId]`.
- Se 503 ou "WhatsApp desconectado": mostra "WhatsApp está reconectando. Aguarde e tente novamente."

---

### 2.2 SSE – stream de respostas (GET /stream/replies)

**Quem chama:** `painel.js` (EventSource)

**URL:** `{backendUrl}/stream/replies?agent={encodeURIComponent(myAgent)}`  
`backendUrl` = `NEXT_PUBLIC_API_URL` ou fallback `https://whatsapp-api-6152.onrender.com`

**Comportamento:**
- Conexão SSE; eventos `init` (estado inicial) e `reply` (nova resposta citando mensagem enviada pelo bot).
- Só recebe dados se `REPLIES_STREAM_ENABLED=1` na API e se o painel tiver `PANEL_URL` configurado na API (para a API enviar o reply ao painel).

---

## 3. API → Painel

### 3.1 Auto-status por reação (POST /api/requests/auto-status)

**Quem chama:** API (whatsapp-api), quando alguém reage com ✅ ou ❌ a uma mensagem no WhatsApp.

**URL da API:** `{PANEL_URL}/api/requests/auto-status`  
Ex.: `https://painel-velotax.netlify.app/api/requests/auto-status`

**Variável no Render:** `PANEL_URL` (ou `PAINEL_URL`) = `https://painel-velotax.netlify.app` (sem barra no final).

**Payload (JSON) enviado pela API:**
```json
{
  "waMessageId": "3EB0CFA69F9450EBD031F1",
  "reaction": "✅",
  "reactor": "177734437335074"
}
```

**Resposta do painel (encontrou o request, 200):**
```json
{
  "success": true,
  "id": "uuid",
  "status": "feito",
  "respondedAt": "...",
  "respondedBy": "177734437335074",
  ...
}
```

**Resposta do painel (não encontrou, 200 – para a API não logar como erro):**
```json
{
  "success": false,
  "error": "request não encontrado"
}
```

**Resposta do painel (DATABASE_URL ausente, 503):**
```json
{
  "success": false,
  "error": "DATABASE_URL não configurado",
  "hint": "Configure no Netlify (...)"
}
```

**O que a API faz:** Se receber 200 com `success: false` e `error` "request não encontrado", loga como informação (não stack). Se receber 404 (versão antiga do painel), loga erro.

---

### 3.2 Reply (POST /api/requests/reply) – opcional

Quando `REPLIES_STREAM_ENABLED=1` e alguém **cita** uma mensagem enviada pelo bot, a API envia:

**URL:** `{PANEL_URL}/api/requests/reply`

**Payload:** `{ waMessageId, reactor, text }`

O painel deve expor esse endpoint se quiser persistir respostas citadas.

---

## 4. Variáveis de ambiente

### 4.1 Netlify (painel)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| **DATABASE_URL** | Sim | URI PostgreSQL (Supabase). Senha com `(` → usar `%28` na URL. |
| **NEXT_PUBLIC_API_URL** | Recomendado | URL da API. Ex.: `https://whatsapp-api-6152.onrender.com`. Se não definir, o código usa 6152 como fallback. |
| **NEXT_PUBLIC_DEFAULT_JID** | Sim (para enviar) | ID do grupo/canal. Ex.: `120363400851545835@g.us` |

Sem `DATABASE_URL`, `/api/requests` e `/api/requests/auto-status` retornam 503 ou lista vazia (GET requests).

### 4.2 Render (whatsapp-api)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| **PANEL_URL** (ou PAINEL_URL) | Sim (para auto-status) | URL base do painel. Ex.: `https://painel-velotax.netlify.app` (sem barra no final). |
| **PORT** | Sim | Ex.: `8080` ou o que o Render definir. |
| **REPLIES_STREAM_ENABLED** | Não | `1` para enviar respostas citadas ao painel (`/api/requests/reply`). |

Sem `PANEL_URL`, a API chama o fallback Velohub em `/api/escalacoes/solicitacoes/auto-status` (404 se as solicitações estão no painel).

---

## 5. Checklist de problemas comuns

- **503 "WhatsApp desconectado"**  
  API está no ar, mas a sessão Baileys está desconectada ou reconectando. Aguardar e tentar enviar de novo; o painel mostra mensagem amigável.

- **404 "request não encontrado" (auto-status)**  
  Mensagem reagida não foi enviada por este painel (ex.: enviada manualmente ou por outro sistema). O painel retorna 200 com `success: false` para não poluir log da API.

- **500 em /api/requests ou /api/logs**  
  Falta `DATABASE_URL` na Netlify ou erro de conexão/Prisma. GET /api/requests devolve lista vazia em erro; POST devolve 503 com hint.

- **Painel chama y40p em vez de 6152**  
  `NEXT_PUBLIC_API_URL` na Netlify está com valor antigo (y40p). Ajustar para `https://whatsapp-api-6152.onrender.com` e refazer deploy.

- **Auto-status sempre 404**  
  Confirmar `PANEL_URL` no Render = `https://painel-velotax.netlify.app`. Confirmar que o painel retorna 200 (e não 404) quando não encontra o request (código atual já faz isso).
