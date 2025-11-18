// pages/api/atendimento.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pergunta, tema: temaForcado, gids } = req.body || {};
    if (!pergunta || !String(pergunta).trim()) {
      return res.status(400).json({ error: 'Pergunta obrigatória.' });
    }

    // 1) Carregar CSV da(s) aba(s) informada(s): por padrão gid=0; aceitar lista em body.gids (ex: "0,12345")
    const gidsList = String(gids || '0')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const fetchCsv = async (gid) => {
      const url = `https://docs.google.com/spreadsheets/d/1tnWusrOW-UXHFM8GT3o0Du93QDwv5G3Ylvgebof9wfQ/export?format=csv&gid=${encodeURIComponent(gid)}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error('Falha ao carregar uma das abas da planilha.');
      return await r.text();
    };
    const csvTexts = [];
    for (const gid of gidsList) {
      try {
        csvTexts.push(await fetchCsv(gid));
      } catch (e) {
        // ignora abas que falharem, segue com as demais
      }
    }
    if (!csvTexts.length) {
      return res.status(500).json({ error: 'Não foi possível carregar a planilha (todas as abas falharam).' });
    }

    // 2) Parse CSV simples com suporte a aspas
    function parseCSV(text) {
      const rows = [];
      let cur = [];
      let val = '';
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const next = text[i + 1];
        if (inQuotes) {
          if (ch === '"' && next === '"') {
            val += '"';
            i++; // skip escaped quote
          } else if (ch === '"') {
            inQuotes = false;
          } else {
            val += ch;
          }
        } else {
          if (ch === '"') {
            inQuotes = true;
          } else if (ch === ',') {
            cur.push(val);
            val = '';
          } else if (ch === '\n') {
            cur.push(val);
            rows.push(cur);
            cur = [];
            val = '';
          } else if (ch === '\r') {
            // ignore CR
          } else {
            val += ch;
          }
        }
      }
      if (val.length || cur.length) {
        cur.push(val);
        rows.push(cur);
      }
      return rows;
    }

    // 2.1) Unificar CSVs: considerar mesmo cabeçalho da primeira aba válida
    const rowsAll = [];
    for (const t of csvTexts) {
      const parsed = parseCSV(t);
      if (parsed && parsed.length) rowsAll.push(parsed);
    }
    if (!rowsAll.length) {
      return res.status(500).json({ error: 'Planilha vazia ou inválida.' });
    }
    const headerRow = rowsAll[0][0] || [];
    const rows = [headerRow];
    for (const parsed of rowsAll) {
      if (parsed.length > 1) rows.push(...parsed.slice(1));
    }
    let headers = [];
    let dataRows = [];
    if (rows.length > 0) {
      headers = rows[0].map((h) => String(h).trim());
      dataRows = rows.slice(1);
    }

    const idxPergunta = headers.findIndex(h => /pergunta/i.test(h));
    const idxResposta = headers.findIndex(h => /resposta/i.test(h));
    const idxPalavras = headers.findIndex(h => /(palavras|palavras\s*chave|keywords)/i.test(h));
    const idxSinonimos = headers.findIndex(h => /(sinonimos|sinônimos|synonyms)/i.test(h));
    const idxTema = headers.findIndex(h => /(tema|assunto|tópico|topico|categoria)/i.test(h));

    // Helpers de normalização e tokenização
    const normalize = (s) => String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}+/gu, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const tokens = (s) => normalize(s).split(' ').filter(Boolean);
    const ngrams = (arr, n) => {
      const out = [];
      for (let i = 0; i <= arr.length - n; i++) out.push(arr.slice(i, i + n).join(' '));
      return out;
    };

    // 2) Construir índice de linhas com tema, palavras e sinônimos
    const base = dataRows.map((r) => {
      const perguntaEx = r[idxPergunta] || '';
      const respostaEx = r[idxResposta] || '';
      const tema = idxTema !== -1 ? String(r[idxTema] || '') : '';
      const palavras = idxPalavras !== -1 ? String(r[idxPalavras] || '') : '';
      const sinonimos = idxSinonimos !== -1 ? String(r[idxSinonimos] || '') : '';
      const kws = [
        ...tokens(palavras.replace(/[;,]/g, ' ')),
        ...tokens(sinonimos.replace(/[;,]/g, ' ')),
        ...tokens(tema)
      ];
      // também indexar conteúdo inteiro (pergunta+resposta) para matching quando keywords estiverem vazias
      const contentNorm = normalize(`${perguntaEx} ${respostaEx}`);
      const contentTokens = new Set(tokens(contentNorm));
      return {
        pergunta: perguntaEx,
        resposta: respostaEx,
        tema,
        temaKey: normalize(tema),
        kws: Array.from(new Set(kws)).filter(Boolean),
        contentNorm,
        contentTokens,
      };
    }).filter((x) => (x.pergunta || x.resposta));

    // 3) Escolher a melhor resposta diretamente da planilha
    const qNorm = normalize(pergunta);
    const qTokens = new Set(tokens(pergunta));
    const qTokArr = Array.from(qTokens);
    const qBi = ngrams(qTokArr, 2);
    const qTri = ngrams(qTokArr, 3);

    const scoredAll = base.map((r) => {
      let s = 0;
      // Similaridade com a coluna Pergunta
      const exPergNorm = normalize(r.pergunta);
      const exPergTokens = new Set(tokens(exPergNorm));
      for (const t of qTokens) if (exPergTokens.has(t)) s += 3;
      for (const b of qBi) if (b && exPergNorm.includes(b)) s += 5;
      for (const tr of qTri) if (tr && exPergNorm.includes(tr)) s += 8;
      // Boost por palavras-chave/sinônimos
      for (const kw of r.kws) {
        if (!kw) continue;
        if (qTokens.has(kw)) s += 2; else if (qNorm.includes(kw)) s += 1;
      }
      // Pequeno boost por nome do tema presente
      if (r.temaKey && qNorm.includes(r.temaKey)) s += 2;
      return { ...r, _score: s };
    }).sort((a,b)=>b._score - a._score);

    const best = scoredAll[0] || null;
    const raw = (best && String(best.resposta || '').trim()) || '';
    const respostaFinal = raw
      ? [
          'Agradecemos o seu contato.',
          '',
          `Sobre a sua solicitação: "${String(pergunta).trim()}".`,
          '',
          'Orientação:',
          raw,
          '',
          'Permanecemos à disposição para qualquer esclarecimento adicional.'
        ].join('\n')
      : 'Agradecemos o seu contato. No momento não localizamos uma orientação diretamente aplicável na base. Por favor, descreva com mais detalhes para encaminharmos a resposta adequada.';
    return res.status(200).json({ resposta: respostaFinal });
    
  } catch (e) {
    return res.status(500).json({ error: 'Erro inesperado', details: String(e?.message || e) });
  }
}
