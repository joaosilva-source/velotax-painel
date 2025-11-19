import fs from 'fs';
import path from 'path';

// API para ler a planilha de cobrança e retornar dados básicos da ligação
export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const csvPath = 'C:/Users/Velotax Suporte/Downloads/Cobrança/s793gxuFqziHUqtK7yaERFiWlO4OByDv_seKmwfjwZ1 (1).csv';

    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({ error: 'Arquivo CSV não encontrado no caminho configurado.' });
    }

    const raw = fs.readFileSync(csvPath, 'utf8');
    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      return res.status(200).json({ chamadas: [] });
    }

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

    const header = parseCsvLine(lines[0]);
    const idxAgent = header.indexOf('agent_name');
    const idxCallDate = header.indexOf('call_date');
    const idxCreatedAt = header.indexOf('created_at');
    const idxIdentifier = header.indexOf('identifier');
    const idxMailing = header.indexOf('mailing_data.data');

    const chamadas = [];

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

      chamadas.push({
        analista: agente,
        dataLigacao: callDate,
        data: createdAt,
        cliente,
        contrato: identifier,
      });

      if (chamadas.length >= 500) break;
    }

    return res.status(200).json({ chamadas });
  } catch (error) {
    console.error('Erro ao ler CSV de cobrança', error);
    return res.status(500).json({ error: 'Erro ao ler CSV de cobrança.' });
  }
}
