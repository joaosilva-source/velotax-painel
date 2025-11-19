import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'monitoria-cobranca-avaliacoes.json');

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify([]), 'utf8');
  }
}

export default function handler(req, res) {
  try {
    ensureFile();
    if (req.method === 'GET') {
      const raw = fs.readFileSync(FILE_PATH, 'utf8');
      const data = JSON.parse(raw || '[]');
      return res.status(200).json({ avaliacoes: data });
    }

    if (req.method === 'POST') {
      const { ligacao, produto, respostas, pontuacaoTotal, observacao } = req.body || {};
      const registro = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        ligacao: ligacao || {},
        produto: produto || '',
        respostas: respostas || {},
        pontuacaoTotal: Number(pontuacaoTotal) || 0,
        observacao: observacao || '',
        criadoEm: new Date().toISOString(),
      };
      const raw = fs.readFileSync(FILE_PATH, 'utf8');
      const data = JSON.parse(raw || '[]');
      data.push(registro);
      fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
      return res.status(201).json({ ok: true, registro });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro na API de avaliações de monitoria', error);
    return res.status(500).json({ error: 'Erro ao processar avaliações.' });
  }
}
