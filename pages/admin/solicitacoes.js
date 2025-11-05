import { useEffect, useState, useMemo } from 'react';

export default function AdminSolicitacoes() {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState('em aberto');
  const [loading, setLoading] = useState(false);
  const [searchCpf, setSearchCpf] = useState('');

  const carregar = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/requests');
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const atualizar = async (id, novoStatus) => {
    await fetch(`/api/requests/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus })
    });
    await carregar();
  };

  const filtrados = useMemo(() => {
    const digits = searchCpf.replace(/\D/g, '');
    return data.filter((r) => {
      const okStatus = (status === 'todos' ? true : r.status === status);
      if (!okStatus) return false;
      if (!digits) return true;
      const cpf = String(r.cpf || '').replace(/\D/g, '');
      return cpf.includes(digits);
    });
  }, [data, status, searchCpf]);

  return (
    <div className="min-h-screen container-pad py-8 max-w-6xl mx-auto">
      <h1 className="titulo-principal mb-4">Solicitações</h1>

      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <label>Status:</label>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="em aberto">Em aberto</option>
          <option value="feito">Feito</option>
          <option value="não feito">Não feito</option>
          <option value="todos">Todos</option>
        </select>
        <button className="btn-primary" onClick={carregar} disabled={loading}>{loading ? 'Atualizando...' : 'Atualizar'}</button>
        <div className="md:ml-auto">
          <label className="block text-sm mb-1">Pesquisar CPF</label>
          <input value={searchCpf} onChange={(e) => setSearchCpf(e.target.value)} placeholder="Digite o CPF" className="w-full md:w-64 border rounded px-2 py-1" />
          <div className="text-xs text-black/60 mt-1">{filtrados.length} registro(s) encontrado(s)</div>
        </div>
      </div>

      <div className="space-y-3">
        {filtrados.map((r) => (
          <div key={r.id} className="p-4 bg-white rounded-lg border border-black/10">
            <div className="font-semibold flex items-center gap-2">
              <span>{r.tipo}</span>
              {r.status === 'feito' && <span className="inline-flex items-center gap-1 text-green-700 text-sm"><span>✅</span><span>Feito</span></span>}
            </div>
            <div className="text-sm text-black/70">Agente: {r.agente} • CPF: {r.cpf}</div>
            <div className="text-sm">Status: <span className="font-medium">{r.status}</span></div>
            <div className="mt-2 flex items-center gap-2">
              <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => atualizar(r.id, 'feito')}>Marcar como feito</button>
              <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => atualizar(r.id, 'não feito')}>Marcar como não feito</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
