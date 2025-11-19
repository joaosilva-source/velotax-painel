import { useEffect, useState } from 'react';
import Head from 'next/head';
import NavbarCobranca from '@/components/NavbarCobranca';

export default function MonitoriaCobranca() {
  const [chamadas, setChamadas] = useState([]);
  const [loadingChamadas, setLoadingChamadas] = useState(false);
  const [erroChamadas, setErroChamadas] = useState('');
  const [uploadInfo, setUploadInfo] = useState('');

  const [dadosLigacao, setDadosLigacao] = useState({
    analista: '',
    dataLigacao: '',
    data: '',
    cliente: '',
    contrato: '',
  });

  const [produto, setProduto] = useState('Empréstimo pessoal');

  const blocos = [
    {
      nome: 'Abertura',
      total: 10,
      itens: [
        { id: 'abertura_saudacao', label: 'Saudação cordial e identificação da empresa', pontos: 5 },
        { id: 'abertura_confirmacao_dados', label: 'Confirmação dos dados do cliente (segurança)', pontos: 5 },
      ],
    },
    {
      nome: 'Conduta e Comunicação',
      total: 20,
      itens: [
        { id: 'conduta_linguagem', label: 'Linguagem clara, objetiva e respeitosa', pontos: 10 },
        { id: 'conduta_tom_voz', label: 'Tom de voz adequado e empático', pontos: 10 },
      ],
    },
    {
      nome: 'Negociação',
      total: 30,
      itens: [
        { id: 'negociacao_valor', label: 'Apresentou o valor correto da dívida', pontos: 10 },
        { id: 'negociacao_alternativas', label: 'Ofereceu alternativas de pagamento (parcela/prazo)', pontos: 10 },
        { id: 'negociacao_argumentacao', label: 'Argumentou com foco na solução, sem ameaças', pontos: 10 },
      ],
    },
    {
      nome: 'Encerramento',
      total: 10,
      itens: [
        { id: 'encerramento_entendimento', label: 'Confirmou entendimento e reforçou data de pagamento', pontos: 5 },
        { id: 'encerramento_agradecimento', label: 'Agradeceu e finalizou com cordialidade', pontos: 5 },
      ],
    },
    {
      nome: 'Conformidade e Procedimentos',
      total: 30,
      itens: [
        { id: 'conformidade_registro', label: 'Registrou corretamente a interação no sistema', pontos: 10 },
        { id: 'conformidade_script', label: 'Seguiu script e políticas da empresa', pontos: 10 },
        { id: 'conformidade_infracoes', label: 'Não cometeu infrações (ameaças, exposição, pressão indevida)', pontos: 10 },
      ],
    },
  ];

  const [respostas, setRespostas] = useState({});
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mensagemSalvar, setMensagemSalvar] = useState('');

  useEffect(() => {
    // Inicia com lista vazia; o avaliador deve subir uma planilha CSV real.
    setChamadas([]);
  }, []);

  const parseCsvLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ';' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  };

  const handleUploadCsv = async (file) => {
    if (!file) return;
    setUploadInfo('');
    setErroChamadas('');
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        setChamadas([]);
        setUploadInfo('Planilha vazia.');
        return;
      }
      const header = parseCsvLine(lines[0]);
      const idxAgent = header.indexOf('agent_name');
      const idxCallDate = header.indexOf('call_date');
      const idxCreatedAt = header.indexOf('created_at');
      const idxIdentifier = header.indexOf('identifier');
      const idxMailing = header.indexOf('mailing_data.data');
      const idxCampaign = header.indexOf('campaign_name');

      const novas = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        const cols = parseCsvLine(line);
        if (!cols.length) continue;

        const agente = idxAgent >= 0 ? cols[idxAgent] || '' : '';
        const callDate = idxCallDate >= 0 ? cols[idxCallDate] || '' : '';
        const createdAt = idxCreatedAt >= 0 ? cols[idxCreatedAt] || '' : '';
        const identifier = idxIdentifier >= 0 ? cols[idxIdentifier] || '' : '';
        const mailingRaw = idxMailing >= 0 ? cols[idxMailing] || '' : '';
        const campanha = idxCampaign >= 0 ? cols[idxCampaign] || '' : '';

        let cliente = '';
        if (mailingRaw) {
          try {
            const norm = mailingRaw.replace(/""/g, '"');
            const jsonText = norm.startsWith('{') ? norm : norm.replace(/^"/, '').replace(/"$/, '');
            const obj = JSON.parse(jsonText);
            cliente = obj['Nome do Cliente'] || '';
          } catch (e) {
            cliente = '';
          }
        }

        novas.push({
          analista: agente,
          dataLigacao: callDate,
          data: createdAt,
          cliente,
          contrato: identifier,
          campanha,
        });
        if (novas.length >= 1000) break;
      }

      setChamadas(novas);
      setUploadInfo(`Planilha carregada com ${novas.length} chamadas.`);
    } catch (e) {
      setErroChamadas('Falha ao processar o arquivo enviado.');
    }
  };

  const handleSelecionarLigacao = (idx) => {
    const c = chamadas[idx];
    if (!c) return;
    setDadosLigacao(c);
  };

  const handleResposta = (id, valor) => {
    setRespostas((prev) => ({ ...prev, [id]: valor }));
  };

  const pontuacaoTotal = blocos.reduce((acc, bloco) => {
    const somaBloco = bloco.itens.reduce((s, item) => {
      const r = respostas[item.id];
      if (r === 'sim') return s + item.pontos;
      return s;
    }, 0);
    return acc + somaBloco;
  }, 0);

  const handleSalvarAvaliacao = async () => {
    setMensagemSalvar('');
    if (!dadosLigacao.dataLigacao || !dadosLigacao.cliente || !dadosLigacao.contrato) {
      setMensagemSalvar('Preencha os dados básicos da ligação (ao menos cliente, contrato e data da ligação).');
      return;
    }
    setSalvando(true);
    try {
      const body = {
        ligacao: dadosLigacao,
        produto,
        respostas,
        pontuacaoTotal,
        observacao,
      };
      const r = await fetch('/api/monitoria-cobranca/avaliacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Falha ao salvar avaliação');
      setMensagemSalvar('Avaliação salva com sucesso.');
    } catch (e) {
      setMensagemSalvar(e?.message || 'Erro ao salvar avaliação.');
    }
    setSalvando(false);
  };

  return (
    <>
      <Head>
        <title>Velotax • Monitoria de Cobrança</title>
      </Head>

      <NavbarCobranca />

      <div className="min-h-screen container-pad py-8 bg-[#ECECEC]">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          <div className="surface p-6 flex flex-col gap-3 border border-[#000058]/10 bg-white">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="titulo-principal">Monitoria de Atendimentos - Cobrança</h1>
                <p className="text-sm text-black/60 mt-1">Ferramenta para avaliação de ligações do time de cobrança.</p>
              </div>
              <img src="/brand/velotax-symbol.png" alt="Velotax" className="h-10 w-auto" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)] gap-6">
            <div className="space-y-6">
              <div className="card p-5 bg-white border border-[#1634FF]/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                  <div className="section-title">Dados da ligação</div>
                  <div className="flex flex-col md:flex-row md:items-center gap-2 text-xs">
                    <label className="font-medium text-black/70">Subir planilha CSV</label>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="text-xs"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          handleUploadCsv(files[0]);
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <label className="block text-xs font-medium text-black/70 mb-1">Produto*</label>
                    <select
                      className="input h-9 text-sm"
                      value={produto}
                      onChange={(e) => setProduto(e.target.value)}
                    >
                      <option>Empréstimo pessoal</option>
                      <option>IRPF</option>
                      <option>Crédito do trabalhador</option>
                      <option>Antecipação salarial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black/70 mb-1">Analista*</label>
                    <input
                      className="input h-9 text-sm"
                      value={dadosLigacao.analista}
                      onChange={(e) => setDadosLigacao((prev) => ({ ...prev, analista: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black/70 mb-1">Data da ligação*</label>
                    <input className="input h-9 text-sm" value={dadosLigacao.dataLigacao} readOnly />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black/70 mb-1">Data*</label>
                    <input className="input h-9 text-sm" value={dadosLigacao.data} readOnly />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black/70 mb-1">Cliente*</label>
                    <input className="input h-9 text-sm" value={dadosLigacao.cliente} readOnly />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black/70 mb-1">Contrato*</label>
                    <input className="input h-9 text-sm" value={dadosLigacao.contrato} readOnly />
                  </div>
                </div>
                {uploadInfo && (
                  <div className="mt-3 text-xs text-[#1634FF]">{uploadInfo}</div>
                )}
              </div>

              <div className="space-y-5">
                {blocos.map((bloco) => (
                  <div key={bloco.nome} className="card p-5 bg-white border border-black/5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="section-title">{bloco.nome} ({bloco.total} pontos)</div>
                    </div>
                    <div className="space-y-3 text-sm">
                      {bloco.itens.map((item) => (
                        <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-2 border-b border-black/5 last:border-0">
                          <div className="font-medium text-black/80">{item.label}</div>
                          <div className="flex items-center gap-4 text-xs">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name={item.id}
                                value="sim"
                                checked={respostas[item.id] === 'sim'}
                                onChange={() => handleResposta(item.id, 'sim')}
                              />
                              <span>Sim ({item.pontos} pontos)</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name={item.id}
                                value="nao"
                                checked={respostas[item.id] === 'nao'}
                                onChange={() => handleResposta(item.id, 'nao')}
                              />
                              <span>Não (0 pontos)</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="card p-5 bg-white border border-black/5">
                <div className="section-title mb-3">Resultado Final*</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-semibold text-[#1634FF]">{pontuacaoTotal}</div>
                  <div className="text-sm text-black/60">de 100 pontos</div>
                </div>
              </div>

              <div className="card p-5 bg-white border border-black/5">
                <div className="section-title mb-2">Observação*</div>
                <textarea
                  className="input h-32 text-sm resize-y"
                  placeholder="Comentários adicionais sobre o atendimento avaliado"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSalvarAvaliacao}
                    disabled={salvando}
                    className="btn-primary text-sm"
                  >
                    {salvando ? 'Salvando…' : 'Salvar avaliação'}
                  </button>
                  {mensagemSalvar && (
                    <div className="text-xs text-black/70">{mensagemSalvar}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="card p-5 bg-[#000058] text-white flex flex-col gap-3 min-h-[260px]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm uppercase tracking-wide text-[#1DFDB9]">Ligações</div>
                  <div className="text-lg font-semibold">Selecionar para avaliar</div>
                </div>
              </div>

              {loadingChamadas && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <img src="/brand/loading.gif" alt="Carregando" className="w-16 h-16 object-contain" />
                  <div className="text-sm text-white/80">Processando planilha enviada...</div>
                </div>
              )}

              {!loadingChamadas && erroChamadas && (
                <div className="text-sm bg-red-500/20 border border-red-400/60 rounded-lg p-3">
                  {erroChamadas}
                </div>
              )}

              {!loadingChamadas && !erroChamadas && (
                <div className="flex-1 flex flex-col gap-2 min-h-0">
                  <div className="text-xs text-white/70">
                    Total de chamadas carregadas: <span className="font-semibold">{chamadas.length}</span>
                  </div>
                  <div className="mt-1 border border-white/15 rounded-lg bg-[#1634FF]/30 overflow-hidden flex-1 min-h-[160px] max-h-[420px]">
                    <div className="max-h-[420px] overflow-auto divide-y divide-white/10">
                      {chamadas.map((c, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelecionarLigacao(idx)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-[#1634FF] focus:outline-none focus:bg-[#1634FF] transition-colors flex flex-col gap-0.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold truncate">{c.cliente || 'Sem nome'}</span>
                            <span className="text-[10px] text-white/70">{c.dataLigacao}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2 text-[10px] text-white/70">
                            <span className="truncate">Analista: {c.analista || 'N/I'}</span>
                            <span className="truncate">Contrato: {c.contrato || '-'}</span>
                          </div>
                        </button>
                      ))}

                      {chamadas.length === 0 && (
                        <div className="px-3 py-6 text-xs text-white/70 text-center">
                          Nenhuma chamada encontrada na planilha.
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-[10px] text-white/60 mt-1">
                    Suba uma planilha CSV real para carregar as ligações que serão avaliadas.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
