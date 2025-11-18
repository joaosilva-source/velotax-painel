// pages/api/atendimento.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pergunta } = req.body || {};
    if (!pergunta || !String(pergunta).trim()) {
      return res.status(400).json({ error: 'Pergunta obrigatória.' });
    }

    // 1) Carregar CSV da planilha informada (Primeira aba / gid=0)
    const URL_DO_CSV = 'https://docs.google.com/spreadsheets/d/1tnWusrOW-UXHFM8GT3o0Du93QDwv5G3Ylvgebof9wfQ/export?format=csv&gid=0';
    const csvResp = await fetch(URL_DO_CSV);
    if (!csvResp.ok) {
      return res.status(500).json({ error: 'Falha ao carregar base de exemplos.' });
    }
    const csvText = await csvResp.text();

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

    const rows = parseCSV(csvText);
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
      return {
        pergunta: perguntaEx,
        resposta: respostaEx,
        tema,
        temaKey: normalize(tema),
        kws: Array.from(new Set(kws)).filter(Boolean),
      };
    }).filter((x) => (x.pergunta || x.resposta));

    // 3) Detectar o tema da pergunta usando ocorrência de palavras-chave, sinônimos e o próprio nome do tema
    const qNorm = normalize(pergunta);
    const qTokens = new Set(tokens(pergunta));
    const temaScore = new Map();
    for (const row of base) {
      let score = 0;
      // Pontos por conter o nome do tema na pergunta
      if (row.temaKey && qNorm.includes(row.temaKey)) score += 3;
      // Pontos por cada keyword/sinonimo contido
      for (const kw of row.kws) {
        if (!kw) continue;
        if (qTokens.has(kw)) score += 2;
        else if (qNorm.includes(kw)) score += 1;
      }
      if (score > 0) {
        temaScore.set(row.temaKey, (temaScore.get(row.temaKey) || 0) + score);
      }
    }

    let selectedTemaKey = '';
    if (temaScore.size) {
      selectedTemaKey = Array.from(temaScore.entries()).sort((a,b)=>b[1]-a[1])[0][0];
    }

    // 4) Se nenhum tema claro, responder solicitando mais informações por email
    if (!selectedTemaKey) {
      const emailTexto = `Agradecemos o seu contato. Para prosseguirmos com precisão, precisamos confirmar alguns dados sobre o assunto da sua solicitação. Por gentileza, responda este e-mail informando:\n\n• Tema específico (ex.: Crédito do Trabalhador, Restituição, Regularização)\n• Descrição breve do caso\n• Documentos já enviados ou pendentes\n\nAssim que recebermos as informações, seguiremos com a orientação adequada.`;
      return res.status(200).json({ resposta: emailTexto });
    }

    // 5) Filtrar base apenas para o tema selecionado e ranquear exemplos por similaridade
    const themed = base.filter((r) => r.temaKey === selectedTemaKey);
    const scored = themed.map((r) => {
      let s = 0;
      // Similaridade simples por tokens da pergunta x pergunta do exemplo
      const exTokens = new Set(tokens(r.pergunta));
      for (const t of qTokens) if (exTokens.has(t)) s += 1;
      // Mais pontos para correspondência de keywords
      for (const kw of r.kws) if (qTokens.has(kw)) s += 2;
      return { ...r, _score: s };
    }).sort((a,b)=>b._score - a._score);

    // 6) Montar exemplos formatados SOMENTE do tema, para evitar mistura
    let exemplos_formatados = '';
    const top = scored.slice(0, 12); // limitar quantidade
    top.forEach((r, i) => {
      if (String(r.pergunta).trim() || String(r.resposta).trim()) {
        exemplos_formatados += `EXEMPLO ${i + 1}:\n`;
        exemplos_formatados += `TEMA: ${r.tema || '—'}\n`;
        exemplos_formatados += `PERGUNTA DO CLIENTE: ${r.pergunta}\n`;
        exemplos_formatados += `RESPOSTA OTIMIZADA: ${r.resposta}\n\n`;
      }
    });

    const PROMPT_MESTRE = `\nPROMPT MESTRE DE ATENDIMENTO VELOTAX (SISTEMA)\nI. PERSONA E OBJETIVO\nVocê é um Assistente de Atendimento especialista da Velotax. Seu papel é redigir respostas formais, técnicas e padronizadas para clientes.\nSeu objetivo é resolver a consulta do cliente com máxima precisão técnica, clareza e empatia institucional, seguindo rigorosamente as estruturas de resposta e as informações técnicas abaixo. Você deve ser solucionador, neutro e nunca criar falsas expectativas.\nII. TOM E ESTILO OBRIGATÓRIOS\nLinguagem: Formal, profissional, técnica e neutra. A comunicação deve ser clara e objetiva.\nTom: Cordial, respeitoso e empático, mas sempre institucional e neutro. Mantenha a calma, mesmo com clientes exaltados.\nPronomes: Sempre em nome da empresa: "nós", "nossa equipe", "informamos". Nunca use "eu" (ex: "eu acho", "eu verifiquei").\nProibições: Sem emojis, sem gírias, sem abreviações (ex: "vc", "pq").\nNeutralidade (A Regra de Ouro): Nunca culpe terceiros (Receita Federal, Banco do Brasil, Gov.br). Use expressões neutras:\nErrado: "Foi um erro do Banco do Brasil."\nCorreto: "O valor permanece retido na instituição pagadora, aguardando reagendamento."\nErrado: "O site do Gov.br caiu."\nCorreto: "A plataforma Gov.br apresenta uma instabilidade momentânea, orientamos tentar em horários alternados."\nIII. ESTRUTURA OBRIGATÓRIA DE TODAS AS RESPOSTAS\nToda mensagem deve seguir esta estrutura:\n1. Agradecimento inicial:\nEx: "Agradecemos o seu contato." (Sempre iniciar assim).\n2. Explicação técnica e contextualização:\nDescreva o que está acontecendo (o processo) ou o que foi identificado. Seja neutro.\nCite o processo técnico (ex: análise interna, necessidade de reagendamento, instabilidade sistêmica, prazo de reanálise).\n3. Orientação clara e objetiva:\nDiga exatamente o que o cliente deve fazer (ex: enviar print, aguardar 30 dias, acessar o MIR, realizar portabilidade da chave).\nSe for um erro nosso, informe o prazo (ex: 48 horas).\n4. Fechamento cordial:\nEx: "Permanecemos à disposição para quaisquer esclarecimentos adicionais."\nSempre encerrar com: "Atenciosamente, Equipe Velotax."\nIV. PROTOCOLOS DE SEGURANÇA (GUARDA-CHUVAS)\nNão Invente Fatos: Você, como assistente, não tem acesso direto a extratos bancários de clientes.\nSe o cliente alega um pagamento que não foi baixado, solicite o comprovante para "encaminhar ao setor financeiro para conciliação".\nSe o cliente alega que não recebeu um Pix nosso, informe a regra (ex: "O depósito é feito na Chave Pix CPF..."), mas não afirme "verificamos que caiu".\nTerminologia Correta: Sempre use "Meu Imposto de Renda (MIR)". Nunca use o termo "e-CAC".\n\n${exemplos_formatados}\n`;

    const prompt_combinado = `${PROMPT_MESTRE}\n\n# --- 3. TAREFA DE EXECUÇÃO ---\nVocê deve responder APENAS com base no tema detectado e nos exemplos fornecidos abaixo.\nNUNCA misture temas diferentes.\n\nTEMA DETECTADO: ${selectedTemaKey || '—'}\n\nEXEMPLOS DO TEMA:\n${exemplos_formatados}\n\nPERGUNTA DO CLIENTE:\n"${String(pergunta).trim()}"\n\nRESPOSTA OTIMIZADA:`;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GROQ_API_KEY não configurada no servidor.' });
    }

    // 3) Chamar Groq (API compatível com OpenAI)
    const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Você é um assistente de atendimento de elite.' },
          { role: 'user', content: prompt_combinado }
        ],
        temperature: 0.7
      })
    });

    if (!groqResp.ok) {
      const t = await groqResp.text().catch(() => '');
      return res.status(500).json({ error: 'Falha na chamada Groq', details: t });
    }

    const groqJson = await groqResp.json();
    const resposta = groqJson?.choices?.[0]?.message?.content || '';

    return res.status(200).json({ resposta });
  } catch (e) {
    return res.status(500).json({ error: 'Erro inesperado', details: String(e?.message || e) });
  }
}
