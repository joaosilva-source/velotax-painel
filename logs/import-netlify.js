// logs/import-netlify.js - Importação para Netlify Functions
const realData = [
  {
    cpf: "12345678901",
    tipo: "Exclusão de Conta",
    agente: "João Silva",
    status: "feito",
    payload: {
      velotax: "Sim",
      celcoin: "Não",
      saldoZerado: "Não",
      portabilidade: "Não",
      irpfQuitado: "Não",
      source: "netlify-recovery"
    }
  },
  {
    cpf: "98765432109",
    tipo: "Alteração Cadastral",
    agente: "Maria Santos",
    status: "pendente",
    payload: {
      campo: "Telefone",
      dadoAntigo: "11999999999",
      dadoNovo: "11888888888",
      fotosVerificadas: "Sim",
      source: "netlify-recovery"
    }
  },
  {
    cpf: "45678901234",
    tipo: "Erros / Bugs",
    agente: "Pedro Oliveira",
    status: "feito",
    payload: {
      descricao: "App não abre tela de perfil",
      anexos: 2,
      source: "netlify-recovery"
    }
  },
  {
    cpf: "78901234567",
    tipo: "Exclusão de Conta",
    agente: "Ana Costa",
    status: "feito",
    payload: {
      velotax: "Não",
      celcoin: "Sim",
      saldoZerado: "Sim",
      portabilidade: "Sim",
      irpfQuitado: "Não",
      source: "netlify-recovery"
    }
  },
  {
    cpf: "34567890123",
    tipo: "Alteração Cadastral",
    agente: "Carlos Mendes",
    status: "feito",
    payload: {
      campo: "Email",
      dadoAntigo: "email@antigo.com",
      dadoNovo: "email@novo.com",
      fotosVerificadas: "Não",
      source: "netlify-recovery"
    }
  },
  {
    cpf: "23456789012",
    tipo: "Erros / Bugs",
    agente: "Lucia Ferreira",
    status: "pendente",
    payload: {
      descricao: "Erro ao fazer upload de documento",
      anexos: 3,
      source: "netlify-recovery"
    }
  },
  {
    cpf: "89012345678",
    tipo: "Exclusão de Conta",
    agente: "Roberto Alves",
    status: "feito",
    payload: {
      velotax: "Sim",
      celcoin: "Sim",
      saldoZerado: "Não",
      portabilidade: "Não",
      irpfQuitado: "Sim",
      source: "netlify-recovery"
    }
  },
  {
    cpf: "56789012345",
    tipo: "Alteração Cadastral",
    agente: "Fernanda Lima",
    status: "feito",
    payload: {
      campo: "Endereço",
      dadoAntigo: "Rua Antiga, 123",
      dadoNovo: "Rua Nova, 456",
      fotosVerificadas: "Sim",
      source: "netlify-recovery"
    }
  },
  {
    cpf: "67890123456",
    tipo: "Erros / Bugs",
    agente: "Marcos Pereira",
    status: "feito",
    payload: {
      descricao: "App crasha ao tentar sacar",
      anexos: 1,
      source: "netlify-recovery"
    }
  },
  {
    cpf: "90123456789",
    tipo: "Exclusão de Conta",
    agente: "Juliana Castro",
    status: "feito",
    payload: {
      velotax: "Não",
      celcoin: "Não",
      saldoZerado: "Sim",
      portabilidade: "Sim",
      irpfQuitado: "Sim",
      source: "netlify-recovery"
    }
  }
];

async function importAllData() {
  console.log('🔄 Iniciando importação para Netlify Functions...');
  
  let success = 0;
  let errors = 0;
  
  for (const [index, data] of realData.entries()) {
    try {
      console.log(`📊 Importando ${index + 1}/${realData.length}: ${data.cpf} - ${data.tipo}`);
      
      const response = await fetch('/.netlify/functions/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Sucesso:', result.id);
        success++;
      } else {
        const error = await response.text();
        console.error('❌ Erro HTTP:', response.status, error);
        errors++;
      }
      
      // Pequeno delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error('❌ Erro de rede:', error.message);
      errors++;
    }
  }
  
  console.log(`\n🎉 Importação concluída!\n✅ Sucessos: ${success}\n❌ Erros: ${errors}`);
  
  // Verificar dados
  try {
    const verifyResponse = await fetch('/.netlify/functions/api/requests');
    const allData = await verifyResponse.json();
    console.log(`📊 Total de registros: ${allData.length}`);
    
    // Mostrar amostras
    console.log('\n📋 Amostras importadas:');
    allData.slice(0, 3).forEach(r => {
      console.log(`  ${r.cpf} - ${r.tipo} - ${r.agente}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar:', error.message);
  }
}

// Função para limpar
async function cleanData() {
  console.log('🧹 Limpando dados de teste...');
  
  try {
    const response = await fetch('/.netlify/functions/api/requests');
    const allData = await response.json();
    
    const testData = allData.filter(r => 
      r.payload && r.payload.source === 'netlify-recovery'
    );
    
    console.log(`📊 Encontrados ${testData.length} registros para limpar`);
    
    for (const item of testData) {
      await fetch(`/.netlify/functions/api/requests?id=${item.id}`, { method: 'DELETE' });
    }
    
    console.log('✅ Limpeza concluída');
  } catch (error) {
    console.error('❌ Erro na limpeza:', error.message);
  }
}

// Exportar para uso no console
window.importNetlifyData = importAllData;
window.cleanNetlifyData = cleanData;

console.log('📋 Script Netlify pronto!');
console.log('🚀 Execute: importNetlifyData() para importar');
console.log('🧹 Execute: cleanNetlifyData() para limpar');
