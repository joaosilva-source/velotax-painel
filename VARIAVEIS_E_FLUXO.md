# Variáveis e por que funciona (resumo)

## RENDER (whatsapp-api)

| Variável | Obrigatória | Valor / Motivo |
|----------|-------------|----------------|
| **PANEL_URL** ou **PAINEL_URL** | Sim (para feito/não feito) | URL do painel na Vercel. Ex: `https://velotax-painel-eta.vercel.app`. Sem isso a API não chama o painel quando alguém reage ✅/❌ → status não atualiza. |
| **PANEL_BYPASS_SECRET** | Se o painel tiver Proteção na Vercel | Mesmo valor do "Protection Bypass for Automation" do projeto na Vercel. Sem isso, chamadas do Render ao painel podem retornar 500 "Tenant or user not found". |
| **AUTHORIZED_REACTORS** ou **AUTHORIZED_REACTION_NUMBER** | Não | Números (só dígitos) autorizados a marcar feito/não feito por reação. **Vários:** AUTHORIZED_REACTORS com valores separados por vírgula (ex: `222286686744698,5511999999999`). **Um só:** AUTHORIZED_REACTION_NUMBER. **Vazio = qualquer número pode marcar.** Quando o reator não está na lista, a API **não chama** o painel (log: "Ignorado: reator não autorizado"). |
| PORT, RENDER_EXTERNAL_URL | Não (Render define) | Usados pelo próprio Render. |
| REPLIES_STREAM_ENABLED | Não | `1` para habilitar stream de respostas no grupo. |
| PING_ENABLED, PING_INTERVAL, PING_DELAY | Não | Controle do ping interno. |

**Nada de DATABASE_URL no Render.** O banco é só no painel (Vercel + Supabase).

---

## VERCEL (painel)

| Variável | Obrigatória | Valor / Motivo |
|----------|-------------|----------------|
| **DATABASE_URL** | Sim | Connection string do Supabase (pooler, porta **6543**). Sem isso ou com tabelas inexistentes → "Erro ao salvar no banco". |
| **NEXT_PUBLIC_API_URL** | Sim (para enviar) | URL da API no Render. Ex: `https://whatsapp-api-new-54aw.onrender.com`. Painel chama essa URL em `/send`. |
| **NEXT_PUBLIC_DEFAULT_JID** | Sim (para enviar) | ID do grupo WhatsApp. Ex: `120363400851545835@g.us`. Sem isso o painel não envia para o grupo. |
| **AUTHORIZED_REACTORS** ou **AUTHORIZED_REACTION_NUMBER** | Não | (Opcional, segunda camada.) Números autorizados a marcar feito/não feito. **A configuração principal fica no Render** (whatsapp-api); aqui no painel é opcional para rejeitar na API caso alguém chame direto. Vazio = aceita todos. |
| NEXTAUTH_URL, NEXTAUTH_SECRET | Se usar login | URL do painel e chave secreta. |

---

## SUPABASE

- **Request** e **UsageLog** precisam existir (mesmo projeto da DATABASE_URL da Vercel).
- Se não existirem: rodar no **SQL Editor** o script da seção 3 do `SUPABASE_CONFIGURACAO_COMPLETA.md`.

---

## Fluxo (por que funciona)

1. **Envio:** Painel (Vercel) → `POST NEXT_PUBLIC_API_URL/send` (Render) com `jid: NEXT_PUBLIC_DEFAULT_JID` → Render manda no WhatsApp e devolve `messageId`.
2. **Salvar:** Painel → `POST /api/requests` (Vercel) com `waMessageId` → Vercel grava no Supabase (Request). Precisa de DATABASE_URL + tabelas.
3. **Reação:** Alguém reage ✅/❌ no WhatsApp → Render recebe → `POST PANEL_URL/api/requests/auto-status` (Vercel) com `waMessageId` e `reaction` → Vercel atualiza Request no Supabase. Precisa de PANEL_URL no Render.

**Resumo:** Render = WhatsApp + chamar painel. Vercel = painel + banco. Supabase = tabelas Request e UsageLog. PANEL_URL no Render e DATABASE_URL + tabelas na Vercel são o mínimo para tudo funcionar.

---

## Erro 500 "Tenant or user not found" ao chamar o painel

**Causa 1 – Vercel bloqueando:** Deployment Protection (ou Authentication) bloqueia requisições do Render (sem cookie).  
**Solução:** Desative a proteção no projeto ou use **Protection Bypass for Automation** na Vercel e **PANEL_BYPASS_SECRET** no Render (mesmo valor).

**Causa 2 – Reator não autorizado:** O número que reagiu não está na lista de autorizados.  
**Solução:** No **Render** (serviço whatsapp-api), defina **AUTHORIZED_REACTORS** com os números permitidos (só dígitos, separados por vírgula). Ex.: `222286686744698,5511999999999`. Quem não estiver na lista não dispara chamada ao painel (log: "Ignorado: reator não autorizado"). Vazio = qualquer número pode marcar. Opcionalmente o painel (Vercel) também pode ter AUTHORIZED_REACTORS para segunda camada.
