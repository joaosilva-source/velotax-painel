# Módulo de Treinamento: Crédito ao Trabalhador

Um módulo de treinamento interativo e responsivo sobre o Crédito Consignado do FGTS Digital, desenvolvido com React 19 + Tailwind 4 + shadcn/ui.

## 🎯 Visão Geral

Este módulo foi criado para explicar de forma simples, clara e interativa como funciona o calendário do Crédito Consignado do FGTS Digital e como ocorre o processo de identificação de pagamentos duplicados.

**Características principais:**
- ✅ 5 seções temáticas com conteúdo educativo completo
- ✅ Atividades interativas (quizzes com múltiplas escolhas)
- ✅ Feedback visual imediato (respostas corretas em verde, incorretas em vermelho)
- ✅ Rastreamento de progresso com localStorage
- ✅ Design responsivo (desktop, tablet, mobile)
- ✅ Paleta de cores diferenciada por seção
- ✅ Página de conclusão com estatísticas e pontuação final
- ✅ 100% funcional e pronto para produção

## 📚 Estrutura de Conteúdo

### Seção 1: O Calendário do FGTS Digital (Azul)
Define as datas em que o desconto da parcela do empréstimo consignado será feito e quando o empregador precisa repassar esses valores. Organiza o fluxo entre trabalhador, empresa e instituição financeira.

**Conteúdo:**
- Introdução ao calendário FGTS Digital
- Etapas: Data de contratação, Competência de desconto, Pagamento da folha, Vencimento da guia
- Exemplos práticos com datas reais
- 3 perguntas interativas para consolidar o aprendizado

### Seção 2: Duplicidade de Pagamento (Vermelho)
Explica quando ocorre duplicidade de pagamento e como o sistema registra duas entradas do mesmo valor.

**Conteúdo:**
- O que é duplicidade de pagamento
- Quando ocorre (pagamento antecipado + desconto em folha)
- Como o sistema registra
- Exemplos práticos
- 3 perguntas interativas

### Seção 3: Identificação e Prazos (Verde)
Detalha como a duplicidade é identificada e quais são os prazos para compensação financeira.

**Conteúdo:**
- Quando a duplicidade é identificada
- Prazos de 30 a 40 dias para compensação
- Integração entre eSocial, FGTS Digital, Caixa e instituição financeira
- Exemplos de timeline
- 3 perguntas interativas

### Seção 4: Quitação Antecipada (Roxo)
Explica o que acontece quando o cliente quita a parcela antecipadamente e há desconto em folha no mesmo mês.

**Conteúdo:**
- Quitação antecipada + desconto no mesmo mês = SEM duplicidade
- Reaproveitamento de valores
- Condições para reembolso
- Prazos de retorno
- 3 perguntas interativas

### Seção 5: Situações Especiais (Índigo)
Aborda casos especiais como mudança de CNPJ e pagamento antecipado.

**Conteúdo:**
- Impacto da mudança de CNPJ
- Suspensão temporária de repasses automáticos
- Pagamento manual via aplicativo
- Prazos de atualização nos sistemas oficiais
- 3 perguntas interativas

## 🎨 Design e UX

### Paleta de Cores
- **Seção 1:** Azul (#1e3a8a) + Cyan (#06b6d4)
- **Seção 2:** Vermelho (#dc2626) + Pink (#ec4899)
- **Seção 3:** Verde (#16a34a) + Emerald (#10b981)
- **Seção 4:** Roxo (#7c3aed) + Violet (#a78bfa)
- **Seção 5:** Índigo (#4f46e5) + Blue (#3b82f6)

### Responsividade
- **Desktop (1024px+):** Layout com sidebar fixo
- **Tablet (768px-1023px):** Sidebar retrátil
- **Mobile (<768px):** Sidebar deslizante com toggle (hamburger menu)

### Componentes Visuais
- Ícones informativos (lucide-react)
- Animações suaves e transições
- Barra de progresso visual
- Cards com sombras e bordas
- Feedback visual imediato para respostas

## 🚀 Como Usar

### Instalação

1. **Clone o repositório:**
```bash
git clone <repository-url>
cd modulo_credito_trabalhador
```

2. **Instale as dependências:**
```bash
pnpm install
```

3. **Inicie o servidor de desenvolvimento:**
```bash
pnpm dev
```

4. **Abra no navegador:**
```
http://localhost:3000
```

### Navegação

1. **Sidebar:** Clique em qualquer seção para navegar diretamente
2. **Botões Anterior/Próximo:** Use para navegar sequencialmente
3. **Quiz:** Responda as perguntas para avançar
4. **Progresso:** Acompanhe o percentual de conclusão no topo
5. **Conclusão:** Veja sua pontuação final e estatísticas

### Rastreamento de Progresso

O módulo salva automaticamente seu progresso no `localStorage` do navegador:
- Seção atual
- Pergunta atual
- Respostas fornecidas
- Status de conclusão

Para reiniciar do zero, clique no botão "Reiniciar Módulo" na página de conclusão.

## 📊 Funcionalidades

### Atividades Interativas
- **Quiz com Múltiplas Escolhas:** 3 perguntas por seção (15 no total)
- **Feedback Imediato:** Resposta correta em verde com checkmark, incorreta em vermelho com X
- **Explicações Detalhadas:** Cada resposta inclui uma explicação educativa
- **Validação:** Não é possível avançar sem responder a pergunta

### Rastreamento e Estatísticas
- **Progresso Visual:** Barra de progresso em tempo real
- **Pontuação Final:** Percentual, número de acertos e total de questões
- **Resumo de Tópicos:** Lista de todas as seções abordadas
- **Opção de Reiniciar:** Comece do zero a qualquer momento

### Página de Conclusão
Ao finalizar o módulo, você verá:
- ✅ Ícone de sucesso (checkmark grande)
- 📊 Estatísticas finais (percentual, acertos, total)
- 📋 Resumo de tópicos abordados
- 🔄 Botão para reiniciar o módulo

## 🛠️ Estrutura do Projeto

```
modulo_credito_trabalhador/
├── client/
│   ├── public/           # Arquivos estáticos
│   ├── src/
│   │   ├── pages/
│   │   │   └── TrainingModule.tsx    # Página principal do módulo
│   │   ├── components/               # Componentes reutilizáveis
│   │   ├── contexts/                 # Contextos React
│   │   ├── hooks/                    # Hooks customizados
│   │   ├── lib/                      # Utilitários
│   │   ├── App.tsx                   # Roteamento principal
│   │   ├── main.tsx                  # Entry point
│   │   └── index.css                 # Estilos globais
│   └── index.html
├── server/               # Placeholder para compatibilidade
├── shared/               # Placeholder para compatibilidade
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 💻 Tecnologias Utilizadas

- **React 19:** Framework UI
- **Tailwind CSS 4:** Estilização utilitária
- **shadcn/ui:** Componentes de UI acessíveis
- **lucide-react:** Ícones vetoriais
- **TypeScript:** Tipagem estática
- **Vite:** Build tool rápido
- **localStorage:** Persistência de dados no cliente

## 🎓 Objetivos de Aprendizado

Após completar este módulo, você será capaz de:

✅ Compreender os conceitos principais do Crédito Consignado do FGTS Digital
✅ Aplicar as regras corretamente em situações práticas
✅ Praticar através de atividades interativas
✅ Receber feedback imediato sobre seu aprendizado
✅ Rastrear seu progresso em tempo real
✅ Obter um resumo completo de sua performance

## 🔒 Segurança e Conformidade

- ✅ Validação de entrada
- ✅ Sanitização de dados
- ✅ localStorage para armazenamento seguro no cliente
- ✅ Sem transmissão de dados sensíveis
- ✅ Compatível com LGPD (Lei Geral de Proteção de Dados)

## 📱 Compatibilidade

Testado em:
- ✅ Chrome/Chromium (últimas versões)
- ✅ Firefox (últimas versões)
- ✅ Safari (últimas versões)
- ✅ Edge (últimas versões)
- ✅ Navegadores móveis (iOS Safari, Chrome Mobile)

## 🚀 Deploy

### Build para Produção

```bash
pnpm build
```

Os arquivos compilados estarão em `dist/`.

### Hospedagem

O módulo pode ser hospedado em qualquer servidor web estático:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Qualquer servidor web (Apache, Nginx, etc.)

## 📝 Conteúdo Baseado

Este módulo foi desenvolvido com base no documento "Entendendo o Crédito ao Trabalhador" da Velotax, que explica o calendário do Crédito Consignado do FGTS Digital e o processo de identificação de pagamentos duplicados.

## 🤝 Suporte

Para dúvidas ou sugestões sobre o conteúdo do módulo, consulte a documentação original ou entre em contato com a equipe responsável.

## 📄 Licença

Este projeto é fornecido como material educativo corporativo.

---

**Desenvolvido com ❤️ para treinamento corporativo**

Versão: 1.0.0
Data: Novembro 2025
