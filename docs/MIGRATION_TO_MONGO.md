# Migração para MongoDB

Este documento orienta a migração do backend atual para MongoDB, mantendo os contratos de API consumidos pelo frontend.

## Coleções sugeridas

- requests
  - _id: ObjectId
  - agente: string
  - cpf: string
  - tipo: string
  - status: 'em aberto' | 'feito' | 'não feito'
  - payload: object (snapshot do formulário)
  - agentContact: string | null
  - waMessageId: string | null
  - createdAt: Date (ISO)
  - respondedAt: Date | null
  - respondedBy: string | null

- usageLogs
  - _id: ObjectId
  - action: string (ex.: 'send_request', 'auto_status_done', 'auto_status_not_done')
  - detail: object (livre)
  - createdAt: Date (ISO)

## Índices
- requests: { cpf: 1, createdAt: -1 }
- requests: { waMessageId: 1 }
- usageLogs: { action: 1, createdAt: -1 }

## Contratos de API (mantidos)

- POST /api/requests
  - body: { agente, cpf, tipo, payload, agentContact, waMessageId }
  - efeito: insere em `requests` com status inicial 'em aberto'; retorna 200/201.

- GET /api/requests
  - retorna a lista de requests (paginável opcionalmente).

- POST /api/logs
  - body: { action, detail }
  - efeito: insere em `usageLogs`.

- POST /api/requests/auto-status
  - body: { waMessageId, reactor?, status? , reaction? }
  - comportamento: quando `reaction` for ✅ → status 'feito'; quando ❌/✖/✖️ → 'não feito'. Atualiza o documento em `requests` e registra em `usageLogs` (auto_status_done / auto_status_not_done).

## Fluxo de status
1) Criação (em aberto)
2) Conclusão por reação ✅ (feito) ou ❌ (não feito)
3) Campos `respondedAt` e `respondedBy` preenchidos no update

## Observações
- Manter formato de datas ISO (new Date().toISOString()) no frontend; backend deve salvar como Date no Mongo.
- `payload.messageIds` (se usado) pode ser um array de strings para cross-check de `waMessageId`.
- CORS e auth: manter headers e origens já aceitos pelo painel.
