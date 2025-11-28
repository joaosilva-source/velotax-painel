// scripts/recover-logs.js - Script para recuperar logs da Vercel
const fs = require('fs');
const path = require('path');

// Configurações
const VERCEL_PROJECT_ID = 'proj_xxx'; // Substituir pelo ID real
const VERCEL_TEAM_ID = 'team_xxx';     // Substituir pelo Team ID real
const OUTPUT_FILE = path.join(__dirname, '../logs/vercel-logs.json');

async function recoverVercelLogs() {
  console.log('🔍 Iniciando recuperação de logs da Vercel...');
  
  try {
    // 1. Verificar se temos credenciais da Vercel
    const vercelToken = process.env.VERCEL_TOKEN;
    if (!vercelToken) {
      console.error('❌ VERCEL_TOKEN não encontrado nas variáveis de ambiente');
      console.log('📝 Para obter o token:');
      console.log('   1. Acesse https://vercel.com/account/tokens');
      console.log('   2. Crie um novo token');
      console.log('   3. Exporte: export VERCEL_TOKEN=seu_token_aqui');
      return;
    }
    
    // 2. Listar deployments da Vercel
    console.log('📋 Buscando deployments...');
    const deployments = await fetch(
      `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/deployments`,
      {
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!deployments.ok) {
      throw new Error(`Erro ao buscar deployments: ${deployments.status}`);
    }
    
    const deploymentsData = await deployments.json();
    console.log(`✅ Encontrados ${deploymentsData.deployments.length} deployments`);
    
    // 3. Buscar logs de cada deployment
    const allLogs = [];
    
    for (const deployment of deploymentsData.deployments.slice(0, 10)) { // Últimos 10 deployments
      console.log(`📊 Buscando logs do deployment: ${deployment.url}`);
      
      try {
        const logsResponse = await fetch(
          `https://api.vercel.com/v13/deployments/${deployment.id}/logs`,
          {
            headers: {
              'Authorization': `Bearer ${vercelToken}`
            }
          }
        );
        
        if (logsResponse.ok) {
          const logs = await logsResponse.json();
          allLogs.push({
            deployment: deployment.url,
            createdAt: deployment.created,
            logs: logs
          });
        }
      } catch (error) {
        console.warn(`⚠️  Erro ao buscar logs do deployment ${deployment.url}:`, error.message);
      }
    }
    
    // 4. Salvar logs em arquivo
    const logsDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allLogs, null, 2));
    console.log(`✅ Logs salvos em: ${OUTPUT_FILE}`);
    console.log(`📈 Total de logs recuperados: ${allLogs.length}`);
    
    // 5. Extrair dados de solicitações dos logs
    const requests = [];
    
    allLogs.forEach(({ deployment, logs }) => {
      if (logs && logs.logs) {
        logs.logs.forEach(log => {
          // Procurar por logs que contenham dados de solicitações
          if (log.message && typeof log.message === 'string') {
            const message = log.message;
            
            // Regex para extrair dados de solicitações
            const cpfMatch = message.match(/cpf[\"\']?\s*[:=]\s*[\"\']?(\d{11})/i);
            const tipoMatch = message.match(/tipo[\"\']?\s*[:=]\s*[\"\']?([^\"\',\s]+)/i);
            const agenteMatch = message.match(/agente[\"\']?\s*[:=]\s*[\"\']?([^\"\',\s]+)/i);
            
            if (cpfMatch) {
              requests.push({
                deployment,
                timestamp: log.timestamp || new Date().toISOString(),
                cpf: cpfMatch[1],
                tipo: tipoMatch ? tipoMatch[1] : 'desconhecido',
                agente: agenteMatch ? agenteMatch[1] : 'desconhecido',
                rawLog: log
              });
            }
          }
        });
      }
    });
    
    // 6. Salvar solicitações extraídas
    const requestsFile = path.join(__dirname, '../logs/extracted-requests.json');
    fs.writeFileSync(requestsFile, JSON.stringify(requests, null, 2));
    console.log(`📋 Solicitações extraídas: ${requests.length}`);
    console.log(`💾 Salvas em: ${requestsFile}`);
    
    console.log('\n🎉 Recuperação concluída!');
    console.log('📝 Próximos passos:');
    console.log('   1. Revise os arquivos de logs gerados');
    console.log('   2. Importe as solicitações para o novo banco');
    console.log('   3. Verifique a consistência dos dados');
    
  } catch (error) {
    console.error('❌ Erro durante recuperação:', error.message);
  }
}

// Função para importar logs recuperados para o banco
async function importLogsToDatabase() {
  console.log('📥 Importando logs recuperados para o banco...');
  
  try {
    // Ler arquivo de solicitações extraídas
    const requestsFile = path.join(__dirname, '../logs/extracted-requests.json');
    if (!fs.existsSync(requestsFile)) {
      console.error('❌ Arquivo de solicitações não encontrado. Execute a recuperação primeiro.');
      return;
    }
    
    const requests = JSON.parse(fs.readFileSync(requestsFile, 'utf8'));
    console.log(`📊 Encontradas ${requests.length} solicitações para importar`);
    
    // Aqui você precisaria da conexão com o banco para importar
    // Isso seria feito via API ou diretamente com Prisma
    console.log('⚠️  Importação precisa ser implementada com a conexão do banco');
    
  } catch (error) {
    console.error('❌ Erro na importação:', error.message);
  }
}

// Executar função
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'recover') {
    recoverVercelLogs();
  } else if (command === 'import') {
    importLogsToDatabase();
  } else {
    console.log('📖 Uso:');
    console.log('  node scripts/recover-logs.js recover  - Recuperar logs da Vercel');
    console.log('  node scripts/recover-logs.js import   - Importar para o banco');
  }
}

module.exports = { recoverVercelLogs, importLogsToDatabase };
