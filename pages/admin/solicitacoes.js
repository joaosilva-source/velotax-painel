import { useEffect, useState, useMemo } from 'react';

export default function AdminSolicitacoes() {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState('em aberto');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [loading, setLoading] = useState(false);
  const [searchCpf, setSearchCpf] = useState('');
  const [expanded, setExpanded] = useState({}); // { [id]: bool }

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

  const tipos = useMemo(() => {
    const set = new Set();
    data.forEach((r) => { if (r?.tipo) set.add(r.tipo); });
    return ['todos', ...Array.from(set)];
  }, [data]);

  const filtrados = useMemo(() => {
    const digits = searchCpf.replace(/\D/g, '');
    return data.filter((r) => {
      const okStatus = (status === 'todos' ? true : r.status === status);
      const okTipo = (filterTipo === 'todos' ? true : r.tipo === filterTipo);
      if (!okStatus) return false;
      if (!okTipo) return false;
      if (!digits) return true;
      const cpf = String(r.cpf || '').replace(/\D/g, '');
      return cpf.includes(digits);
    });
  }, [data, status, filterTipo, searchCpf]);

  const getDescricao = (r) => {
    const p = r?.payload || {};
    if (String(r?.tipo || '').startsWith('Erro/Bug')) return p?.descricao || '';
    return p?.observacoes || '';
  };

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
        <label>Tipo:</label>
        <select className="input" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
          {tipos.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
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
            <div className="font-semibold flex flex-wrap items-center gap-2">
              {/* Tipo */}
              <span className="px-2 py-0.5 rounded-full bg-black/5 text-black/80 text-sm">{r.tipo}</span>
              {/* Status */}
              <span className={`px-2 py-0.5 rounded-full text-sm ${r.status === 'feito' ? 'bg-emerald-100 text-emerald-800' : (r.status === 'não feito' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800')}`}>
                {r.status === 'feito' ? '✅ Feito' : (r.status === 'não feito' ? '❌ Não feito' : '⏳ Em aberto')}
              </span>
              {/* Agente */}
              {r.agente && <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-sm">Agente: {r.agente}</span>}
              {/* CPF */}
              {r.cpf && <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-sm">CPF: {r.cpf}</span>}
              {/* Anexos */}
              {(() => {
                const count = Array.isArray(r?.payload?.previews) ? r.payload.previews.length : (Array.isArray(r?.payload?.imagens) ? r.payload.imagens.length : 0);
                return count > 0 ? (<span className="px-2 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-800 text-sm">Anexos: {count}</span>) : null;
              })()}
            </div>
            {/* Descrição (expandível) */}
            {(() => {
              const full = getDescricao(r) || '';
              const isLong = full.length > 160;
              const short = isLong ? full.slice(0, 160) + '…' : full;
              const isOpen = !!expanded[r.id];
              return (
                <div className="mt-2 text-sm text-black/80">
                  <span>{isOpen ? full : short}</span>
                  {isLong && (
                    <button className="ml-2 text-sky-700 hover:underline" onClick={() => setExpanded((prev) => ({ ...prev, [r.id]: !isOpen }))}>
                      {isOpen ? 'Ver menos' : 'Ver mais'}
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Thumbnails (Erros/Bugs) */}
            {String(r?.tipo || '').startsWith('Erro/Bug') && Array.isArray(r?.payload?.previews) && r.payload.previews.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {r.payload.previews.map((src, i) => (
                  <img key={i} src={src} alt={`preview-${i}`} className="h-20 w-auto rounded border" />
                ))}
              </div>
            )}

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
