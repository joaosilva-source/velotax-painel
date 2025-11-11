// pages/index.js
import { useEffect, useState } from "react";
import FormSolicitacao from "@/components/FormSolicitacao";
import Head from "next/head";

export default function Home() {
  const [logs, setLogs] = useState([]);
  const [lastInboxCount, setLastInboxCount] = useState(0);
  const [searchCpf, setSearchCpf] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [stats, setStats] = useState({ 
    today: 0, 
    pending: 0, 
    done: 0,
    total: 0
  });
  const [mounted, setMounted] = useState(false);

  // Efeito para garantir que o código só rode no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  const registrarLog = (msg) => {
    setLogs((prev) => [
      { msg, time: new Date().toLocaleString("pt-BR") },
      ...prev.slice(0, 9) // Manter apenas os 10 logs mais recentes
    ]);
  };

  // Poll de respostas (menções/replies do WhatsApp) para o agente atual
  useEffect(() => {
    const getAgent = () => {
      try { return localStorage.getItem('velotax_agent') || ''; } catch { return ''; }
    };
    const poll = async () => {
      const agent = getAgent();
      if (!agent) return;
      try {
        const r = await fetch(`/api/requests/inbox?agent=${encodeURIComponent(agent)}`);
        if (!r.ok) return;
        const j = await r.json();
        const items = Array.isArray(j?.items) ? j.items : [];
        if (items.length > lastInboxCount) {
          // registrar apenas as novas respostas
          items.slice(0, items.length - lastInboxCount).forEach((it) => {
            registrarLog(`📩 Resposta recebida: ${it.text}`);
          });
          setLastInboxCount(items.length);
        }
      } catch {}
    };
    poll();
    const id = setInterval(poll, 10000);
    return () => clearInterval(id);
  }, [lastInboxCount]);

  // Função para buscar CPF
  const buscarCpf = () => {
    if (!searchCpf.trim()) {
      registrarLog("Digite um CPF para buscar");
      return;
    }
    
    setSearchLoading(true);
    registrarLog(`Buscando CPF: ${searchCpf}`);
    
    // Simulando busca assíncrona
    setTimeout(() => {
      setSearchResults([
        { 
          id: 1, 
          nome: "Exemplo Cliente", 
          cpf: searchCpf, 
          status: "pending",
          tipo: "Seguro Celular"
        }
      ]);
      setSearchLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Velotax • Painel de Solicitações</title>
        <meta name="description" content="Painel de gerenciamento de solicitações da Velotax" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Painel de Solicitações</h1>
          <p className="mt-2 text-gray-600">Gerencie e acompanhe as solicitações dos clientes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Nova Solicitação</h2>
              </div>
              <div className="p-6">
                <FormSolicitacao registrarLog={registrarLog} />
              </div>
            </div>
          </div>

          {/* Barra lateral */}
          <div className="space-y-6">
            {/* Busca por CPF */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Buscar por CPF</h2>
              </div>
              <div className="p-6">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={searchCpf}
                    onChange={(e) => setSearchCpf(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && buscarCpf()}
                    placeholder="Digite o CPF..."
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <button
                    onClick={buscarCpf}
                    disabled={searchLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {searchLoading ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
                
                {/* Resultados da busca */}
                {searchResults.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h3 className="text-sm font-medium text-gray-700">Resultados:</h3>
                    {searchResults.map((item) => (
                      <div key={item.id} className="p-3 bg-gray-50 rounded-md text-sm">
                        <p className="font-medium">{item.nome}</p>
                        <p className="text-gray-500">CPF: {item.cpf}</p>
                        <p className="text-gray-500">Tipo: {item.tipo}</p>
                        <p className="text-gray-500">
                          Status: {item.status === 'done' ? 'Concluído' : 'Pendente'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Logs */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Atividades Recentes</h2>
              </div>
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="space-y-4">
                  {logs.length > 0 ? (
                    logs.map((log, index) => (
                      <div key={index} className="text-sm">
                        <p className="text-gray-900">{log.msg}</p>
                        <p className="text-xs text-gray-500">{log.time}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Nenhuma atividade recente</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botão de Seguro Celular (abre HTML estático em public/) */}
        <div className="fixed bottom-6 right-6 z-50">
          <a 
            href="/seguro_celular_velotax.html"
            onClick={(e) => {
              e.preventDefault();
              document.body.style.opacity = '0.8';
              document.body.style.transition = 'opacity 0.3s ease-in-out';
              setTimeout(() => {
                window.location.href = '/seguro_celular_velotax.html';
              }, 200);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            title="Abrir página do Seguro Celular (HTML)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Seguro Celular</span>
          </a>
        </div>
      </div>
    </div>
  );
}
