import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import NavbarCobranca from '@/components/NavbarCobranca';

function parseData(dateStr) {
  if (!dateStr) return null;
  // formatos esperados: "03/11/2025 10:54:42" ou similar
  const m = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  const [_, d, M, y] = m;
  return new Date(Number(y), Number(M) - 1, Number(d));
}

export default function MonitoriaDashboard() {
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const [filtroAgente, setFiltroAgente] = useState('');
  const [filtroCampanha, setFiltroCampanha] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    const carregar = async () => {
      setLoading(true);
      setErro('');
      try {
        const r = await fetch('/api/monitoria-cobranca/avaliacoes');
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || 'Falha ao carregar avaliações');
        setAvaliacoes(j?.avaliacoes || []);
      } catch (e) {
        setErro(e?.message || 'Erro ao carregar avaliações');
      }
      setLoading(false);
    };
    carregar();
  }, []);

  const agentes = useMemo(() => {
    const set = new Set();
    for (const a of avaliacoes) {
      const nome = a?.ligacao?.analista || '';
      if (nome) set.add(nome);
    }
    return Array.from(set).sort();
  }, [avaliacoes]);

  const campanhas = useMemo(() => {
    const set = new Set();
    for (const a of avaliacoes) {
      const nome = a?.ligacao?.campanha || '';
      if (nome) set.add(nome);
    }
    return Array.from(set).sort();
  }, [avaliacoes]);

  const filtradas = useMemo(() => {
    return avaliacoes.filter((a) => {
      const agente = a?.ligacao?.analista || '';
      const campanha = a?.ligacao?.campanha || '';
      const dataLigacao = parseData(a?.ligacao?.dataLigacao);

      if (filtroAgente && agente !== filtroAgente) return false;
      if (filtroCampanha && campanha !== filtroCampanha) return false;

      if (dataInicio) {
        const di = new Date(dataInicio + 'T00:00:00');
        if (!dataLigacao || dataLigacao < di) return false;
      }
      if (dataFim) {
        const df = new Date(dataFim + 'T23:59:59');
        if (!dataLigacao || dataLigacao > df) return false;
      }
      return true;
    });
  }, [avaliacoes, filtroAgente, filtroCampanha, dataInicio, dataFim]);

  const rankingAgentes = useMemo(() => {
    const mapa = new Map();
    for (const a of filtradas) {
      const agente = a?.ligacao?.analista || 'N/I';
      const atual = mapa.get(agente) || { agente, totalPontos: 0, qtd: 0 };
      atual.totalPontos += Number(a.pontuacaoTotal || 0);
      atual.qtd += 1;
      mapa.set(agente, atual);
    }
    return Array.from(mapa.values())
      .map((x) => ({ ...x, media: x.qtd ? x.totalPontos / x.qtd : 0 }))
      .sort((a, b) => b.media - a.media);
  }, [filtradas]);

  const handleExportCsv = () => {
    if (!filtradas.length) return;
    const headers = [
      'ID',
      'Analista',
      'Campanha',
      'Produto',
      'Cliente',
      'Contrato',
      'DataLigacao',
      'DataRegistro',
      'PontuacaoTotal',
      'Observacao',
    ];
    const linhas = [headers.join(';')];
    for (const a of filtradas) {
      const cols = [
        a.id,
        a?.ligacao?.analista || '',
        a?.ligacao?.campanha || '',
        a.produto || '',
        a?.ligacao?.cliente || '',
        a?.ligacao?.contrato || '',
        a?.ligacao?.dataLigacao || '',
        a.criadoEm || '',
        String(a.pontuacaoTotal || 0),
        (a.observacao || '').replace(/\r?\n/g, ' '),
      ];
      linhas.push(cols.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(';'));
    }
    const blob = new Blob([linhas.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const aTag = document.createElement('a');
    aTag.href = url;
    aTag.download = 'monitoria-cobranca-avaliacoes.csv';
    aTag.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <>
      <Head>
        <title>Velotax • Dashboard de Monitoria</title>
      </Head>
      <NavbarCobranca />
      <div className="min-h-screen container-pad py-8 bg-[#ECECEC]">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          <div className="surface p-6 flex flex-col gap-3 border border-[#000058]/10 bg-white print:border-none print:shadow-none">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="titulo-principal">Dashboard de Monitoria - Cobrança</h1>
                <p className="text-sm text-black/60 mt-1">Visão consolidada das avaliações do time de cobrança.</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <button onClick={handleExportCsv} className="btn-primary">Exportar CSV</button>
                <button onClick={handlePrint} className="px-3 py-1.5 rounded-lg border border-[#1634FF] text-[#1634FF] bg-white text-xs font-medium hover:bg-[#1634FF] hover:text-white">
                  Exportar PDF / Imprimir
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)] gap-6">
            <div className="card p-5 bg-white border border-black/5 print:border-none">
              <div className="section-title mb-3">Filtros</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="block text-xs font-medium text-black/70 mb-1">Agente</label>
                  <select
                    className="input h-9 text-sm"
                    value={filtroAgente}
                    onChange={(e) => setFiltroAgente(e.target.value)}
                  >
                    <option value="">Todos</option>
                    {agentes.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-black/70 mb-1">Campanha</label>
                  <select
                    className="input h-9 text-sm"
                    value={filtroCampanha}
                    onChange={(e) => setFiltroCampanha(e.target.value)}
                  >
                    <option value="">Todas</option>
                    {campanhas.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-black/70 mb-1">Data inicial</label>
                  <input
                    type="date"
                    className="input h-9 text-sm"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-black/70 mb-1">Data final</label>
                  <input
                    type="date"
                    className="input h-9 text-sm"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-4 text-xs text-black/60">
                Avaliações filtradas: <span className="font-semibold">{filtradas.length}</span>
              </div>
            </div>

            <div className="card p-5 bg-[#000058] text-white flex flex-col gap-3 print:bg-white print:text-black print:border-none">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm uppercase tracking-wide text-[#1DFDB9] print:text-[#000058]">Ranking</div>
                  <div className="text-lg font-semibold">Top agentes por média de pontos</div>
                </div>
              </div>
              {loading && (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <img src="/brand/loading.gif" alt="Carregando" className="w-12 h-12 object-contain" />
                  <div className="text-sm text-white/80 print:text-black">Carregando avaliações...</div>
                </div>
              )}
              {!loading && erro && (
                <div className="text-sm bg-red-500/20 border border-red-400/60 rounded-lg p-3 print:border-red-500">
                  {erro}
                </div>
              )}
              {!loading && !erro && (
                <div className="border border-white/10 rounded-lg bg-black/20 overflow-hidden max-h-[420px] print:border-black/10 print:bg-white">
                  <div className="divide-y divide-white/10 text-xs print:divide-black/10">
                    {rankingAgentes.map((r, idx) => (
                      <div key={r.agente + idx} className="flex items-center justify-between gap-3 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] w-5 h-5 rounded-full bg-[#1DFDB9] text-[#000058] flex items-center justify-center font-semibold">
                            {idx + 1}
                          </span>
                          <span className="font-semibold truncate">{r.agente}</span>
                        </div>
                        <div className="text-right text-[11px]">
                          <div>Média: <span className="font-semibold">{r.media.toFixed(1)}</span></div>
                          <div className="text-white/70 print:text-black/70">Avaliações: {r.qtd}</div>
                        </div>
                      </div>
                    ))}
                    {rankingAgentes.length === 0 && (
                      <div className="px-3 py-6 text-xs text-white/70 text-center print:text-black/70">
                        Nenhuma avaliação encontrada.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card p-5 bg-white border border-black/5 print:border-none">
            <div className="section-title mb-3">Lista de avaliações</div>
            <div className="max-h-[360px] overflow-auto text-xs divide-y divide-black/5">
              {filtradas.map((a) => (
                <div key={a.id} className="py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-black truncate">
                      {a?.ligacao?.cliente || 'Cliente N/I'} - {a?.ligacao?.contrato || '-'}
                    </div>
                    <div className="text-[11px] text-black/70 truncate">
                      Analista: {a?.ligacao?.analista || 'N/I'} • Campanha: {a?.ligacao?.campanha || 'N/I'} • Produto: {a.produto || 'N/I'}
                    </div>
                    <div className="text-[11px] text-black/60 truncate">
                      Data ligação: {a?.ligacao?.dataLigacao || '-'} • Registro: {a.criadoEm || '-'}
                    </div>
                  </div>
                  <div className="text-right text-[11px] min-w-[72px]">
                    <div className="font-semibold text-[#1634FF]">{a.pontuacaoTotal} pts</div>
                  </div>
                </div>
              ))}
              {filtradas.length === 0 && (
                <div className="py-6 text-xs text-black/60 text-center">
                  Nenhuma avaliação encontrada para os filtros selecionados.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
