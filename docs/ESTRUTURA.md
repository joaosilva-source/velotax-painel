# Estrutura do Projeto

Este documento descreve a estrutura do projeto e como adicionar novos recursos.

## Visão Geral

```
velotax-painel/
├── components/         # Componentes React reutilizáveis
├── lib/
│   ├── config/        # Configurações globais
│   ├── services/      # Serviços (API, armazenamento, etc.)
│   └── utils/         # Funções utilitárias
├── pages/             # Rotas da aplicação
│   ├── api/           # Rotas da API
│   └── admin/         # Páginas administrativas
├── public/            # Arquivos estáticos
├── styles/            # Estilos globais
└── prisma/            # Configuração do Prisma (se aplicável)
```

## Adicionando um Novo Serviço

1. Crie um novo arquivo em `lib/services/`
2. Exporte as funções do serviço
3. Importe o serviço onde for necessário

Exemplo:

```javascript
// lib/services/meuServico.js
import { httpJson } from './http';

export const MeuServico = {
  async buscarDados() {
    return httpJson('/api/endpoint');
  },
  // ... outros métodos
};
```

## Adicionando um Novo Componente

1. Crie um novo arquivo em `components/`
2. Use a convenção de nomenclatura PascalCase
3. Documente as props com PropTypes ou TypeScript

## Configurações

- **Notificações**: `lib/config/notifications.js`
- **Armazenamento**: `lib/services/storage.js`
- **Estilos**: `styles/globals.css`

## Convenções

- Use `camelCase` para nomes de funções e variáveis
- Use `PascalCase` para componentes React
- Use `UPPER_CASE` para constantes
- Documente funções e componentes com JSDoc

## Testes

Para adicionar testes, crie arquivos com o padrão `*.test.js` ou `*.spec.js`.
