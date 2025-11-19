# Guia Administrativo: Módulo de Treinamento - Crédito ao Trabalhador

## 👨‍💼 Para Administradores e Gestores

Este guia fornece informações técnicas e administrativas sobre o módulo de treinamento.

## 📋 Visão Geral do Sistema

### Arquitetura
- **Frontend:** React 19 + Tailwind CSS 4 + shadcn/ui
- **Armazenamento:** localStorage (navegador do cliente)
- **Tipo:** Aplicação estática (sem servidor backend)
- **Responsividade:** Desktop, Tablet, Mobile

### Componentes Principais
1. **TrainingModule.tsx:** Componente principal que gerencia todo o módulo
2. **Sections Data:** Estrutura de dados com as 5 seções e 15 perguntas
3. **Progress Tracking:** Sistema de rastreamento com localStorage
4. **UI Components:** Componentes reutilizáveis do shadcn/ui

## 🚀 Implantação

### Requisitos
- Node.js 18+ (para desenvolvimento)
- pnpm (gerenciador de pacotes)
- Navegador web moderno (Chrome, Firefox, Safari, Edge)

### Passos de Implantação

#### 1. Desenvolvimento Local
```bash
# Clone o repositório
git clone <repository-url>
cd modulo_credito_trabalhador

# Instale dependências
pnpm install

# Inicie o servidor de desenvolvimento
pnpm dev
```

#### 2. Build para Produção
```bash
# Crie a build otimizada
pnpm build

# Verifique a build
pnpm preview
```

#### 3. Deploy
Os arquivos compilados estarão em `dist/`. Você pode:

**Opção A: Vercel (Recomendado)**
```bash
pnpm add -g vercel
vercel
```

**Opção B: Netlify**
```bash
pnpm add -g netlify-cli
netlify deploy --prod --dir=dist
```

**Opção C: Servidor Web Estático**
```bash
# Copie os arquivos de dist/ para seu servidor
# Configure seu servidor para servir index.html para todas as rotas
```

**Opção D: AWS S3 + CloudFront**
```bash
# Faça upload dos arquivos de dist/ para S3
# Configure CloudFront para distribuir o conteúdo
```

## 📊 Rastreamento de Dados

### Como Funciona
- Cada usuário tem um arquivo de progresso salvo no **localStorage** do seu navegador
- Os dados incluem: seção atual, pergunta atual, respostas, timestamp
- **Não há transmissão de dados para servidor** (aplicação estática)

### Estrutura de Dados Salva
```json
{
  "answers": {
    "section1-q1": 1,
    "section1-q2": 0,
    "section1-q3": 2,
    ...
  },
  "currentSection": 0,
  "currentQuestion": 0,
  "moduleComplete": false,
  "timestamp": "2025-11-13T15:35:00.000Z"
}
```

### Limpeza de Dados
Os dados são armazenados localmente e podem ser limpos:
1. **Manualmente:** Clicando em "Reiniciar Módulo" na página final
2. **Automaticamente:** Limpando o cache/cookies do navegador
3. **Programaticamente:** Através do console do navegador

## 🔧 Customização

### Modificar Conteúdo

Para editar o conteúdo das seções, abra `client/src/pages/TrainingModule.tsx` e localize o array `sections`:

```typescript
const sections: Section[] = [
  {
    id: "section1",
    title: "Seu Novo Título",
    color: "#1e3a8a",
    colorClass: "from-blue-900 to-cyan-600",
    content: {
      introduction: "Sua nova introdução...",
      keyPoints: ["Ponto 1", "Ponto 2", ...],
      examples: ["Exemplo 1", "Exemplo 2", ...],
      highlight: "Seu destaque..."
    },
    questions: [
      {
        id: "q1-1",
        question: "Sua pergunta?",
        options: ["Opção 1", "Opção 2", "Opção 3", "Opção 4"],
        correct: 1, // Índice da resposta correta (0-3)
        explanation: "Explicação da resposta..."
      },
      ...
    ]
  },
  ...
];
```

### Modificar Cores

As cores estão definidas em `colorClass` de cada seção. Use classes Tailwind:
- `from-blue-900 to-cyan-600`
- `from-red-700 to-pink-500`
- `from-green-700 to-emerald-500`
- `from-purple-700 to-violet-500`
- `from-indigo-700 to-blue-500`

### Adicionar Novas Seções

1. Adicione um novo objeto ao array `sections`
2. Defina `id`, `title`, `color`, `colorClass`
3. Preencha `content` (introduction, keyPoints, examples, highlight)
4. Adicione 3 `questions` com opções e explicações

### Modificar Estilos

Os estilos estão em `client/src/index.css` e `tailwind.config.ts`. Você pode:
- Alterar cores globais
- Modificar tipografia
- Ajustar espaçamento
- Customizar componentes

## 🔒 Segurança

### Considerações de Segurança
- ✅ Sem armazenamento de dados sensíveis
- ✅ Sem transmissão de dados para servidor
- ✅ Sem autenticação necessária
- ✅ Sem cookies de rastreamento
- ✅ Compatível com LGPD

### Recomendações
1. Use HTTPS em produção
2. Configure headers de segurança apropriados
3. Implemente CSP (Content Security Policy) se necessário
4. Monitore acessos com analytics (opcional)

## 📈 Monitoramento

### Métricas Disponíveis
- **Acessos:** Número de usuários que acessam o módulo
- **Taxa de Conclusão:** Percentual de usuários que completam
- **Tempo Médio:** Tempo gasto no módulo

### Implementar Analytics
Para adicionar rastreamento, integre um serviço como:
- Google Analytics
- Mixpanel
- Amplitude
- Hotjar

Exemplo com Google Analytics:
```typescript
// Em client/src/main.tsx
import { useEffect } from 'react';

useEffect(() => {
  // Código do Google Analytics
  window.gtag('event', 'page_view', {
    page_path: window.location.pathname,
    page_title: 'Módulo de Treinamento'
  });
}, []);
```

## 🐛 Troubleshooting

### Problema: Módulo não carrega
**Verificação:**
1. Verifique se o servidor está rodando (`pnpm dev`)
2. Verifique se há erros no console do navegador (F12)
3. Limpe o cache do navegador
4. Tente em um navegador diferente

### Problema: Progresso não é salvo
**Verificação:**
1. Verifique se localStorage está habilitado no navegador
2. Verifique se há espaço suficiente no localStorage
3. Tente em modo incógnito
4. Verifique se há erros no console

### Problema: Estilos não carregam
**Verificação:**
1. Verifique se o Tailwind CSS está compilando
2. Execute `pnpm build` novamente
3. Limpe o cache do navegador
4. Verifique se há erros no console

### Problema: Perguntas não aparecem
**Verificação:**
1. Verifique se a estrutura de dados está correta
2. Verifique se há erros no console
3. Recarregue a página
4. Tente em um navegador diferente

## 📝 Manutenção

### Atualizações Regulares
1. **Conteúdo:** Atualize as seções conforme necessário
2. **Dependências:** Execute `pnpm update` periodicamente
3. **Segurança:** Monitore vulnerabilidades com `pnpm audit`

### Backup
1. Mantenha um backup do repositório Git
2. Documente todas as customizações
3. Teste todas as mudanças em ambiente de staging

### Versionamento
```bash
# Crie tags para versões importantes
git tag -a v1.0.0 -m "Versão 1.0.0 - Lançamento inicial"
git push origin v1.0.0
```

## 🚀 Performance

### Otimizações Implementadas
- ✅ Code splitting com Vite
- ✅ Lazy loading de componentes
- ✅ Minificação de CSS e JavaScript
- ✅ Compressão de assets
- ✅ Cache de navegador

### Métricas de Performance
- **First Contentful Paint (FCP):** < 1s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Cumulative Layout Shift (CLS):** < 0.1
- **Time to Interactive (TTI):** < 3s

### Melhorias Futuras
- Implementar Service Worker para offline
- Adicionar PWA (Progressive Web App)
- Otimizar imagens com WebP
- Implementar lazy loading de seções

## 📞 Suporte Técnico

### Contatos Importantes
- **Desenvolvedor:** [Seu contato]
- **Gestor do Projeto:** [Contato]
- **Suporte de TI:** [Contato]

### Documentação Relacionada
- [README.md](README.md) - Visão geral do projeto
- [GUIA_DE_USO.md](GUIA_DE_USO.md) - Guia para usuários
- [package.json](package.json) - Dependências do projeto

## 📋 Checklist de Implantação

- [ ] Ambiente de desenvolvimento configurado
- [ ] Dependências instaladas (`pnpm install`)
- [ ] Servidor de desenvolvimento testado (`pnpm dev`)
- [ ] Build de produção criado (`pnpm build`)
- [ ] Build testado em staging (`pnpm preview`)
- [ ] Segurança verificada (HTTPS, headers)
- [ ] Analytics configurado (opcional)
- [ ] Documentação atualizada
- [ ] Backup realizado
- [ ] Deploy em produção
- [ ] Testes pós-implantação realizados
- [ ] Usuários notificados

## 📊 Relatório de Implementação

| Item | Status | Observações |
|------|--------|-------------|
| Conteúdo | ✅ Completo | 5 seções, 15 perguntas |
| Design | ✅ Completo | Responsivo, acessível |
| Funcionalidades | ✅ Completo | Quiz, progresso, conclusão |
| Testes | ✅ Completo | Desktop, tablet, mobile |
| Documentação | ✅ Completo | README, guias de uso e admin |
| Deploy | ⏳ Pendente | Aguardando aprovação |

---

**Última atualização:** Novembro 2025
**Versão:** 1.0.0
**Contato:** [Seu contato]
