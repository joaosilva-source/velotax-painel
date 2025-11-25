# Guia de Deploy - Velotax Painel

## 🚀 Opções de Deploy

### Opção 1: Vercel (Recomendado)
A forma mais fácil e rápida para projetos Next.js.

#### Passos:
1. **Preparar o Repositório**
   ```bash
   # Se ainda não tiver, inicialize o Git
   git init
   git add .
   git commit -m "Implementação de melhorias: abas dinâmicas, vídeos e ordenação"
   
   # Enviar para GitHub/GitLab
   git remote add origin <URL-DO-REPOSITORIO>
   git push -u origin main
   ```

2. **Configurar Vercel**
   - Acesse [vercel.com](https://vercel.com)
   - Importe o projeto do GitHub
   - Configure as variáveis de ambiente:
     ```
     NEXT_PUBLIC_API_URL=https://whatsapp-api-y40p.onrender.com
     NEXT_PUBLIC_DEFAULT_JID=120363400851545835@g.us
     DATABASE_URL=postgresql://usuario:senha@host:porta/database
     ```

3. **Deploy Automático**
   - Vercel fará o build e deploy automaticamente
   - URL: `https://velotax-painel.vercel.app`

### Opção 2: Render
Alternativa excelente com suporte a banco de dados.

#### Passos:
1. **Criar arquivo render.yaml**
   ```yaml
   services:
     - type: web
       name: velotax-painel
       env: node
       buildCommand: npm run build
       startCommand: npm start
       envVars:
         - key: NEXT_PUBLIC_API_URL
           value: https://whatsapp-api-y40p.onrender.com
         - key: NEXT_PUBLIC_DEFAULT_JID
           value: 120363400851545835@g.us
         - key: DATABASE_URL
           sync: false
   ```

2. **Deploy**
   ```bash
   # Instalar Render CLI
   npm install -g @render/cli
   
   # Fazer deploy
   render deploy
   ```

### Opção 3: Docker
Para maior controle e portabilidade.

#### 1. Criar Dockerfile
```dockerfile
FROM node:18-alpine AS base

# Instalar dependências
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runtime
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### 2. Criar docker-compose.yml
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://whatsapp-api-y40p.onrender.com
      - NEXT_PUBLIC_DEFAULT_JID=120363400851545835@g.us
      - DATABASE_URL=postgresql://postgres:senha@db:5432/velotax
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=velotax
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=senha
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

#### 3. Deploy com Docker
```bash
# Build e subir
docker-compose up -d --build

# Acessar em http://localhost:3000
```

### Opção 4: Railway
Simples e rápido.

#### Passos:
1. **Instalar CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login e Deploy**
   ```bash
   railway login
   railway init
   railway up
   ```

3. **Configurar Variáveis**
   ```bash
   railway variables set NEXT_PUBLIC_API_URL=https://whatsapp-api-y40p.onrender.com
   railway variables set NEXT_PUBLIC_DEFAULT_JID=120363400851545835@g.us
   ```

## 📋 Pré-Deploy Checklist

### 1. Variáveis de Ambiente
Criar `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://whatsapp-api-y40p.onrender.com
NEXT_PUBLIC_DEFAULT_JID=120363400851545835@g.us
DATABASE_URL=postgresql://usuario:senha@host:porta/database
```

### 2. Build Test
```bash
# Testar build localmente
npm run build

# Verificar se não há erros
npm start
```

### 3. Banco de Dados
- Garantir que o PostgreSQL está acessível
- Rodar migrations: `npx prisma migrate deploy`
- Gerar Prisma Client: `npx prisma generate`

### 4. Performance
- Verificar tamanho dos assets
- Configurar cache estático
- Otimizar imagens

## 🔧 Configurações Adicionais

### Vercel Config (vercel.json)
```json
{
  "buildCommand": "prisma generate && next build",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api-url",
    "NEXT_PUBLIC_DEFAULT_JID": "@default-jid"
  },
  "functions": {
    "pages/api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

### Nginx (se necessário)
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🚀 Comandos Úteis

### Deploy Manual
```bash
# Build para produção
npm run build

# Iniciar servidor de produção
npm start

# Verificar logs
pm2 logs velotax
```

### Monitoramento
```bash
# Verificar processo
pm2 status

# Reiniciar aplicação
pm2 restart velotax

# Verificar uso de memória
pm2 monit
```

## 📊 Pós-Deploy

### 1. Verificação
- Acessar a URL e testar todas as funcionalidades
- Verificar upload de vídeos
- Testar abas e ordenação
- Confirmar envio de formulários

### 2. Monitoramento
- Configurar analytics
- Setar alertas de erro
- Monitorar performance

### 3. Backup
- Backup automático do banco
- Versionamento do código
- Documentação atualizada

## 🆘 Suporte

### Problemas Comuns
1. **Build falha**: Verificar variáveis de ambiente
2. **Banco não conecta**: Testar DATABASE_URL
3. **Upload não funciona**: Verificar limites de tamanho
4. **Página lenta**: Otimizar imagens e cache

### Contato
- Documentação: [Next.js Deploy](https://nextjs.org/docs/deploying)
- Suporte Vercel: [help.vercel.com](https://help.vercel.com)
- Comunidade: [GitHub Discussions](https://github.com/vercel/next.js/discussions)

---

## 🎯 Recomendação Final

**Para produção imediata**: Use **Vercel** - é o mais simples e rápido.

**Para longo prazo**: Considere **Docker + VPS** para maior controle e economia.

**Para equipe pequena**: **Render** oferece bom balanço entre simplicidade e recursos.
