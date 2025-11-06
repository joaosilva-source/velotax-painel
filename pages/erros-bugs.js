// pages/erros-bugs.js
import { useState } from 'react';
import Head from 'next/head';

export default function ErrosBugs() {
  const [agente, setAgente] = useState('');
  const [cpf, setCpf] = useState('');
  const [tipo, setTipo] = useState('App');
  const [descricao, setDescricao] = useState('');
  const [imagens, setImagens] = useState([]); // [{ name, type, data }]
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const montarLegenda = () => {
    let m = `*Novo Erro/Bug - ${tipo}*\n\n`;
    m += `Agente: ${agente}\n`;
    if (cpf) m += `CPF: ${cpf}\n`;
    m += `\nDescrição:\n${descricao || '—'}\n`;
    if (imagens?.length) m += `\n[Anexos: ${imagens.length} imagem(ns)]\n`;
    return m;
  };

  const enviar = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const defaultJid = process.env.NEXT_PUBLIC_DEFAULT_JID;

    const legenda = montarLegenda();

    try {
      // 1) Enviar via WhatsApp se configurado
      let res = { ok: false };
      if (apiUrl && defaultJid) {
        res = await fetch(apiUrl + '/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jid: defaultJid, mensagem: legenda, imagens })
        });
      }

      // 2) Persistir SEMPRE
      let waMessageId = null;
      if (res && res.ok) {
        try { const d = await res.json(); waMessageId = d?.messageId || d?.key?.id || null; } catch {}
      }

      await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agente,
          cpf,
          tipo: `Erro/Bug - ${tipo}`,
          payload: { agente, cpf, tipo, descricao, imagens: imagens?.map(({ name, type, data }) => ({ name, type, size: (data||'').length })) },
          agentContact: defaultJid || null,
          waMessageId
        })
      });

      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_request', detail: { tipo: `Erro/Bug - ${tipo}`, cpf, waMessageId, whatsappSent: !!(apiUrl && defaultJid) } })
      });

      setMsg(apiUrl && defaultJid ? 'Enviado e registrado com sucesso.' : 'Registrado no painel. WhatsApp não configurado.');
      setAgente(''); setCpf(''); setDescricao(''); setImagens([]);
    } catch (err) {
      setMsg('Falha ao enviar/registrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Velotax • Erros/Bugs</title>
      </Head>

      <div className="min-h-screen container-pad py-10">
        <div className="max-w-3xl mx-auto animate-fadeUp">
          <div className="mb-6 surface p-6 flex items-center justify-between">
            <div>
              <h1 className="titulo-principal mb-1">Erros / Bugs</h1>
              <p className="text-white/80">Reporte problemas com anexos de imagem para o time</p>
            </div>
          </div>

          <form onSubmit={enviar} className="card p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-black/80">Agente</label>
                <input className="input" value={agente} onChange={(e) => setAgente(e.target.value)} required placeholder="Nome do agente" />
              </div>
              <div>
                <label className="text-sm text-black/80">CPF (opcional)</label>
                <input className="input" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
              </div>
            </div>

            <div>
              <label className="text-sm text-black/80">Tipo</label>
              <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option>App</option>
                <option>Crédito Pessoal</option>
                <option>Crédito do Trabalhador</option>
                <option>Antecipação</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-black/80">Descrição</label>
              <textarea className="input h-32" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Explique o problema, passos para reproduzir, telas envolvidas..." />
            </div>

            <div>
              <label className="text-sm text-black/80">Anexos (imagens)</label>
              <input type="file" accept="image/*" multiple onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                const arr = [];
                for (const f of files) {
                  try {
                    const data = await new Promise((ok, err) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = err; r.readAsDataURL(f); });
                    arr.push({ name: f.name, type: f.type || 'image/jpeg', data });
                  } catch {}
                }
                setImagens(arr);
              }} className="mt-1" />
              {imagens && imagens.length > 0 && (
                <div className="text-xs text-black/60 mt-2">{imagens.length} imagem(ns) anexada(s)</div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button type="submit" disabled={loading} className={`btn-primary ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}>{loading ? 'Enviando...' : 'Enviar'}</button>
              {msg && <span className="text-sm text-black/70">{msg}</span>}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
