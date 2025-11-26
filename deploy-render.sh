#!/bin/bash

# Script de Deploy - Velotax Painel no Render
# Uso: ./deploy-render.sh

set -e

echo "🚀 Iniciando deploy do Velotax Painel no Render..."

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado. Execute este script no diretório raiz do painel."
    exit 1
fi

# Verificar se tem Railway CLI (alternativa)
if ! command -v railway &> /dev/null; then
    echo "📥 Instalando Railway CLI como alternativa..."
    npm install -g @railway/cli
fi

# Verificar se tem Git
if ! command -v git &> /dev/null; then
    echo "❌ Erro: Git não está instalado."
    exit 1
fi

# Verificar se há alterações para commit
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Commitando alterações..."
    git add .
    git commit -m "feat: adicionar configuração de deploy no Render"
    git push origin main
else
    echo "✅ Nenhuma alteração pendente no Git."
fi

echo ""
echo "🎯 Opções de Deploy:"
echo ""
echo "1️⃣  Render (Recomendado):"
echo "   - Acesse: https://render.com"
echo "   - Conecte seu repositório GitHub"
echo "   - Importe o projeto 'velotax-painel'"
echo "   - O render.yaml será detectado automaticamente"
echo ""
echo "2️⃣  Railway (Alternativa):"
echo "   - Execute: railway login"
echo "   - Execute: railway up"
echo ""
echo "3️⃣  Netlify (Frontend apenas):"
echo "   - Execute: npm install -g netlify-cli"
echo "   - Execute: npm run build"
echo "   - Execute: netlify deploy --prod --dir=.next"
echo ""

# Verificar se usuário quer Railway
echo "🚂 Deseja fazer deploy via Railway agora? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    if ! command -v railway &> /dev/null; then
        echo "📥 Instalando Railway CLI..."
        npm install -g @railway/cli
    fi
    
    echo "🔐 Fazendo login no Railway..."
    railway login
    
    echo "🚀 Fazendo deploy..."
    railway up
    
    echo "✅ Deploy concluído! Verifique seu dashboard Railway."
else
    echo ""
    echo "📋 Próximos passos manuais:"
    echo ""
    echo "🎨 Render (Recomendado):"
    echo "   1. Acesse: https://render.com"
    echo "   2. Crie uma conta ou faça login"
    echo "   3. Clique em 'New +' -> 'Web Service'"
    echo "   4. Conecte seu repositório GitHub"
    echo "   5. Selecione 'velotax-painel'"
    echo "   6. O render.yaml será detectado automaticamente"
    echo "   7. Configure as variáveis de ambiente:"
    echo "      - DATABASE_URL (sua string PostgreSQL)"
    echo "   8. Clique em 'Create Web Service'"
    echo ""
    echo "🔧 Configurações importantes:"
    echo "   - Build Command: npm install"
    echo "   - Start Command: npm start"
    echo "   - Health Check: /api/health"
    echo ""
    echo "⚠️  Não se esqueça de configurar o DATABASE_URL!"
fi

echo ""
echo "🎉 Deploy preparado com sucesso!"
echo ""
echo "📊 Arquivos criados:"
echo "   ✅ render.yaml - Configuração do Render"
echo "   ✅ pages/api/health.js - Health check endpoint"
echo "   ✅ deploy-render.sh - Script automatizado"
echo ""
echo "🔗 URLs importantes:"
echo "   - Backend: https://whatsapp-api-y40p.onrender.com"
echo "   - Frontend: (será criada após deploy)"
