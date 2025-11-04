import { useEffect, useMemo, useState } from 'react';

function formatItem(log) {
  const a = log.action;
  const d = log.detail || {};
  if (a === 'auto_status_done') {
    return { icon: '✅', text: `${d.cpf || 'CPF'} — ${d.tipo || 'Tipo'} marcado via reação` };
  }
  if (a === 'status_update') {
    const st = d.status || '';
    if (st === 'feito') return { icon: '✅', text: `${d.cpf || 'CPF'} — ${d.tipo || 'Tipo'}` };
    if (st === 'não feito') return { icon: '❌', text: `${d.cpf || 'CPF'} — ${d.tipo || 'Tipo'}` };
    return { icon: 'ℹ️', text: `${d.cpf || 'CPF'} — ${d.tipo || 'Tipo'} (status: ${st})` };
  }
  if (a === 'send_request') {
    return { icon: '📨', text: `${d.cpf || 'CPF'} — ${d.tipo || 'Tipo'} enviado` };
  }
  return { icon: '📝', text: a };
}

export default function AdminLogs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem('velotax_logs');
    if (cached) {
      try { setItems(JSON.parse(cached)); } catch {}
    }
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/logs');
        let data = [];
        try { data = await res.json(); } catch {}
        if (!Array.isArray(data)) data = [];
        setItems(data);
        try { localStorage.setItem('velotax_logs', JSON.stringify(data)); } catch {}
      } catch {}
      setLoading(false);
    };
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const rows = useMemo(() => (Array.isArray(items) ? items : []).map((l) => ({
    id: l.id,
    createdAt: new Date(l.createdAt).toLocaleString(),
    ...formatItem(l)
  })), [items]);

  return (
    <div className="min-h-screen container-pad py-8 max-w-4xl mx-auto">
      <h1 className="titulo-principal mb-4">Logs</h1>
      <div className="mb-3 text-sm text-black/70">{loading ? 'Atualizando…' : 'Atualizado'}</div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="p-3 bg-white rounded border border-black/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">{r.icon}</span>
              <span>{r.text}</span>
            </div>
            <div className="text-xs text-black/60">{r.createdAt}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
