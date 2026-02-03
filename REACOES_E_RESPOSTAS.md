# Reações e respostas no grupo — fluxo completo

## Visão geral

- **Reações (✅/❌):** alguém reage à mensagem da solicitação no WhatsApp → a API chama o painel → status da solicitação vira "feito" ou "não feito".
- **Respostas no grupo:** alguém **responde** (cita) a mensagem da solicitação → a API envia o texto ao painel → o painel persiste e exibe **no mesmo lugar** onde aparece o status (feito/não feito).

## Caminhos (API WhatsApp → Painel)

| Ação no WhatsApp | Endpoint do painel | Observação |
|------------------|--------------------|------------|
| Reação ✅/❌ na mensagem | `POST /api/requests/auto-status` | Body: `waMessageId`, `reaction`, `reactor` |
| Resposta (reply) à mensagem | `POST /api/requests/reply` | Body: `waMessageId`, `reactor`, `text` |

A API usa **PANEL_URL** (ou PAINEL_URL) para montar a base. Ex.: `PANEL_URL=https://velotax-painel-eta.vercel.app` → reações e respostas vão para essa origem.

## Variáveis na API (Render/Oracle)

- **PANEL_URL** — URL do painel (obrigatória para reações e respostas chegarem ao painel).
- **REPLIES_STREAM_ENABLED=1** — habilita o envio de respostas (reply) ao painel. Se não definir, só reações são enviadas.

## No painel

- **Request.replies** (Prisma): campo JSON com array `[{ reactor, text, at }]`. Preenchido por `POST /api/requests/reply`.
- **Exibição:** em **Painel** (histórico do agente), **FormSolicitação** (Logs de Envio) e **Erros e bugs** (Logs de Envio), cada card mostra o status (feito/não feito) e, quando houver, a seção **"Respostas no grupo (N)"** com as últimas mensagens.

## Migração do banco

Após adicionar o campo `replies` no `schema.prisma`, rode no projeto do painel:

```bash
npx prisma generate
npx prisma db push
```

(ou `prisma migrate dev` se usar migrações.)
