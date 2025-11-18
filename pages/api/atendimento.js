// pages/api/atendimento.js
import fs from 'fs';
import path from 'path';
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pergunta, tema: temaForcado, gids } = req.body || {};
    if (!pergunta || !String(pergunta).trim()) {
      return res.status(400).json({ error: 'Pergunta obrigatória.' });
    }

    // Helpers de normalização e tokenização (compartilhados)
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

    // 0) Fonte alternativa: base textual local (DATA_TEXT_PATH ou data/document 1 / document 1.pdf)
    try {
      const textPath = process.env.DATA_TEXT_PATH ? String(process.env.DATA_TEXT_PATH) : 'data/document 1.pdf';
      const absText = path.isAbsolute(textPath) ? textPath : path.join(process.cwd(), textPath);
      let textBase = '';
      // 0a) tentar TXT puro
      try { textBase = fs.readFileSync(absText, 'utf8'); } catch {}
      // 0b) se TXT não existir, tentar PDF (mesmo caminho com .pdf ou caminho já com .pdf)
      if (!textBase || !textBase.trim()) {
        try {
          const pdfPath = absText.endsWith('.pdf') ? absText : `${absText}.pdf`;
          if (fs.existsSync(pdfPath)) {
            const pdfParse = (await import('pdf-parse')).default;
            const buf = fs.readFileSync(pdfPath);
            const pdfData = await pdfParse(buf);
            textBase = String(pdfData?.text || '');
          }
        } catch {}
      }
      // 0b2) tentar PDF em public/data/document 1.pdf
      if (!textBase || !textBase.trim()) {
        try {
          const publicPdf = path.join(process.cwd(), 'public', 'data', 'document 1.pdf');
          if (fs.existsSync(publicPdf)) {
            const pdfParse = (await import('pdf-parse')).default;
            const buf = fs.readFileSync(publicPdf);
            const pdfData = await pdfParse(buf);
            textBase = String(pdfData?.text || '');
          }
        } catch {}
      }
      // 0c) em ambientes serverless, tentar baixar do caminho público
      if ((!textBase || !textBase.trim())) {
        try {
          const proto = (req.headers['x-forwarded-proto'] || 'https');
          const host = req.headers.host;
          if (host) {
            const baseUrl = `${proto}://${host}`;
            // tentar TXT público
            const rTxt = await fetch(`${baseUrl}/data/document%201`);
            if (rTxt.ok) {
              const t = await rTxt.text();
              if (t && t.trim()) textBase = t;
            }
            if (!textBase || !textBase.trim()) {
              const rPdf = await fetch(`${baseUrl}/data/document%201.pdf`);
              if (rPdf.ok) {
                const ab = await rPdf.arrayBuffer();
                const pdfParse = (await import('pdf-parse')).default;
                const pdfData = await pdfParse(Buffer.from(ab));
                textBase = String(pdfData?.text || '');
              }
            }
          }
        } catch {}
      }
      const textFileExists = fs.existsSync(absText) || fs.existsSync(absText + '.pdf');
      if (textBase && textBase.trim()) {
        try { console.log('[ATENDIMENTO] usando base textual:', absText); } catch {}
        let sections = String(textBase).split(/\n{2,}/g).map((s) => s.trim()).filter(Boolean);
        if (sections.length < 3) {
          // PDF pode vir com quebras simples; agrupar linhas em blocos
          const lines = String(textBase).split(/\n+/g).map((l) => l.trim()).filter(Boolean);
          const grouped = [];
          let buf = [];
          for (const line of lines) {
            buf.push(line);
            if (buf.join(' ').length > 400) { grouped.push(buf.join('\n')); buf = []; }
          }
          if (buf.length) grouped.push(buf.join('\n'));
          if (grouped.length) sections = grouped;
          if (sections.length === 0) sections = [String(textBase)];
        }
        const qTokens = new Set(tokens(pergunta));
        const qTokArr = Array.from(qTokens);
        const qBi = ngrams(qTokArr, 2);
        const qTri = ngrams(qTokArr, 3);
        const qNorm = normalize(pergunta);

        const scored = sections.map((sec) => {
          const secNorm = normalize(sec);
          const secTokens = new Set(tokens(secNorm));
          let s = 0;
          for (const t of qTokens) if (secTokens.has(t)) s += 3;
          for (const b of qBi) if (b && secNorm.includes(b)) s += 5;
          for (const tr of qTri) if (tr && secNorm.includes(tr)) s += 8;
          // pequeno bônus se contém frase completa de consulta
          if (qNorm && secNorm.includes(qNorm)) s += 2;
          return { sec, _score: s };
        }).sort((a,b) => b._score - a._score);

        const bestText = scored[0]?.sec || '';
        if (bestText) {
          const apiKey = process.env.GROQ_API_KEY || '';
          if (apiKey) {
            const contexto = [
              'Você é um assistente de atendimento da Velotax. Escreva uma resposta formal, técnica e neutra, em formato de e-mail institucional.',
              'Use a base textual fornecida como CONTEXTO TÉCNICO (reformule com suas palavras, não copie literalmente).',
              'Não inclua emojis, gírias ou promessas. Seja claro, objetivo e respeitoso.',
            ].join('\n');
            const userMsg = [
              `Pergunta do cliente: ${String(pergunta).trim()}`,
              '',
              'Contexto técnico extraído da base (não copiar, apenas usar como referência):',
              bestText,
              '',
              'Escreva a resposta final como e-mail com:',
              '- Agradecimento inicial',
              '- Contextualização breve (o que foi solicitado)',
              '- Orientação clara e objetiva (com base no contexto, podendo listar passos quando apropriado)',
              '- Encerramento institucional curto',
            ].join('\n');
            try {
              const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  model: 'llama-3.1-8b-instant',
                  messages: [
                    { role: 'system', content: contexto },
                    { role: 'user', content: userMsg }
                  ],
                  temperature: 0.35
                })
              });
              if (groqResp.ok) {
                const j = await groqResp.json();
                const llm = j?.choices?.[0]?.message?.content || '';
                if (llm.trim()) {
                  return res.status(200).json({ resposta: llm });
                }
              }
            } catch {}
          }
          // Fallback de template
          const respostaFinal = [
            'Agradecemos o seu contato.',
            '',
            `Sobre a sua solicitação: "${String(pergunta).trim()}".`,
            '',
            'Orientação:',
            bestText,
            '',
            'Permanecemos à disposição para qualquer esclarecimento adicional.'
          ].join('\n');
          return res.status(200).json({ resposta: respostaFinal });
        } else if (textFileExists) {
          try { console.log('[ATENDIMENTO] base textual presente, nenhum trecho casou.'); } catch {}
          // Forçar uso de base textual quando presente
          const respostaFinal = [
            'Agradecemos o seu contato.',
            '',
            `Sobre a sua solicitação: "${String(pergunta).trim()}".`,
            '',
            'Orientação:',
            'No momento não localizamos uma orientação diretamente aplicável na base textual interna. Por favor, refine a descrição ou tente novamente.',
            '',
            'Permanecemos à disposição para qualquer esclarecimento adicional.'
          ].join('\n');
          return res.status(200).json({ resposta: respostaFinal });
        }
      }
    } catch {}

    // 1) Fonte de dados: prioriza CSV local (DATA_CSV_PATH). Se não houver, usa Google Sheets (gid=0 ou lista informada)
    let csvTexts = [];
    const localPath = process.env.DATA_CSV_PATH ? String(process.env.DATA_CSV_PATH) : 'data/faq.csv';
    if (localPath) {
      try {
        const abs = path.isAbsolute(localPath) ? localPath : path.join(process.cwd(), localPath);
        const buf = fs.readFileSync(abs);
        csvTexts = [buf.toString('utf8')];
      } catch {
        csvTexts = [];
      }
    }
    if (!csvTexts.length) {
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
      for (const gid of gidsList) {
        try { csvTexts.push(await fetchCsv(gid)); } catch {}
      }
      if (!csvTexts.length) {
        return res.status(500).json({ error: 'Não foi possível carregar a planilha (todas as abas falharam).' });
      }
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

    // Helpers já definidos acima: normalize, tokens, ngrams

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

    // 4) Se houver GROQ_API_KEY, reescrever a resposta como e-mail contextualizado (sem colar literal)
    const apiKey = process.env.GROQ_API_KEY || '';
    if (apiKey && raw) {
      const contexto = [
        'Você é um assistente de atendimento da Velotax. Escreva uma resposta formal, técnica e neutra, em formato de e-mail institucional.',
        'Use a orientação da base como CONTEXTO TÉCNICO (reformule com suas palavras, não copie literalmente).',
        'Não inclua emojis, gírias ou promessas. Seja claro, objetivo e respeitoso.',
      ].join('\n');
      const userMsg = [
        `Pergunta do cliente: ${String(pergunta).trim()}`,
        '',
        'Contexto técnico extraído da base (não copiar, apenas usar como referência):',
        raw,
        '',
        'Escreva a resposta final como e-mail com:',
        '- Agradecimento inicial',
        '- Contextualização breve (o que foi solicitado)',
        '- Orientação clara e objetiva (com base no contexto)',
        '- Encerramento institucional curto',
      ].join('\n');
      try {
        const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: contexto },
              { role: 'user', content: userMsg }
            ],
            temperature: 0.4
          })
        });
        if (groqResp.ok) {
          const j = await groqResp.json();
          const llm = j?.choices?.[0]?.message?.content || '';
          if (llm.trim()) {
            return res.status(200).json({ resposta: llm });
          }
        }
      } catch {}
    }

    // 4b) Fallback: modelo indisponível — formatar resposta com template institucional
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
