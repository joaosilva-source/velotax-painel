import prisma from '@/lib/prisma';

function normalizeName(s) {
  try {
    return String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  } catch {
    return String(s || '').toLowerCase().trim();
  }
}

function canonicalizeTypeKey(raw) {
  const norm = normalizeName(raw || 'outro') || 'outro';
  if ((norm.includes('exclui') || norm.includes('excluir') || norm.includes('exclusao')) && norm.includes('conta')) {
    return 'exclusao de conta';
  }
  if (norm.includes('alteracao') && (norm.includes('dado') || norm.includes('cadastra'))) {
    return 'alteracao de dados cadastrais';
  }
  return norm;
}

function toCSV(rows) {
  const headers = [
    'createdAt',
    'userEmail',
    'action',
    'ip',
    'cpf',
    'tipo',
    'assuntoDetalhado',
    'excluirVelotax',
    'excluirCelcoin',
    'saldoZerado',
    'portabilidadePendente',
    'dividaIrpfQuitada',
    'alteracaoCampo',
    'alteracaoDadoAntigo',
    'alteracaoDadoNovo',
    'alteracaoFotosVerificadas',
    'observacoes',
  ];
  const esc = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v).replace(/"/g, '""');
    if (/[",\n;]/.test(s)) return '"' + s + '"';
    return s;
  };
  const headerLine = headers.join(',');
  const lines = rows.map(r => {
    const d = r.detail || {};
    const action = r.action || '';

    let cpf = '';
    let tipo = '';
    let assuntoDetalhado = '';
    let excluirVelotax = '';
    let excluirCelcoin = '';
    let saldoZerado = '';
    let portabilidadePendente = '';
    let dividaIrpfQuitada = '';
    let alteracaoCampo = '';
    let alteracaoDadoAntigo = '';
    let alteracaoDadoNovo = '';
    let alteracaoFotosVerificadas = '';
    let observacoes = '';

    if (action === 'send_request') {
      cpf = d.cpf || '';
      tipo = d.tipo || '';
      observacoes = d.observacoes || '';
      const tipoKey = canonicalizeTypeKey(tipo);

      if (tipoKey === 'exclusao de conta' && d.exclusao) {
        const ex = d.exclusao || {};
        excluirVelotax = ex.excluirVelotax ? '1' : '0';
        excluirCelcoin = ex.excluirCelcoin ? '1' : '0';
        saldoZerado = ex.saldoZerado ? '1' : '0';
        portabilidadePendente = ex.portabilidadePendente ? '1' : '0';
        dividaIrpfQuitada = ex.dividaIrpfQuitada ? '1' : '0';
        const partes = [];
        if (ex.excluirVelotax) partes.push('Velotax');
        if (ex.excluirCelcoin) partes.push('Celcoin');
        const destinos = partes.length ? ` (${partes.join(', ')})` : '';
        const flags = [];
        if (ex.saldoZerado) flags.push('saldo zerado');
        if (ex.portabilidadePendente) flags.push('portabilidade pendente');
        if (ex.dividaIrpfQuitada) flags.push('IRPF quitada');
        const extras = flags.length ? ` — ${flags.join(' · ')}` : '';
        assuntoDetalhado = `${cpf} — Exclusão de Conta${destinos}${extras}`;
      }

      if (tipoKey === 'alteracao de dados cadastrais' && d.alteracao) {
        const al = d.alteracao || {};
        alteracaoCampo = al.infoTipo || '';
        alteracaoDadoAntigo = al.dadoAntigo || '';
        alteracaoDadoNovo = al.dadoNovo || '';
        alteracaoFotosVerificadas = al.fotosVerificadas ? '1' : '0';
        const fotos = al.fotosVerificadas ? 'com fotos verificadas' : 'sem fotos verificadas';
        assuntoDetalhado = `${cpf} — Alteração de ${alteracaoCampo || 'Dado'}: "${alteracaoDadoAntigo || '—'}" -> "${alteracaoDadoNovo || '—'}" (${fotos})`;
      }

      if (!assuntoDetalhado) {
        assuntoDetalhado = `${cpf || (d.cpf || 'CPF')} — ${tipo || (d.tipo || 'Tipo')} enviado`;
      }
    }

    const created = new Date(r.createdAt).toLocaleString('pt-BR');
    const ip = r.ip || '';
    return [
      created,
      r.userEmail || '',
      r.action || '',
      ip,
      cpf,
      tipo,
      assuntoDetalhado,
      excluirVelotax,
      excluirCelcoin,
      saldoZerado,
      portabilidadePendente,
      dividaIrpfQuitada,
      alteracaoCampo,
      alteracaoDadoAntigo,
      alteracaoDadoNovo,
      alteracaoFotosVerificadas,
      observacoes,
    ].map(esc).join(',');
  });
  return [headerLine, ...lines].join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const limit = Math.min(parseInt(req.query.limit || '1000', 10) || 1000, 5000);
    const list = await prisma.usageLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit });

    // default CSV export
    const csv = toCSV(list);
    const filename = `logs_${new Date().toISOString().slice(0,10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send('\uFEFF' + csv); // BOM for Excel compatibility
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
