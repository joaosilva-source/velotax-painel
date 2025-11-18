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
    const bannedTerms = [
      'malha', 'e-cac', 'e cac', 'pendenc', 'restitu', 'open finance', 'score', 'cartao', 'cartão'
    ];

    // 0) Fonte alternativa: base textual local (DATA_TEXT_PATH) ou melhor documento em data/ e public/data
    try {
      const textPath = process.env.DATA_TEXT_PATH ? String(process.env.DATA_TEXT_PATH) : '';
      const absConfigured = textPath ? (path.isAbsolute(textPath) ? textPath : path.join(process.cwd(), textPath)) : '';
      const candidatePaths = [];
      // Prefer configured path if provided
      if (absConfigured) candidatePaths.push(absConfigured);
      // Collect from data/ and public/data
      const addIfExists = (p) => { try { if (fs.existsSync(p)) candidatePaths.push(p); } catch {} };
      const scanDir = (dir) => {
        try {
          const full = path.join(process.cwd(), dir);
          const items = fs.readdirSync(full);
          for (const it of items) {
            const p = path.join(full, it);
            if (/[.](txt|pdf|md|markdown|html|htm|csv)$/i.test(it)) addIfExists(p);
          }
        } catch {}
      };
      scanDir('data');
      scanDir(path.join('public','data'));

      // Helper: read text from a candidate path (txt or pdf)
      const readCandidateText = async (p) => {
        try {
          if (/\.pdf$/i.test(p)) {
            const pdfParse = (await import('pdf-parse')).default;
            const buf = fs.readFileSync(p);
            const pdfData = await pdfParse(buf);
            return String(pdfData?.text || '');
          }
          return fs.readFileSync(p, 'utf8');
        } catch { return ''; }
      };

      // If no local files, try public URLs for default names
      if (!candidatePaths.length) {
        try {
          const proto = (req.headers['x-forwarded-proto'] || 'https');
          const host = req.headers.host;
          if (host) {
            const baseUrl = `${proto}://${host}`;
            const tryFetch = async (u, pdf=false) => {
              try {
                const r = await fetch(u);
                if (!r.ok) return '';
                if (pdf) {
                  const ab = await r.arrayBuffer();
                  const pdfParse = (await import('pdf-parse')).default;
                  const pdfData = await pdfParse(Buffer.from(ab));
                  return String(pdfData?.text || '');
                } else {
                  return await r.text();
                }
              } catch { return ''; }
            };
            // push pseudo-path tokens with content in map
            const urlTxt = await tryFetch(`${baseUrl}/data/document%201`);
            const urlPdf = await tryFetch(`${baseUrl}/data/document%201.pdf`, true);
            // place into arrays as synthetic entries
            if (urlTxt) candidatePaths.push('URL_TXT::/data/document%201');
            if (urlPdf) candidatePaths.push('URL_PDF::/data/document%201.pdf');
          }
        } catch {}
      }

      // Load and select best document by max section score
      const qTokensSet = new Set(tokens(pergunta));
      const qTokArr = Array.from(qTokensSet);
      const qBi = ngrams(qTokArr, 2);
      const qTri = ngrams(qTokArr, 3);
      const qNorm = normalize(pergunta);

      let bestDoc = { path: '', text: '', score: -1 };
      for (const p of candidatePaths) {
        let txt = '';
        if (p.startsWith('URL_')) {
          // Already fetched above; re-fetch quickly for simplicity
          try {
            const proto = (req.headers['x-forwarded-proto'] || 'https');
            const host = req.headers.host;
            if (host) {
              const baseUrl = `${proto}://${host}`;
              if (p.startsWith('URL_TXT::')) {
                const r = await fetch(`${baseUrl}${p.replace('URL_TXT::','')}`);
                if (r.ok) txt = await r.text();
              } else if (p.startsWith('URL_PDF::')) {
                const r = await fetch(`${baseUrl}${p.replace('URL_PDF::','')}`);
                if (r.ok) {
                  const ab = await r.arrayBuffer();
                  const pdfParse = (await import('pdf-parse')).default;
                  const pdfData = await pdfParse(Buffer.from(ab));
                  txt = String(pdfData?.text || '');
                }
              }
            }
          } catch {}
        } else {
          txt = await readCandidateText(p);
        }
        if (!txt || !txt.trim()) continue;
        let sections = String(txt).split(/\n{2,}/g).map((s) => s.trim()).filter(Boolean);
        if (sections.length < 3) {
          const lines = String(txt).split(/\n+/g).map((l) => l.trim()).filter(Boolean);
          const grouped = [];
          let buf = [];
          for (const line of lines) {
            buf.push(line);
            if (buf.join(' ').length > 400) { grouped.push(buf.join('\n')); buf = []; }
          }
          if (buf.length) grouped.push(buf.join('\n'));
          if (grouped.length) sections = grouped;
          if (sections.length === 0) sections = [String(txt)];
        }
        let maxScore = 0;
        for (const sec of sections) {
          const secNorm = normalize(sec);
          const secTokens = new Set(tokens(secNorm));
          let s = 0;
          for (const t of qTokensSet) if (secTokens.has(t)) s += 3;
          for (const b of qBi) if (b && secNorm.includes(b)) s += 5;
          for (const tr of qTri) if (tr && secNorm.includes(tr)) s += 8;
          if (qNorm && secNorm.includes(qNorm)) s += 2;
          if (s > maxScore) maxScore = s;
        }
        if (maxScore > bestDoc.score) bestDoc = { path: p, text: txt, score: maxScore };
      }

      // Use best document if any
      let textBase = bestDoc.text;
      const textFileExists = !!textBase;
      if (textBase && textBase.trim()) {
        try { console.log('[ATENDIMENTO] usando documento:', bestDoc.path); } catch {}
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
        const qTokens = qTokensSet;
        const qTokArr = Array.from(qTokens);
        const qBi = ngrams(qTokArr, 2);
        const qTri = ngrams(qTokArr, 3);
        const qNorm = qNorm;

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
          // Filtrar linhas do trecho para evitar mistura de temas
          const keepLine = (ln) => {
            const lnTok = new Set(tokens(ln));
            let overlap = 0;
            for (const t of qTokens) if (lnTok.has(t)) overlap++;
            // banir termos que não estejam na pergunta
            const bannedHit = bannedTerms.some(term => ln.toLowerCase().includes(term)) && !bannedTerms.some(term => qNorm.includes(term));
            if (bannedHit) return false;
            return overlap >= 2 || /\b(passos?|orienta(c|ç)[aã]o|procedimento|contrata(c|ç)[aã]o|simula(c|ç)[aã]o|app|aplicativo|prazo|car[êe]ncia|cobran(c|ç)a|pagamento|pix|quitar?)\b/i.test(ln);
          };
          const filtered = bestText
            .split(/\n+/g)
            .map((s) => s.trim())
            .filter(Boolean)
            .filter(keepLine)
            .join('\n');
          const contextText = (filtered && filtered.length > 120 ? filtered : bestText).slice(0, 1200);
          const apiKey = process.env.GROQ_API_KEY || '';
          // 4a) Tentativa 1: Gemini (principal)
          try {
            const gkey = (process.env.GEMINI_API_KEY || '').trim();
            if (gkey) {
              const gmodel = (process.env.GEMINI_MODEL || 'gemini-1.5-flash').trim();
              const controller = new AbortController();
              const t = setTimeout(() => controller.abort(), 8000);
              const gResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(gmodel)}:generateContent?key=${encodeURIComponent(gkey)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [
                    { role: 'user', parts: [ { text: `${contexto}\n\n${userMsg}` } ] }
                  ]
                }),
                signal: controller.signal
              });
              clearTimeout(t);
              if (gResp.ok) {
                const j = await gResp.json();
                const llm = j?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                if (llm && llm.trim()) {
                  return res.status(200).json({ resposta: llm });
                }
              }
            }
          } catch {}

          // 4b) Tentativa 2: LLM local (Ollama)
          try {
            const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
            const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.1:8b';
            const controller = new AbortController();
            const t = setTimeout(() => controller.abort(), 8000);
            const resp = await fetch(`${ollamaUrl.replace(/\/$/, '')}/api/chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: ollamaModel,
                stream: false,
                messages: [
                  { role: 'system', content: contexto },
                  { role: 'user', content: userMsg }
                ],
                options: { temperature: 0.2 }
              }),
              signal: controller.signal
            });
            clearTimeout(t);
            if (resp.ok) {
              const j = await resp.json();
              const llm = j?.message?.content || j?.choices?.[0]?.message?.content || '';
              if (llm && llm.trim()) {
                return res.status(200).json({ resposta: llm });
              }
            }
          } catch {}

          // 4b.2) Tentativa 3: LLM local OpenAI-compatible (vLLM), se configurado
          try {
            const localUrl = (process.env.LOCAL_LLM_URL || '').trim();
            if (localUrl) {
              const controller = new AbortController();
              const t = setTimeout(() => controller.abort(), 8000);
              const resp = await fetch(`${localUrl.replace(/\/$/, '')}/v1/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  model: process.env.LOCAL_LLM_MODEL || 'llama-3.1-8b-instruct',
                  messages: [
                    { role: 'system', content: contexto },
                    { role: 'user', content: userMsg }
                  ],
                  temperature: 0.2
                }),
                signal: controller.signal
              });
              clearTimeout(t);
              if (resp.ok) {
                const j = await resp.json();
                const llm = j?.choices?.[0]?.message?.content || '';
                if (llm && llm.trim()) {
                  return res.status(200).json({ resposta: llm });
                }
              }
            }
          } catch {}

          // 4c) Tentativa 4: Groq
          if (apiKey) {
            const contexto = [
              'Você é um assistente de atendimento da Velotax. Escreva uma resposta formal, técnica e neutra, em formato de e-mail institucional.',
              'Use a base textual fornecida como CONTEXTO TÉCNICO (reformule com suas palavras, não copie literalmente).',
              'Não inclua emojis, gírias ou promessas. Seja claro, objetivo e respeitoso.',
              'Responda EXCLUSIVAMENTE sobre o assunto da pergunta. Não mencione temas não relacionados (ex.: malha fina, e-CAC, pendências) a menos que a pergunta contenha explicitamente essas palavras.',
              'Se algum trecho do contexto trouxer tópicos diferentes, ignore-os e mantenha o foco apenas no tema solicitado.',
            ].join('\n');
            const userMsg = [
              `Pergunta do cliente: ${String(pergunta).trim()}`,
              '',
              'Contexto técnico extraído da base (não copiar, apenas usar como referência):',
              contextText,
              '',
              'Escreva a resposta final como e-mail com:',
              '- Agradecimento inicial',
              '- Contextualização breve (o que foi solicitado)',
              '- Orientação clara e objetiva (com base no contexto, podendo listar passos quando apropriado)',
              '- Encerramento institucional curto',
            ].join('\n');
            try {
              const controller = new AbortController();
              const t = setTimeout(() => controller.abort(), 8000);
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
                  temperature: 0.2
                }),
                signal: controller.signal
              });
              clearTimeout(t);
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
            contextText,
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
    const respostaFinal = [
      'Agradecemos o seu contato.',
      '',
      'No momento não foi possível concluir o processamento automático. Por favor, tente novamente em instantes.',
      '',
      'Permanecemos à disposição para qualquer esclarecimento adicional.'
    ].join('\n');
    return res.status(200).json({ resposta: respostaFinal });
  }
}
