import { useEffect, useState, useMemo } from 'react';

export default function AdminSolicitacoes() {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState('em aberto');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [loading, setLoading] = useState(false);
  const [searchCpf, setSearchCpf] = useState('');
  const [expanded, setExpanded] = useState({}); // { [id]: bool }
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState([]); // array de dataURLs
  const [modalIndex, setModalIndex] = useState(0);
  const [sortKey, setSortKey] = useState('created_desc'); // created_desc, created_asc, cpf_asc, cpf_desc

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setModalOpen(false);
      if (e.key === 'ArrowRight') setModalIndex((i) => (i + 1) % (modalImages.length || 1));
      if (e.key === 'ArrowLeft') setModalIndex((i) => (i - 1 + (modalImages.length || 1)) % (modalImages.length || 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen, modalImages.length]);

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

  const ordenados = useMemo(() => {
    const arr = [...filtrados];
    arr.sort((a, b) => {
      if (sortKey === 'created_asc' || sortKey === 'created_desc') {
        const da = new Date(a.createdAt || 0).getTime();
        const db = new Date(b.createdAt || 0).getTime();
        return sortKey === 'created_asc' ? da - db : db - da;
      }
      if (sortKey === 'cpf_asc' || sortKey === 'cpf_desc') {
        const ca = String(a.cpf || '').replace(/\D/g, '');
        const cb = String(b.cpf || '').replace(/\D/g, '');
        if (ca === cb) return 0;
        return sortKey === 'cpf_asc' ? (ca < cb ? -1 : 1) : (ca > cb ? -1 : 1);
      }
      return 0;
    });
    return arr;
  }, [filtrados, sortKey]);

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
        <label>Ordenar por:</label>
        <select className="input" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
          <option value="created_desc">Data (mais recente primeiro)</option>
          <option value="created_asc">Data (mais antiga primeiro)</option>
          <option value="cpf_asc">CPF (A-Z)</option>
          <option value="cpf_desc">CPF (Z-A)</option>
        </select>
        <button
          className="px-3 py-2 rounded bg-black/10 hover:bg-black/20"
          onClick={() => {
            const rows = filtrados.map((r) => ({
              id: r.id,
              criado_em: new Date(r.createdAt).toISOString(),
              tipo: r.tipo,
              status: r.status,
              agente: r.agente,
              cpf: r.cpf,
              descricao: (getDescricao(r) || '').replace(/\n/g,' ')
            }));
            const headers = Object.keys(rows[0] || { id:'',criado_em:'',tipo:'',status:'',agente:'',cpf:'',descricao:'' });
            const csv = [headers.join(';'), ...rows.map(o => headers.map(h => `"${String(o[h] ?? '').replace(/"/g,'""')}"`).join(';'))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'solicitacoes.csv'; a.click();
            URL.revokeObjectURL(url);
          }}
        >Exportar CSV</button>
        <div className="md:ml-auto">
          <label className="block text-sm mb-1">Pesquisar CPF</label>
          <input value={searchCpf} onChange={(e) => setSearchCpf(e.target.value)} placeholder="Digite o CPF" className="w-full md:w-64 border rounded px-2 py-1" />
          <div className="text-xs text-black/60 mt-1">{filtrados.length} registro(s) encontrado(s)</div>
        </div>
      </div>

      <div className="space-y-3">
        {ordenados.map((r) => (
          <div
            key={r.id}
            className="p-4 bg-white rounded-lg border border-black/10 cursor-pointer"
            onClick={() => setExpanded((prev) => ({ ...prev, [r.id]: !prev[r.id] }))}
          >
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
                const previews = Array.isArray(r?.payload?.previews) ? r.payload.previews : [];
                const count = previews.length;
                const buildImages = () => {
                  return previews;
                };
                return count > 0 ? (
                  <button
                    className="px-2 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-800 text-sm"
                    onClick={(e) => { e.stopPropagation(); const imgs = buildImages(); setModalImages(imgs); setModalIndex(0); setModalOpen(true); }}
                  >
                    Anexos: {count}
                  </button>
                ) : null;
              })()}
            </div>
            {/* Datas de abertura / conclusão */}
            {(() => {
              const created = r.createdAt ? new Date(r.createdAt).toLocaleString() : '—';
              const isDone = r.status === 'feito' || r.status === 'não feito';
              const concluded = isDone && r.updatedAt ? new Date(r.updatedAt).toLocaleString() : null;
              return (
                <div className="mt-1 text-xs text-black/60">
                  <span>Aberto em: {created}</span>
                  {concluded && <span className="ml-2">• Concluído em: {concluded}</span>}
                </div>
              );
            })()}

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
            {String(r?.tipo || '').startsWith('Erro/Bug') && (() => {
              const previews = Array.isArray(r?.payload?.previews) ? r.payload.previews : [];
              const imgs = previews;
              if (!imgs.length) return null;
              return (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {imgs.map((src, i) => (
                    <img key={i} src={src} alt={`preview-${i}`} className="h-20 w-auto rounded border cursor-zoom-in" onClick={(e) => { e.stopPropagation(); setModalImages(imgs); setModalIndex(i); setModalOpen(true); }} />
                  ))}
                </div>
              );
            })()}

            <div className="mt-2 flex items-center gap-2">
              <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={(e) => { e.stopPropagation(); atualizar(r.id, 'feito'); }}>Marcar como feito</button>
              <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={(e) => { e.stopPropagation(); atualizar(r.id, 'não feito'); }}>Marcar como não feito</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal/Lightbox */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setModalOpen(false)}>
          <div className="relative max-w-5xl w-full px-4" onClick={(e) => e.stopPropagation()}>
            <div className="absolute -top-10 right-4"><button className="px-3 py-1 bg-white rounded" onClick={() => setModalOpen(false)}>Fechar</button></div>
            <div className="flex items-center justify-between gap-2">
              <button className="px-3 py-2 bg-white/80 hover:bg-white rounded" onClick={() => setModalIndex((i) => (i - 1 + modalImages.length) % modalImages.length)}>←</button>
              <img src={modalImages[modalIndex]} alt={`lightbox-${modalIndex}`} className="max-h-[80vh] w-auto mx-auto rounded" />
              <button className="px-3 py-2 bg-white/80 hover:bg-white rounded" onClick={() => setModalIndex((i) => (i + 1) % modalImages.length)}>→</button>
            </div>
            <div className="text-center text-white/80 mt-2 text-sm">{modalIndex + 1} / {modalImages.length}</div>
          </div>
        </div>
      )}
    </div>
  );
}
