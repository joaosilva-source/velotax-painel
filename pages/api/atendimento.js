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
    // Preferências aprendidas por feedback (sem banir termos): prefer/avoid
    let preferTerms = [];
    let avoidTerms = [];
    let avoidRepeatRequest = false;
    let enforceCTAAppSim = false;
    try {
      const fbFile = path.join(process.cwd(), 'data', 'feedback.json');
      if (fs.existsSync(fbFile)) {
        const arr = JSON.parse(fs.readFileSync(fbFile, 'utf8') || '[]');
        if (Array.isArray(arr)) {
          const pref = new Set();
          const av = new Set();
          for (const it of arr) {
            const t = String(it?.type || '').toLowerCase();
            const desc = String(it?.descricao || '');
            const toks = normalize(desc).split(' ').filter(Boolean);
            if (t === 'positivo' || t === 'positive' || t === 'bom' || t === 'good') {
              for (const tk of toks) if (tk.length > 2) pref.add(tk);
            }
            if (t === 'negativo' || t === 'negative' || t === 'ruim' || t === 'bad') {
              for (const tk of toks) if (tk.length > 2) av.add(tk);
            }
            // Regras específicas (linguagem natural)
            const dLow = desc.toLowerCase();
            if (/(nao|não)\s*(precisa|necessita|deve)?\s*(ficar\s*)?(repetir|repetindo|repeticao|repetição|ecoar|eco)/.test(dLow) || /nao\s*repetir\s*a\s*solicitacao/.test(dLow)) {
              avoidRepeatRequest = true;
            }
            if ((/acessar?\s*o?\s*app/.test(dLow) || /aplicativo/.test(dLow)) && /simula[cç][aã]o/.test(dLow)) {
              enforceCTAAppSim = true;
            }
          }
          preferTerms = Array.from(pref);
          avoidTerms = Array.from(av);
        }
      }
    } catch {}

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

      // Router por palavras-chave (se existir em data/router.json)
      try {
        const routerPath = path.join(process.cwd(), 'data', 'router.json');
        if (fs.existsSync(routerPath)) {
          const rawRouter = fs.readFileSync(routerPath, 'utf8');
          const router = JSON.parse(rawRouter || '{}');
          const qn = normalize(pergunta);
          let bestRoute = { file: '', hits: 0, allowed: [] };
          for (const key of Object.keys(router || {})) {
            try {
              const entry = router[key];
              const kws = Array.isArray(entry?.keywords) ? entry.keywords.map(String) : [];
              let h = 0;
              for (const kw of kws) {
                const kn = normalize(kw);
                if (kn && qn.includes(kn)) h++;
              }
              if (h > bestRoute.hits) bestRoute = { file: entry?.file || '', hits: h, allowed: kws };
            } catch {}
          }
          if (bestRoute.file && bestRoute.hits > 0) {
            const abs1 = path.isAbsolute(bestRoute.file) ? bestRoute.file : path.join(process.cwd(), bestRoute.file);
            if (fs.existsSync(abs1)) {
              // força uso apenas deste arquivo
              candidatePaths.length = 0;
              candidatePaths.push(abs1);
              // guardar termos permitidos do router
              let allowed = (bestRoute.allowed || []).map((s) => String(s || '')).filter(Boolean);
              //  Enriquecer allowed com palavras-chave do CSV (data/faq.csv)
              try {
                const csvPath = path.join(process.cwd(), 'data', 'faq.csv');
                if (fs.existsSync(csvPath)) {
                  const rawCsv = fs.readFileSync(csvPath, 'utf8');
                  // parse leve
                  const rows = (() => {
                    const out = [];
                    let cur = [], val = '', inQ = false; const t = rawCsv;
                    for (let i=0;i<t.length;i++) { const ch=t[i], nx=t[i+1];
                      if (inQ) { if (ch==='"' && nx==='"'){ val+='"'; i++; } else if (ch==='"'){ inQ=false; } else { val+=ch; } }
                      else { if (ch==='"') inQ=true; else if (ch===','){ cur.push(val); val=''; } else if (ch==='\n'){ cur.push(val); out.push(cur); cur=[]; val=''; } else if (ch==='\r'){ } else { val+=ch; } }
                    }
                    if (val.length || cur.length){ cur.push(val); out.push(cur);} return out;
                  })();
                  if (rows && rows.length) {
                    const headers = rows[0].map((h)=>String(h||'').trim());
                    const dataRows = rows.slice(1);
                    const idxPerg = headers.findIndex(h=>/pergunta/i.test(h));
                    const idxTema = headers.findIndex(h=>/(tema|tabula)/i.test(h));
                    const idxPal = headers.findIndex(h=>/(palavras|keywords)/i.test(h));
                    const idxSin = headers.findIndex(h=>/(sinonimos|sinônimos|synonyms)/i.test(h));
                    const routeTokens = new Set(normalize((bestRoute.allowed||[]).join(' ') + ' ' + bestRoute.file).split(' ').filter(Boolean));
                    const extra = new Set();
                    for (const r of dataRows) {
                      const tema = normalize((r[idxTema]||'') + ' ' + (r[idxPerg]||''));
                      // se o tema/pergunta da linha contém qualquer token do route
                      let hit = false;
                      for (const tk of routeTokens){ if (tk && tema.includes(tk)) { hit=true; break; } }
                      if (!hit) continue;
                      const pal = String(r[idxPal]||'');
                      const sin = String(r[idxSin]||'');
                      const toks = (pal + ' ' + sin).replace(/[;,]/g,' ').split(/\s+/).filter(Boolean);
                      for (const t of toks) extra.add(t);
                    }
                    allowed = [...new Set([...allowed, ...Array.from(extra)])];
                  }
                }
              } catch {}
              req.__allowedRouterTerms = allowed;
            }
          }
        }
      } catch {}

      // Auto-router a partir do CSV (se nenhum arquivo foi forçado acima)
      try {
        if (candidatePaths.length > 1) {
          // ainda não forçado para um único arquivo: tentar CSV
          const csvPath = path.join(process.cwd(), 'data', 'faq.csv');
          if (fs.existsSync(csvPath)) {
            const rawCsv = fs.readFileSync(csvPath, 'utf8');
            const rows = (() => {
              const out = []; let cur = [], val = '', inQ = false; const t = rawCsv;
              for (let i=0;i<t.length;i++){const ch=t[i],nx=t[i+1];
                if(inQ){if(ch==='"'&&nx==='"'){val+='"';i++;}else if(ch==='"'){inQ=false;}else{val+=ch;}}
                else{if(ch==='"')inQ=true;else if(ch===','){cur.push(val);val='';}else if(ch==='\n'){cur.push(val);out.push(cur);cur=[];val='';}else if(ch==='\r'){}else{val+=ch;}}
              }
              if(val.length||cur.length){cur.push(val);out.push(cur);} return out;
            })();
            if (rows && rows.length) {
              const headers = rows[0].map((h)=>String(h||'').trim());
              const dataRows = rows.slice(1);
              const idxPerg = headers.findIndex(h=>/pergunta/i.test(h));
              const idxTema = headers.findIndex(h=>/(tema|tabula)/i.test(h));
              const idxPal = headers.findIndex(h=>/(palavras|keywords)/i.test(h));
              const idxSin = headers.findIndex(h=>/(sinonimos|sinônimos|synonyms)/i.test(h));

              // agrupar por tema
              const groups = new Map();
              for (const r of dataRows) {
                const temaRaw = String(r[idxTema]||'').trim() || 'outros';
                const perguntaTxt = String(r[idxPerg]||'');
                const pal = String(r[idxPal]||'');
                const sin = String(r[idxSin]||'');
                const allKw = (pal+' '+sin).replace(/[;,]/g,' ').split(/\s+/).filter(Boolean);
                if (!groups.has(temaRaw)) groups.set(temaRaw, { tema: temaRaw, kws: new Set(), perguntas: [] });
                const g = groups.get(temaRaw);
                for (const w of allKw) g.kws.add(w);
                if (perguntaTxt) g.perguntas.push(perguntaTxt);
              }

              // pontuar tema pelo overlap com a pergunta
              const qn = normalize(pergunta);
              const qtk = new Set(qn.split(' ').filter(Boolean));
              let best = { tema: '', score: -1, kws: new Set() };
              for (const { tema, kws, perguntas } of groups.values()) {
                const tn = normalize(tema);
                let s = 0;
                for (const t of qtk) if (tn.includes(t)) s += 2;
                for (const p of perguntas) {
                  const pn = normalize(p);
                  for (const t of qtk) if (pn.includes(t)) s += 1;
                }
                if (s > best.score) best = { tema, score: s, kws };
              }

              if (best.tema) {
                // tentar localizar arquivo correspondente no data/ pelo nome do tema
                const allData = fs.readdirSync(path.join(process.cwd(),'data')).map(f=>({f,fn:normalize(f)}));
                const temaNorm = normalize(best.tema).split(' ').filter(Boolean);
                let chosen = '';
                for (const {f,fn} of allData) {
                  if (/[.](md|txt|pdf)$/i.test(f)) {
                    let hits=0; for (const tk of temaNorm) if (fn.includes(tk)) hits++;
                    if (hits >= Math.max(1, Math.floor(temaNorm.length/3))) { chosen = path.join(process.cwd(),'data',f); break; }
                  }
                }
                if (chosen && fs.existsSync(chosen)) {
                  candidatePaths.length = 0;
                  candidatePaths.push(chosen);
                  req.__allowedRouterTerms = [...new Set([...(req.__allowedRouterTerms||[]), ...Array.from(best.kws||[]), best.tema])];
                }
              }
            }
          }
        }
      } catch {}

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
        // qTokensSet, qTokArr, qBi, qTri e qNorm já definidos acima neste bloco

        const scored = sections.map((sec) => {
          const secNorm = normalize(sec);
          const secTokens = new Set(tokens(secNorm));
          let s = 0;
          for (const t of qTokensSet) if (secTokens.has(t)) s += 3;
          for (const b of qBi) if (b && secNorm.includes(b)) s += 5;
          for (const tr of qTri) if (tr && secNorm.includes(tr)) s += 8;
          // pequeno bônus se contém frase completa de consulta
          if (qNorm && secNorm.includes(qNorm)) s += 2;
          return { sec, _score: s };
        }).sort((a,b) => b._score - a._score);

        const bestText = scored[0]?.sec || '';
        if (bestText) {
          // Preparar linhas e reponderar por prefer/avoid (sem banir)
          const allowTerms = Array.isArray(req.__allowedRouterTerms) ? req.__allowedRouterTerms : [];
          const rawLines = bestText.split(/\n+/g).map((s) => s.trim()).filter(Boolean);
          const actionRe = /\b(passos?|orienta(c|ç)[aã]o|procedimento|contrata(c|ç)[aã]o|simula(c|ç)[aã]o|app|aplicativo|prazo|car[êe]ncia|cobran(c|ç)a|pagamento|pix|quitar?)\b/i;
          const sanitize = (s) => String(s || '')
            .replace(/https?:\/\/\S+/gi, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
          const scoredLines = rawLines.map((ln) => {
            const clean = sanitize(ln);
            const lnTok = new Set(tokens(clean));
            let overlap = 0; for (const t of qTokensSet) if (lnTok.has(t)) overlap++;
            let score = overlap; // base
            if (actionRe.test(clean)) score += 2;
            const hasAllowed = allowTerms.some((t) => t && clean.toLowerCase().includes(String(t).toLowerCase()));
            if (hasAllowed) score += 2;
            const preferHits = preferTerms.filter((t)=> t && clean.includes(t)).length;
            const avoidHits = avoidTerms.filter((t)=> t && clean.includes(t) && !qNorm.includes(t)).length;
            score += preferHits * 2;
            score -= avoidHits * 1.5;
            return { clean, score };
          })
          .filter(x => x.score > 0.25)
          .filter(x => {
            if (!avoidRepeatRequest) return true;
            // Evitar linhas que ecoem a pergunta: menção a 'você solicitou', 'sobre sua solicitação' ou alto overlap literal
            const s = x.clean.toLowerCase();
            if (/voc[eê]\s+solicitou|sobre\s+a\s+sua?\s+solicita[cç][aã]o|em\s+sua?\s+solicita[cç][aã]o/.test(s)) return false;
            const common = new Set();
            for (const t of qTokensSet) if (s.includes(t)) common.add(t);
            return common.size < Math.max(3, Math.ceil(qTokens.size * 0.5));
          })
          .sort((a,b)=>b.score - a.score);
          let topBullets = scoredLines.slice(0, 6).map(x=>x.clean);
          if (enforceCTAAppSim) {
            const cta = 'Acesse o aplicativo Velotax e faça a simulação de crédito na seção "Simulação de Crédito" para concluir a contratação.';
            if (!topBullets.some(l => l.toLowerCase().includes('simula'))) {
              topBullets = [...topBullets.slice(0,5), cta];
            }
          }
          const contextText = topBullets.join('\n');
          // Responder de forma determinística e 100% baseada no contexto extraído
          const corpo = [
            'Agradecemos o seu contato.',
            '',
            `Sobre a sua solicitação: "${String(pergunta).trim()}".`,
            '',
            'Orientações objetivas:',
            ...topBullets.map((b, i) => `${i + 1}. ${b}`),
            '',
            'Permanecemos à disposição para qualquer esclarecimento adicional.',
            'Atenciosamente,',
            'Equipe Velotax.'
          ].join('\n');
          return res.status(200).json({ resposta: corpo });
        }
      }
    }
    catch {}

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

    // 3) Escolher a melhor resposta diretamente da planilha (variáveis específicas do bloco CSV)
    const qNormCsv = normalize(pergunta);
    const qTokensCsv = new Set(tokens(pergunta));
    const qTokArrCsv = Array.from(qTokensCsv);
    const qBiCsv = ngrams(qTokArrCsv, 2);
    const qTriCsv = ngrams(qTokArrCsv, 3);

    const scoredAll = base.map((r) => {
      let s = 0;
      // Similaridade com a coluna Pergunta
      const exPergNorm = normalize(r.pergunta);
      const exPergTokens = new Set(tokens(exPergNorm));
      for (const t of qTokensCsv) if (exPergTokens.has(t)) s += 3;
      for (const b of qBiCsv) if (b && exPergNorm.includes(b)) s += 5;
      for (const tr of qTriCsv) if (tr && exPergNorm.includes(tr)) s += 8;
      // Boost por palavras-chave/sinônimos
      for (const kw of r.kws) {
        if (!kw) continue;
        if (qTokensCsv.has(kw)) s += 2; else if (qNormCsv.includes(kw)) s += 1;
      }
      // Pequeno boost por nome do tema presente
      if (r.temaKey && qNormCsv.includes(r.temaKey)) s += 2;
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
