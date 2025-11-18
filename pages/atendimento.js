import { useState } from 'react';
import Head from 'next/head';
import Navbar from '@/components/Navbar';

export default function Atendimento() {
  const [pergunta, setPergunta] = useState('');
  const [resposta, setResposta] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [fbOpen, setFbOpen] = useState(false);
  const [fbDesc, setFbDesc] = useState('');
  const [fbSending, setFbSending] = useState(false);
  // UI automática: sem campos extras

  const renderResposta = (txt='') => {
    const lines = String(txt).split(/\n/);
    const blocks = [];
    let curList = [];
    const flushList = () => {
      if (curList.length) {
        blocks.push({ type: 'ol', items: curList.slice() });
        curList = [];
      }
    };
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) { flushList(); continue; }
      const m = line.match(/^(\d+)\.\s+(.*)$/);
      if (m) {
        curList.push(m[2]);
      } else {
        flushList();
        blocks.push({ type: 'p', text: line });
      }
    }
    flushList();
    return (
      <div className="text-sm leading-6">
        {blocks.map((b, i) => b.type === 'p' ? (
          <p key={i} className="mb-2 whitespace-pre-wrap">{b.text}</p>
        ) : (
          <ol key={i} className="list-decimal ml-5 space-y-1">
            {b.items.map((it, j) => (<li key={j}>{it}</li>))}
          </ol>
        ))}
      </div>
    );
  };

  const processar = async () => {
    setErro('');
    setResposta('');
    const texto = String(pergunta || '').trim();
    if (!texto) { setErro('Por favor, insira a pergunta.'); return; }
    setLoading(true);
    try {
      const r = await fetch('/api/atendimento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pergunta: texto })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Falha ao processar');
      setResposta(j?.resposta || '');
    } catch (e) {
      setErro(e?.message || 'Erro inesperado');
    }
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Velotax • Otimizador de Atendimento</title>
      </Head>

      <Navbar />

      <div className="min-h-screen container-pad py-10">
        <div className="max-w-5xl mx-auto animate-fadeUp">
          <div className="mb-8 surface p-8 text-center flex flex-col items-center gap-3">
            <img src="/brand/velotax-symbol.png" alt="Velotax" className="h-12 md:h-14 w-auto" />
            <h1 className="titulo-principal">Ferramenta de Otimização de Atendimento</h1>
            <div className="text-black/70">Compatível com o padrão visual do painel Velotax</div>
          </div>

          <div className="card p-6 hover:-translate-y-0.5">
            <div className="section-title">1. Cole a pergunta do cliente abaixo</div>
            <textarea
              className="input h-40 resize-y"
              placeholder="Digite aqui a pergunta do cliente"
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
            />
            <div className="mt-4 flex items-center gap-3">
              <button onClick={processar} disabled={loading} className="btn-primary">
                {loading ? 'Processando…' : 'Processar Pergunta'}
              </button>
              {erro && <div className="text-sm text-red-400">{erro}</div>}
            </div>
          </div>

          <div className="mt-8 card p-6">
            <div className="section-title">Resposta Otimizada</div>
            {!resposta && (
              <div className="text-black/60 text-sm">Aguardando processamento…</div>
            )}
            {resposta && (
              <div className="bg-white/80 border border-black/10 rounded-xl p-4">
                {renderResposta(resposta)}
              </div>
            )}
            {resposta && (
              <div className="mt-3 flex items-center gap-3">
                <button type="button" onClick={() => setFbOpen(true)} className="px-3 py-1.5 rounded-lg border text-sm hover:opacity-90">
                  Enviar feedback negativo
                </button>
              </div>
            )}
            {/* UI simplificada: sem exibir metadados; resposta pronta */}
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
            <img src="/brand/loading.gif" alt="Carregando" style={{ width: 72, height: 72, objectFit: 'contain' }} />
          </div>
        </div>
      )}

      {fbOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div className="surface p-6 rounded-xl w-full max-w-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="section-title">Feedback negativo</div>
              <button type="button" onClick={() => !fbSending && setFbOpen(false)} className="text-sm opacity-70 hover:opacity-100">✕</button>
            </div>
            <div className="text-sm text-black/70 mb-2">Descreva rapidamente o que não ficou bom na resposta. Usaremos isso para moldar as próximas respostas.</div>
            <textarea className="input h-32" placeholder="Ex.: evitar falar de restituição; responder em 3 passos curtos; incluir carência 60/90 se aplicável" value={fbDesc} onChange={(e)=>setFbDesc(e.target.value)} />
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                disabled={fbSending || !fbDesc.trim()}
                onClick={async ()=>{
                  if (!fbDesc.trim()) return;
                  setFbSending(true);
                  try {
                    await fetch('/api/feedback', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ type: 'negativo', descricao: fbDesc, pergunta, resposta })
                    });
                    setFbOpen(false); setFbDesc('');
                  } catch {}
                  setFbSending(false);
                }}
                className="btn-primary"
              >{fbSending ? 'Enviando…' : 'Enviar feedback'}</button>
              <button type="button" disabled={fbSending} onClick={()=>setFbOpen(false)} className="px-3 py-1.5 rounded-lg border text-sm hover:opacity-90">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
