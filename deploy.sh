#!/bin/bash

# Script de Deploy - Velotax Painel
# Uso: ./deploy.sh [vercel|render|docker|local]

set -e

echo "🚀 Iniciando deploy do Velotax Painel..."

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado. Execute este script no diretório raiz do projeto."
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Erro: Node.js não está instalado."
    exit 1
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ Erro: npm não está instalado."
    exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Gerar Prisma Client
echo "🗄️ Gerando Prisma Client..."
npx prisma generate

# Build do projeto
echo "🔨 Build do projeto..."
npm run build

# Verificar se o build foi bem-sucedido
if [ ! -d ".next" ]; then
    echo "❌ Erro: Build falhou. Diretório .next não encontrado."
    exit 1
fi

# Tipo de deploy
DEPLOY_TYPE=${1:-vercel}

case $DEPLOY_TYPE in
    "vercel")
        echo "🌐 Deploy para Vercel..."
        
        # Verificar se tem Vercel CLI
        if ! command -v vercel &> /dev/null; then
            echo "📥 Instalando Vercel CLI..."
            npm install -g vercel
        fi
        
        # Deploy
        vercel --prod
        ;;
        
    "render")
        echo "🎨 Deploy para Render..."
        
        # Verificar se tem Render CLI
        if ! command -v render &> /dev/null; then
            echo "📥 Instalando Render CLI..."
            npm install -g @render/cli
        fi
        
        # Deploy
        render deploy
        ;;
        
    "docker")
        echo "🐳 Build e deploy com Docker..."
        
        # Verificar se tem Docker
        if ! command -v docker &> /dev/null; then
            echo "❌ Erro: Docker não está instalado."
            exit 1
        fi
        
        # Build da imagem
        docker build -t velotax-painel .
        
        # Run container
        docker run -d -p 3000:3000 --name velotax-painel velotax-painel
        
        echo "✅ Aplicação rodando em http://localhost:3000"
        ;;
        
    "local")
        echo "🏠 Iniciando servidor local..."
        npm start
        ;;
        
    *)
        echo "❌ Tipo de deploy inválido. Opções: vercel, render, docker, local"
        exit 1
        ;;
esac

echo "✅ Deploy concluído com sucesso!"

# Pós-deploy
echo "🔍 Verificação pós-deploy..."

# Testar se a aplicação está respondendo
if command -v curl &> /dev/null; then
    if curl -f http://localhost:3000 &> /dev/null; then
        echo "✅ Aplicação respondendo corretamente!"
    else
        echo "⚠️ Aviso: Aplicação não está respondendo em http://localhost:3000"
    fi
fi

echo "🎉 Deploy finalizado!"
echo "📋 Próximos passos:"
echo "   1. Configure as variáveis de ambiente"
echo "   2. Teste todas as funcionalidades"
echo "   3. Configure monitoramento"
echo "   4. Faça backup regular do banco de dados"
