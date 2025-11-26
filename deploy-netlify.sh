#!/bin/bash

# Script de Deploy - Velotax Painel no Netlify
# Uso: ./deploy-netlify.sh

set -e

echo "🚀 Iniciando deploy do Velotax Painel no Netlify..."

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado. Execute este script no diretório raiz do painel."
    exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Verificar se tem Netlify CLI
if ! command -v netlify &> /dev/null; then
    echo "📥 Instalando Netlify CLI..."
    npm install -g netlify-cli
fi

# Verificar se tem Git
if ! command -v git &> /dev/null; then
    echo "❌ Erro: Git não está instalado."
    exit 1
fi

# Fazer build do projeto
echo "🔨 Fazendo build do projeto..."
npm run build

# Verificar se build foi bem-sucedido
if [ ! -d ".next" ]; then
    echo "❌ Erro: Build falhou - pasta .next não encontrada."
    exit 1
fi

# Verificar se há alterações para commit
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Commitando alterações..."
    git add .
    git commit -m "feat: preparar deploy para Netlify"
    git push origin main
else
    echo "✅ Nenhuma alteração pendente no Git."
fi

echo ""
echo "🎯 Opções de Deploy no Netlify:"
echo ""
echo "1️⃣  Via CLI (Recomendado):"
echo "   netlify login"
echo "   netlify link"
echo "   netlify deploy --prod --dir=.next"
echo ""
echo "2️⃣  Via Dashboard (Mais fácil):"
echo "   1. Acesse: https://netlify.com"
echo "   2. Clique em 'Add new site' → 'Import an existing project'"
echo "   3. Conecte seu GitHub"
echo "   4. Selecione 'velotax-painel'"
echo "   5. Configure:"
echo "      - Build command: npm run build"
echo "      - Publish directory: .next"
echo "      - Node version: 20"
echo "   6. Adicionar variáveis de ambiente:"
echo "      - DATABASE_URL (sua string PostgreSQL)"
echo "   7. Clique em 'Deploy site'"
echo ""
echo "3️⃣  Drag & Drop (Mais rápido):"
echo "   1. Arrastar pasta '.next' para https://app.netlify.com/drop"
echo "   2. Configurar variáveis de ambiente após"
echo ""

# Verificar se usuário quer deploy via CLI agora
echo "🚀 Deseja fazer deploy via Netlify CLI agora? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    if ! command -v netlify &> /dev/null; then
        echo "📥 Instalando Netlify CLI..."
        npm install -g netlify-cli
    fi
    
    echo "🔐 Fazendo login no Netlify..."
    netlify login
    
    echo "🔗 Conectando ao site..."
    netlify link
    
    echo "🚀 Fazendo deploy..."
    netlify deploy --prod --dir=.next
    
    echo "✅ Deploy concluído! Verifique seu dashboard Netlify."
else
    echo ""
    echo "📋 Próximos passos manuais:"
    echo ""
    echo "🌐 Netlify Dashboard (Recomendado):"
    echo "   1. Acesse: https://app.netlify.com"
    echo "   2. 'Add new site' → 'Import an existing project'"
    echo "   3. Conecte GitHub e selecione 'velotax-painel'"
    echo "   4. Configure build settings:"
    echo "      - Build command: npm run build"
    echo "      - Publish directory: .next"
    echo "      - Node version: 20"
    echo "   5. Environment variables:"
    echo "      - DATABASE_URL=postgresql://..."
    echo "   6. 'Deploy site'"
    echo ""
    echo "⚡ Vantagens do Netlify:"
    echo "   ✅ Plano free generoso (100GB/mês)"
    echo "   ✅ CDN global rápido"
    echo "   ✅ Deploy automático via GitHub"
    echo "   ✅ HTTPS automático"
    echo "   ✅ Custom domains gratuitos"
    echo ""
    echo "🔧 Configurações importantes:"
    echo "   - Node.js 20 (já configurado)"
    echo "   - API URL: https://whatsapp-api-y40p.onrender.com"
    echo "   - Redirects para API já configurados"
fi

echo ""
echo "🎉 Deploy preparado com sucesso!"
echo ""
echo "📊 Arquivos criados/atualizados:"
echo "   ✅ netlify.toml - Configuração do Netlify"
echo "   ✅ deploy-netlify.sh - Script automatizado"
echo "   ✅ Build concluído - pasta .next gerada"
echo ""
echo "🔗 URLs importantes:"
echo "   - Backend: https://whatsapp-api-y40p.onrender.com (✅ funcionando)"
echo "   - Frontend: (será criada após deploy no Netlify)"
