// scripts/import-requests.js - Importar solicitações recuperadas para o banco
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importRequests() {
  console.log('📥 Iniciando importação de solicitações...');
  
  try {
    // 1. Ler arquivo de solicitações recuperadas
    const requestsFile = path.join(__dirname, '../logs/extracted-requests.json');
    
    if (!fs.existsSync(requestsFile)) {
      console.error('❌ Arquivo de solicitações não encontrado!');
      console.log('📝 Execute primeiro: node scripts/recover-logs.js recover');
      return;
    }
    
    const requests = JSON.parse(fs.readFileSync(requestsFile, 'utf8'));
    console.log(`📊 Encontradas ${requests.length} solicitações para importar`);
    
    // 2. Conectar ao banco e verificar estado atual
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados');
    
    const currentCount = await prisma.request.count();
    console.log(`📋 Banco atual: ${currentCount} solicitações`);
    
    // 3. Processar cada solicitação
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const req of requests) {
      try {
        // Verificar se já existe (evitar duplicatas)
        const existing = await prisma.request.findFirst({
          where: {
            cpf: req.cpf,
            tipo: req.tipo,
            createdAt: new Date(req.timestamp)
          }
        });
        
        if (existing) {
          skipped++;
          continue;
        }
        
        // Criar nova solicitação
        await prisma.request.create({
          data: {
            cpf: req.cpf,
            tipo: req.tipo,
            agente: req.agente || 'Sistema',
            status: 'importado', // Status especial para logs recuperados
            payload: {
              source: 'vercel-recovery',
              deployment: req.deployment,
              originalLog: req.rawLog,
              importedAt: new Date().toISOString()
            },
            createdAt: new Date(req.timestamp)
          }
        });
        
        imported++;
        
      } catch (error) {
        console.error(`❌ Erro ao importar solicitação ${req.cpf}:`, error.message);
        errors++;
      }
    }
    
    // 4. Relatório final
    const finalCount = await prisma.request.count();
    
    console.log('\n🎉 Importação concluída!');
    console.log(`📊 Estatísticas:`);
    console.log(`   ✅ Importadas: ${imported}`);
    console.log(`   ⏭️  Puladas: ${skipped}`);
    console.log(`   ❌ Erros: ${errors}`);
    console.log(`📋 Total no banco: ${finalCount} (antes: ${currentCount})`);
    
    // 5. Mostrar algumas amostras
    const sample = await prisma.request.findMany({
      where: { status: 'importado' },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n📋 Amostras importadas:');
    sample.forEach(r => {
      console.log(`   ${r.cpf} - ${r.tipo} - ${r.agente} - ${r.createdAt}`);
    });
    
  } catch (error) {
    console.error('❌ Erro geral na importação:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function createBackup() {
  console.log('💾 Criando backup do banco atual...');
  
  try {
    await prisma.$connect();
    
    const allRequests = await prisma.request.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    const backupFile = path.join(__dirname, '../logs/backup-before-import.json');
    fs.writeFileSync(backupFile, JSON.stringify(allRequests, null, 2));
    
    console.log(`✅ Backup criado: ${backupFile}`);
    console.log(`📊 Total de registros: ${allRequests.length}`);
    
  } catch (error) {
    console.error('❌ Erro no backup:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar função
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'import') {
    importRequests();
  } else if (command === 'backup') {
    createBackup();
  } else if (command === 'full') {
    createBackup().then(() => importRequests());
  } else {
    console.log('📖 Uso:');
    console.log('  node scripts/import-requests.js backup  - Criar backup do banco');
    console.log('  node scripts/import-requests.js import  - Importar solicitações');
    console.log('  node scripts/import-requests.js full    - Backup + importação');
  }
}

module.exports = { importRequests, createBackup };
