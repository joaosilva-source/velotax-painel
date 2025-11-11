# Guia de Migração para MongoDB

Este documento descreve o plano de migração do sistema atual para o MongoDB, incluindo a estrutura de coleções, índices e estratégia de migração.

## Visão Geral

A migração para o MongoDB trará benefícios como:

- Esquema flexível para diferentes tipos de solicitações
- Melhor desempenho para consultas complexas
- Facilidade de escalabilidade horizontal
- Suporte nativo para JSON

## Estrutura de Coleções

### 1. `solicitacoes`

Armazena as solicitações dos clientes.

```javascript
{
  _id: ObjectId,
  agente: String,        // Nome do agente
  cpf: String,          // CPF do cliente
  tipo: String,         // Tipo de solicitação
  status: String,      // Status atual
  payload: Object,     // Dados específicos do tipo de solicitação
  clientToken: String, // Identificador único do navegador
  waMessageId: String, // ID da mensagem do WhatsApp
  createdAt: Date,     // Data de criação
  updatedAt: Date,     // Última atualização
  historico: [         // Histórico de alterações
    {
      data: Date,
      status: String,
      detalhes: String,
      agente: String
    }
  ]
}
```

### 2. `logs`

Registra eventos importantes do sistema.

```javascript
{
  _id: ObjectId,
  acao: String,       // Ação realizada
  tipo: String,       // Tipo de registro
  detalhes: Object,   // Detalhes específicos
  solicitacaoId: ObjectId, // Referência à solicitação
  agente: String,     // Agente responsável
  createdAt: Date     // Data de criação
}
```

## Índices Recomendados

```javascript
// Para consultas rápidas por CPF
db.solicitacoes.createIndex({ cpf: 1 });

// Para consultas por status
db.solicitacoes.createIndex({ status: 1 });

// Para consultas por agente
db.solicitacoes.createIndex({ agente: 1 });

// Para consultas por data de criação
db.solicitacoes.createIndex({ createdAt: -1 });

// Índice composto para consultas frequentes
db.solicitacoes.createIndex({ 
  tipo: 1, 
  status: 1,
  createdAt: -1 
});
```

## Estratégia de Migração

1. **Fase de Preparação**
   - Criar scripts de migração
   - Configurar ambiente de teste
   - Fazer backup completo dos dados atuais

2. **Migração dos Dados**
   - Criar scripts para migrar dados existentes
   - Validar a integridade dos dados migrados
   - Executar migração em ambiente de teste

3. **Atualização da Aplicação**
   - Atualizar os serviços para usar o MongoDB
   - Manter compatibilidade com a API existente
   - Implementar novas funcionalidades

4. **Testes**
   - Testes de unidade
   - Testes de integração
   - Testes de desempenho

5. **Implantação**
   - Implantação em produção
   - Monitoramento pós-implantação
   - Rollback planejado se necessário

## Script de Migração

```javascript
// Exemplo de script de migração
const { MongoClient } = require('mongodb');
const { Pool } = require('pg');

async function migrate() {
  // Configurações de conexão
  const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  const mongoClient = new MongoClient(process.env.MONGODB_URI);
  
  try {
    // Conectar aos bancos de dados
    await mongoClient.connect();
    const db = mongoClient.db();
    
    // Migrar solicitações
    const solicitacoes = await pgPool.query('SELECT * FROM solicitacoes');
    if (solicitacoes.rows.length > 0) {
      await db.collection('solicitacoes').insertMany(
        solicitacoes.rows.map(s => ({
          ...s,
          historico: s.historico || []
        }))
      );
    }
    
    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    await pgPool.end();
    await mongoClient.close();
  }
}

migrate();
```

## Considerações de Desempenho

- **Índices**: Crie índices para consultas frequentes
- **Agregações**: Use o pipeline de agregação para consultas complexas
- **Sharding**: Considere usar sharding para grandes volumes de dados
- **Caching**: Implemente cache para consultas frequentes

## Monitoramento

- Configurar o MongoDB Atlas para monitoramento
- Acompanhar métricas de desempenho
- Configurar alertas para problemas potenciais

## Próximos Passos

1. Revisar e ajustar o esquema conforme necessário
2. Desenvolver scripts de migração
3. Testar a migração em ambiente de teste
4. Planejar a janela de manutenção
5. Executar a migração em produção

## Referências

- [Documentação do MongoDB](https://docs.mongodb.com/)
- [Guia de Migração MongoDB](https://www.mongodb.com/basics/migration)
- [Melhores Práticas de Modelagem](https://www.mongodb.com/docs/manual/core/data-modeling-introduction/)
