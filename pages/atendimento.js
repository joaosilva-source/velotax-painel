import { useState } from 'react';
import Head from 'next/head';
import Navbar from '@/components/Navbar';

export default function Atendimento() {
  const [pergunta, setPergunta] = useState('');
  const [resposta, setResposta] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [tema, setTema] = useState('');
  const [gids, setGids] = useState('');
  const [temaDetectado, setTemaDetectado] = useState('');
  const [fontes, setFontes] = useState([]);

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
        body: JSON.stringify({ pergunta: texto, tema: tema || undefined, gids: gids || undefined })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Falha ao processar');
      setResposta(j?.resposta || '');
      setTemaDetectado(j?.temaDetectado || '');
      setFontes(Array.isArray(j?.fontes) ? j.fontes : []);
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <div>
                <div className="text-sm mb-1">Forçar tema (opcional)</div>
                <input className="input" placeholder="Ex.: Crédito do Trabalhador"
                  value={tema} onChange={(e)=>setTema(e.target.value)} />
              </div>
              <div>
                <div className="text-sm mb-1">GIDs da planilha (opcional)</div>
                <input className="input" placeholder="Ex.: 0,123456789" value={gids}
                  onChange={(e)=>setGids(e.target.value)} />
              </div>
            </div>
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
              <div className="bg-white/80 border border-black/10 rounded-xl p-4 whitespace-pre-wrap text-sm">
                {resposta}
              </div>
            )}
            {(temaDetectado || (fontes && fontes.length)) && (
              <div className="mt-4 space-y-2 text-sm">
                {temaDetectado && (
                  <div className="text-black/70"><span className="font-medium">Tema detectado:</span> {temaDetectado}</div>
                )}
                {Array.isArray(fontes) && fontes.length > 0 && (
                  <div>
                    <div className="font-medium mb-1">Fontes utilizadas</div>
                    <div className="space-y-2 max-h-64 overflow-auto">
                      {fontes.map((f, idx) => (
                        <div key={idx} className="p-3 bg-white border border-black/10 rounded">
                          <div className="text-black/70">{f.tema || '—'}</div>
                          <div className="text-xs text-black/60 mt-1"><span className="font-medium">Pergunta:</span> {f.pergunta}</div>
                          <div className="text-xs text-black/60 mt-1"><span className="font-medium">Resposta:</span> {f.resposta}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-card" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
            <img src="/brand/loading.gif" alt="Carregando" style={{ width: 72, height: 72, objectFit: 'contain' }} />
          </div>
        </div>
      )}
    </>
  );
}
