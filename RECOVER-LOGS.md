# 🔄 Recuperação de Logs - Velotax Painel

## 🚨 Problema
- Migração Vercel → Netlify perdeu todos os logs
- Pesquisa de CPF não funciona (banco zerado)
- Nova hospedagem não tem histórico

## 📋 Plano de Recuperação

### Etapa 1: Diagnóstico Atual
```bash
# Verificar se API está funcionando
curl https://seu-dominio.netlify.app/api/debug

# Ou acessar diretamente no navegador:
https://seu-dominio.netlify.app/api/debug
```

### Etapa 2: Recuperar Logs da Vercel

#### 2.1 Obter Token da Vercel
1. Acesse: https://vercel.com/account/tokens
2. Crie novo token com escopo completo
3. Configure variável de ambiente:
```bash
export VERCEL_TOKEN=seu_token_aqui
```

#### 2.2 Configurar IDs do Projeto
Edite `scripts/recover-logs.js`:
```javascript
const VERCEL_PROJECT_ID = 'proj_xxx'; // Substituir
const VERCEL_TEAM_ID = 'team_xxx';     // Substituir
```

#### 2.3 Executar Recuperação
```bash
# Recuperar logs da Vercel
npm run logs:recover

# Verificar logs recuperados
cat logs/extracted-requests.json
```

### Etapa 3: Importar para Banco Novo

#### 3.1 Criar Backup
```bash
# Backup do banco atual (vazio)
npm run logs:backup
```

#### 3.2 Importar Dados
```bash
# Importar solicitações recuperadas
npm run logs:import

# Ou fazer tudo de uma vez
npm run logs:full
```

### Etapa 4: Verificar Funcionamento
```bash
# Testar API novamente
curl https://seu-dominio.netlify.app/api/debug

# Verificar se pesquisa de CPF funciona
# Acesse o painel e teste a busca
```

## 🔧 Arquivos Criados

### `/api/debug.js`
- Endpoint para diagnosticar API e banco
- Mostra status da conexão
- Lista últimos registros
- Verifica variáveis de ambiente

### `scripts/recover-logs.js`
- Conecta à API da Vercel
- Busca logs de deployments antigos
- Extrai dados de solicitações dos logs
- Salva em formato JSON

### `scripts/import-requests.js`
- Importa solicitações recuperadas
- Evita duplicatas
- Cria backup antes de importar
- Gera relatório final

## 📊 Estrutura dos Dados

### Formato das Solicitações Recuperadas
```json
{
  "deployment": "https://projeto.vercel.app",
  "timestamp": "2024-01-01T12:00:00Z",
  "cpf": "12345678901",
  "tipo": "Exclusão de Conta",
  "agente": "Nome do Agente",
  "rawLog": { ... }
}
```

### Formato no Banco
```javascript
await prisma.request.create({
  data: {
    cpf: "12345678901",
    tipo: "Exclusão de Conta", 
    agente: "Nome do Agente",
    status: "importado",
    payload: {
      source: "vercel-recovery",
      deployment: "https://projeto.vercel.app",
      originalLog: { ... }
    }
  }
});
```

## ⚠️ Considerações Importantes

### Limitações
- Logs podem estar incompletos
- Dados antigos podem não ter todos os campos
- Formatação pode variar entre períodos

### Backup Sempre
- Sempre crie backup antes de importar
- Guarde arquivo de backup seguro
- Teste em ambiente de desenvolvimento primeiro

### Validação
- Verifique CPFs formatados corretamente
- Confirme nomes de agentes
- Valide tipos de solicitações

## 🚀 Comandos Rápidos

```bash
# Diagnóstico completo
npm run debug:api

# Recuperação completa
npm run logs:full

# Verificar resultado
curl https://seu-dominio.netlify.app/api/debug
```

## 📞 Suporte

Se encontrar problemas:
1. Verifique logs da execução
2. Confirme variáveis de ambiente
3. Teste conexão com banco
4. Verifique permissões da API Vercel

## 📈 Resultado Esperado

Após o processo:
- ✅ Logs antigos recuperados
- ✅ Pesquisa de CPF funcionando
- ✅ Histórico disponível no painel
- ✅ Sistema operacional normal
