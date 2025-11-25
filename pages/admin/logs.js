import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';

// Carregar componentes de gráfico apenas no cliente
const Bar = dynamic(() => import('react-chartjs-2').then((m) => m.Bar), { ssr: false });
const Line = dynamic(() => import('react-chartjs-2').then((m) => m.Line), { ssr: false });

function normalizeName(s) {
  try {
    return String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ') // remove pontuação
      .replace(/\s+/g, ' ') // espaços múltiplos
      .trim();
  } catch {
    return String(s || '').toLowerCase().trim();
  }
}

// Unificação de tipos (ex.: "exclui de conta" -> "Exclusão de Conta")
function canonicalizeTypeKey(raw) {
  const norm = normalizeName(raw || 'outro') || 'outro';
  if ((norm.includes('exclui') || norm.includes('excluir') || norm.includes('exclusao')) && norm.includes('conta')) {
    return 'exclusao de conta';
  }
  if (norm.includes('alteracao') && (norm.includes('dado') || norm.includes('cadastra'))) {
    return 'alteracao de dados cadastrais';
  }
  if (norm.includes('erro') || norm.includes('bug')) {
    return 'erro bug';
  }
  return norm;
}

function canonicalizeTypeLabel(raw) {
  const norm = normalizeName(raw || 'outro') || 'outro';
  if ((norm.includes('exclui') || norm.includes('excluir') || norm.includes('exclusao')) && norm.includes('conta')) {
    return 'Exclusão de Conta';
  }
  if (norm.includes('alteracao') && (norm.includes('dado') || norm.includes('cadastra'))) {
    return 'Alteração de Dados Cadastrais';
  }
  if (norm.includes('erro') || norm.includes('bug')) {
    return 'Erro/Bug';
  }
  return raw || 'Outro';
}

function isTestString(s) {
  const v = String(s || '').toLowerCase();
  return v.includes('teste') || v.includes('test') || v.includes('debug') || v.includes('check') || v.includes('sqse') || v.includes('sqsa');
}

function isTestRequest(r) {
  return isTestString(r?.tipo) || isTestString(r?.agente) || isTestString(r?.payload?.descricao);
}

// Unificação de nomes semelhantes, exceto Laura (separa por duas primeiras palavras)
function canonicalizeAgentKey(raw) {
  const norm = normalizeName(raw || '—') || '—';
  const parts = norm.split(' ').filter(Boolean);
  if (parts[0] === 'laura') {
    const second = parts[1] || '';
    if (second === 'g' || second === 'guedes') return 'laura guedes';
    return parts.slice(0, 2).join(' ') || 'laura';
  }
  // Demais nomes: usar apenas primeiro token para agrupar variações (ex.: "joao", "joao s")
  return parts[0] || norm;
}

function formatItem(log) {
  const a = log.action;
  const d = log.detail || {};
  if (a === 'auto_status_done') {
    return { icon: '✅', text: `${d.cpf || 'CPF'} — ${d.tipo || 'Tipo'} marcado via reação` };
  }
  if (a === 'auto_status_not_done') {
    return { icon: '❌', text: `${d.cpf || 'CPF'} — ${d.tipo || 'Tipo'} marcado como não feito via reação` };
  }
  if (a === 'status_update') {
    const st = d.status || '';
    if (st === 'feito') return { icon: '✅', text: `${d.cpf || 'CPF'} — ${d.tipo || 'Tipo'}` };
    if (st === 'não feito') return { icon: '❌', text: `${d.cpf || 'CPF'} — ${d.tipo || 'Tipo'}` };
    return { icon: 'ℹ️', text: `${d.cpf || 'CPF'} — ${d.tipo || 'Tipo'} (status: ${st})` };
  }
  if (a === 'send_request') {
    const tipo = d.tipo || 'Tipo';
    const cpf = d.cpf || 'CPF';
    const tipoKey = canonicalizeTypeKey(tipo);

    if (tipoKey === 'exclusao de conta' && d.exclusao) {
      const ex = d.exclusao || {};
      const partes = [];
      if (ex.excluirVelotax) partes.push('Velotax');
      if (ex.excluirCelcoin) partes.push('Celcoin');
      const destinos = partes.length ? ` (${partes.join(', ')})` : '';
      const flags = [];
      if (ex.saldoZerado) flags.push('saldo zerado');
      if (ex.portabilidadePendente) flags.push('portabilidade pendente');
      if (ex.dividaIrpfQuitada) flags.push('IRPF quitada');
      const extras = flags.length ? ` — ${flags.join(' · ')}` : '';
      return {
        icon: '🗑️',
        text: `${cpf} — Exclusão de Conta${destinos}${extras}`,
      };
    }

    if (tipoKey === 'alteracao de dados cadastrais' && d.alteracao) {
      const al = d.alteracao || {};
      const campo = al.infoTipo || 'Dado';
      const antigo = al.dadoAntigo || '—';
      const novo = al.dadoNovo || '—';
      const fotos = al.fotosVerificadas ? 'com fotos verificadas' : 'sem fotos verificadas';
      return {
        icon: '✏️',
        text: `${cpf} — Alteração de ${campo}: "${antigo}" → "${novo}" (${fotos})`,
      };
    }

    return { icon: '📨', text: `${cpf} — ${tipo} enviado` };
  }
  if (a === 'send_request' && tipo?.includes('Erro/Bug')) {
    return { icon: '🐞', text: `${cpf} — ${tipo} enviado` };
  }
  return { icon: '📝', text: a };
}

// Componente de cabeçalho ordenável
const SortableHeader = ({ children, onSort, sortKey, currentSort }) => {
  const isSorted = currentSort.key === sortKey;
  const direction = isSorted ? currentSort.direction : null;
  
  return (
    <th 
      className="px-4 py-2 text-left text-xs font-medium text-black/70 uppercase tracking-wider cursor-pointer hover:bg-black/5 transition-colors"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        <span>{children}</span>
        {isSorted && (
          <span className="text-blue-600">
            {direction === 'asc' ? '↑' : '↓'}
          </span>
        )}
        {!isSorted && (
          <span className="text-black/30">↕</span>
        )}
      </div>
    </th>
  );
};

// Função para renderizar tabela específica para cada tipo
function renderTableForType(tipoKey, data, allRequests, onSort, sortConfig) {
  if (tipoKey === 'exclusao de conta') {
    // Aplicar ordenação aos dados
    let sortedData = [...data];
    if (sortConfig.key) {
      sortedData.sort((a, b) => {
        const aDetail = a?.detail || {};
        const bDetail = b?.detail || {};
        
        let aValue, bValue;
        
        switch (sortConfig.key) {
          case 'createdAt':
            aValue = new Date(a.createdAt || 0);
            bValue = new Date(b.createdAt || 0);
            break;
          case 'cpf':
            aValue = aDetail.cpf || '';
            bValue = bDetail.cpf || '';
            break;
          case 'excluirVelotax':
            aValue = aDetail.exclusao?.excluirVelotax ? 1 : 0;
            bValue = bDetail.exclusao?.excluirVelotax ? 1 : 0;
            break;
          case 'excluirCelcoin':
            aValue = aDetail.exclusao?.excluirCelcoin ? 1 : 0;
            bValue = bDetail.exclusao?.excluirCelcoin ? 1 : 0;
            break;
          case 'saldoZerado':
            aValue = aDetail.exclusao?.saldoZerado ? 1 : 0;
            bValue = bDetail.exclusao?.saldoZerado ? 1 : 0;
            break;
          case 'portabilidadePendente':
            aValue = aDetail.exclusao?.portabilidadePendente ? 1 : 0;
            bValue = bDetail.exclusao?.portabilidadePendente ? 1 : 0;
            break;
          case 'dividaIrpfQuitada':
            aValue = aDetail.exclusao?.dividaIrpfQuitada ? 1 : 0;
            bValue = bDetail.exclusao?.dividaIrpfQuitada ? 1 : 0;
            break;
          default:
            aValue = a.createdAt || '';
            bValue = b.createdAt || '';
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-black/10">
          <thead className="bg-black/5">
            <tr>
              <SortableHeader onSort={onSort} sortKey="createdAt" currentSort={sortConfig}>Data/Hora</SortableHeader>
              <SortableHeader onSort={onSort} sortKey="cpf" currentSort={sortConfig}>CPF</SortableHeader>
              <SortableHeader onSort={onSort} sortKey="excluirVelotax" currentSort={sortConfig}>Velotax</SortableHeader>
              <SortableHeader onSort={onSort} sortKey="excluirCelcoin" currentSort={sortConfig}>Celcoin</SortableHeader>
              <SortableHeader onSort={onSort} sortKey="saldoZerado" currentSort={sortConfig}>Saldo Zerado</SortableHeader>
              <SortableHeader onSort={onSort} sortKey="portabilidadePendente" currentSort={sortConfig}>Portabilidade</SortableHeader>
              <SortableHeader onSort={onSort} sortKey="dividaIrpfQuitada" currentSort={sortConfig}>IRPF Quitado</SortableHeader>
              <th className="px-4 py-2 text-left text-xs font-medium text-black/70 uppercase tracking-wider">Observações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-black/10">
            {sortedData.map((r) => {
              const d = r?.detail || {};
              const ex = d.exclusao || {};
              return (
                <tr key={r.id} className="hover:bg-black/5">
                  <td className="px-4 py-2 text-xs text-black-900">{r.createdAt}</td>
                  <td className="px-4 py-2 text-xs font-medium text-black-900">{d.cpf || '—'}</td>
                  <td className="px-4 py-2 text-xs text-center">
                    {ex.excluirVelotax ? <span className="text-green-600">✓</span> : <span className="text-red-600">✗</span>}
                  </td>
                  <td className="px-4 py-2 text-xs text-center">
                    {ex.excluirCelcoin ? <span className="text-green-600">✓</span> : <span className="text-red-600">✗</span>}
                  </td>
                  <td className="px-4 py-2 text-xs text-center">
                    {ex.saldoZerado ? <span className="text-green-600">✓</span> : <span className="text-red-600">✗</span>}
                  </td>
                  <td className="px-4 py-2 text-xs text-center">
                    {ex.portabilidadePendente ? <span className="text-green-600">✓</span> : <span className="text-red-600">✗</span>}
                  </td>
                  <td className="px-4 py-2 text-xs text-center">
                    {ex.dividaIrpfQuitada ? <span className="text-green-600">✓</span> : <span className="text-red-600">✗</span>}
                  </td>
                  <td className="px-4 py-2 text-xs text-black-600 max-w-xs truncate" title={d.observacoes || ''}>
                    {d.observacoes || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (tipoKey === 'alteracao de dados cadastrais') {
    // Aplicar ordenação aos dados
    let sortedData = [...data];
    if (sortConfig.key) {
      sortedData.sort((a, b) => {
        const aDetail = a?.detail || {};
        const bDetail = b?.detail || {};
        
        let aValue, bValue;
        
        switch (sortConfig.key) {
          case 'createdAt':
            aValue = new Date(a.createdAt || 0);
            bValue = new Date(b.createdAt || 0);
            break;
          case 'cpf':
            aValue = aDetail.cpf || '';
            bValue = bDetail.cpf || '';
            break;
          case 'infoTipo':
            aValue = aDetail.alteracao?.infoTipo || '';
            bValue = bDetail.alteracao?.infoTipo || '';
            break;
          case 'dadoAntigo':
            aValue = aDetail.alteracao?.dadoAntigo || '';
            bValue = bDetail.alteracao?.dadoAntigo || '';
            break;
          case 'dadoNovo':
            aValue = aDetail.alteracao?.dadoNovo || '';
            bValue = bDetail.alteracao?.dadoNovo || '';
            break;
          case 'fotosVerificadas':
            aValue = aDetail.alteracao?.fotosVerificadas ? 1 : 0;
            bValue = bDetail.alteracao?.fotosVerificadas ? 1 : 0;
            break;
          default:
            aValue = a.createdAt || '';
            bValue = b.createdAt || '';
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-black/10">
          <thead className="bg-black/5">
            <tr>
              <SortableHeader onSort={onSort} sortKey="createdAt" currentSort={sortConfig}>Data/Hora</SortableHeader>
              <SortableHeader onSort={onSort} sortKey="cpf" currentSort={sortConfig}>CPF</SortableHeader>
              <SortableHeader onSort={onSort} sortKey="infoTipo" currentSort={sortConfig}>Campo</SortableHeader>
              <SortableHeader onSort={onSort} sortKey="dadoAntigo" currentSort={sortConfig}>Dado Antigo</SortableHeader>
              <SortableHeader onSort={onSort} sortKey="dadoNovo" currentSort={sortConfig}>Dado Novo</SortableHeader>
              <SortableHeader onSort={onSort} sortKey="fotosVerificadas" currentSort={sortConfig}>Fotos Verificadas</SortableHeader>
              <th className="px-4 py-2 text-left text-xs font-medium text-black/70 uppercase tracking-wider">Observações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-black/10">
            {sortedData.map((r) => {
              const d = r?.detail || {};
              const al = d.alteracao || {};
              return (
                <tr key={r.id} className="hover:bg-black/5">
                  <td className="px-4 py-2 text-xs text-black-900">{r.createdAt}</td>
                  <td className="px-4 py-2 text-xs font-medium text-black-900">{d.cpf || '—'}</td>
                  <td className="px-4 py-2 text-xs text-black-900">{al.infoTipo || '—'}</td>
                  <td className="px-4 py-2 text-xs text-black-600 max-w-xs truncate" title={al.dadoAntigo || ''}>
                    {al.dadoAntigo || '—'}
                  </td>
                  <td className="px-4 py-2 text-xs text-black-600 max-w-xs truncate" title={al.dadoNovo || ''}>
                    {al.dadoNovo || '—'}
                  </td>
                  <td className="px-4 py-2 text-xs text-center">
                    {al.fotosVerificadas ? <span className="text-green-600">✓</span> : <span className="text-red-600">✗</span>}
                  </td>
                  <td className="px-4 py-2 text-xs text-black-600 max-w-xs truncate" title={d.observacoes || ''}>
                    {d.observacoes || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (tipoKey === 'erro bug') {
    // Aplicar ordenação aos dados
    let sortedData = [...data];
    if (sortConfig.key) {
      sortedData.sort((a, b) => {
        const aDetail = a?.detail || {};
        const bDetail = b?.detail || {};
        const aRequest = allRequests.find(req => req.waMessageId === aDetail.waMessageId);
        const bRequest = allRequests.find(req => req.waMessageId === bDetail.waMessageId);
        const aPayload = aRequest?.payload || {};
        const bPayload = bRequest?.payload || {};
        
        let aValue, bValue;
        
        switch (sortConfig.key) {
          case 'createdAt':
            aValue = new Date(a.createdAt || 0);
            bValue = new Date(b.createdAt || 0);
            break;
          case 'cpf':
            aValue = aDetail.cpf || '';
            bValue = bDetail.cpf || '';
            break;
          case 'tipo':
            aValue = (aDetail.tipo || '').replace('Erro/Bug - ', '') || '';
            bValue = (bDetail.tipo || '').replace('Erro/Bug - ', '') || '';
            break;
          case 'descricao':
            aValue = aPayload.descricao || '';
            bValue = bPayload.descricao || '';
            break;
          case 'attachments':
            const aImgCount = Array.isArray(aPayload.previews) ? aPayload.previews.length : (Array.isArray(aPayload.imagens) ? aPayload.imagens.length : 0);
            const aVideoCount = Array.isArray(aPayload.videos) ? aPayload.videos.length : 0;
            const bImgCount = Array.isArray(bPayload.previews) ? bPayload.previews.length : (Array.isArray(bPayload.imagens) ? bPayload.imagens.length : 0);
            const bVideoCount = Array.isArray(bPayload.videos) ? bPayload.videos.length : 0;
            aValue = aImgCount + aVideoCount;
            bValue = bImgCount + bVideoCount;
            break;
          default:
            aValue = a.createdAt || '';
            bValue = b.createdAt || '';
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-black/10">
          <thead className="bg-black/5">
            <tr>
              <SortableHeader onSort={onSort} sortKey="createdAt" currentSort={sortConfig}>Data/Hora</SortableHeader>
              <SortableHeader onSort={onSort} sortKey="cpf" currentSort={sortConfig}>CPF</SortableHeader>
              <SortableHeader onSort={onSort} sortKey="tipo" currentSort={sortConfig}>Tipo</SortableHeader>
              <SortableHeader onSort={onSort} sortKey="descricao" currentSort={sortConfig}>Descrição</SortableHeader>
              <SortableHeader onSort={onSort} sortKey="attachments" currentSort={sortConfig}>Anexos</SortableHeader>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-black/10">
            {sortedData.map((r) => {
              const d = r?.detail || {};
              // Buscar o request completo para obter os detalhes do erro/bug
              const request = allRequests.find(req => req.waMessageId === d.waMessageId);
              const payload = request?.payload || {};
              const imgCount = Array.isArray(payload.previews) ? payload.previews.length : (Array.isArray(payload.imagens) ? payload.imagens.length : 0);
              const videoCount = Array.isArray(payload.videos) ? payload.videos.length : 0;
              const totalAttachments = imgCount + videoCount;
              
              return (
                <tr key={r.id} className="hover:bg-black/5">
                  <td className="px-4 py-2 text-xs text-black-900">{r.createdAt}</td>
                  <td className="px-4 py-2 text-xs font-medium text-black-900">{d.cpf || '—'}</td>
                  <td className="px-4 py-2 text-xs text-black-900">{(d.tipo || '').replace('Erro/Bug - ', '') || '—'}</td>
                  <td className="px-4 py-2 text-xs text-black-600 max-w-xs truncate" title={payload.descricao || 'Sem descrição'}>
                    {payload.descricao?.substring(0, 100) || 'Sem descrição'}{payload.descricao?.length > 100 ? '...' : ''}
                  </td>
                  <td className="px-4 py-2 text-xs text-center">
                    {totalAttachments > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="text-blue-600">📎</span>
                        <span className="text-xs text-black-600">
                          {imgCount > 0 && `${imgCount} img`}{imgCount > 0 && videoCount > 0 ? ' + ' : ''}{videoCount > 0 ? `${videoCount} vid` : ''}
                        </span>
                      </span>
                    ) : (
                      <span className="text-black/40">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Tabela padrão para outros tipos
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-black/10">
        <thead className="bg-black/5">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-black/70 uppercase tracking-wider">Data/Hora</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-black/70 uppercase tracking-wider">CPF</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-black/70 uppercase tracking-wider">Tipo</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-black/70 uppercase tracking-wider">Detalhes</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-black/10">
          {data.map((r) => {
            const d = r?.detail || {};
            return (
              <tr key={r.id} className="hover:bg-black/5">
                <td className="px-4 py-2 text-xs text-black-900">{r.createdAt}</td>
                <td className="px-4 py-2 text-xs font-medium text-black-900">{d.cpf || '—'}</td>
                <td className="px-4 py-2 text-xs text-black-900">{d.tipo || '—'}</td>
                <td className="px-4 py-2 text-xs text-black-600 max-w-xs truncate" title={r.text || ''}>
                  {r.text || '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminLogs() {
  const [chartsReady, setChartsReady] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [searchCpf, setSearchCpf] = useState('');
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [hourDay, setHourDay] = useState(''); // seletor do dia para gráfico por hora
  const [activeTab, setActiveTab] = useState('todos'); // abas de resumo
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' }); // configuração de ordenação

  // Helpers: chips rápidos de período
  const dateToInputStr = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const setQuickRange = (key) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (key === 'today') {
      const s = dateToInputStr(today);
      setDateFrom(s); setDateTo(s);
      return;
    }
    if (key === 'week') {
      const day = today.getDay(); // 0=Dom, 1=Seg
      const diffToMonday = (day + 6) % 7; // transforma: Seg=0, Dom=6
      const monday = new Date(today); monday.setDate(today.getDate() - diffToMonday);
      setDateFrom(dateToInputStr(monday)); setDateTo(dateToInputStr(today));
      return;
    }
    if (key === 'month') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      setDateFrom(dateToInputStr(first)); setDateTo(dateToInputStr(today));
      return;
    }
  };

  // Função para lidar com ordenação
  const handleSort = (key) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        // Se já está ordenando pela mesma chave, inverte a direção
        return { key, direction: prevConfig.direction === 'asc' ? 'desc' : 'asc' };
      }
      // Senão, ordena pela nova chave em ordem ascendente
      return { key, direction: 'asc' };
    });
  };

  useEffect(() => {
    // Registrar ChartJS somente no cliente para evitar divergência de hidratação
    try {
      ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);
    } catch {}
    setChartsReady(true);
    const cached = localStorage.getItem('velotax_logs');
    if (cached) {
      try { setItems(JSON.parse(cached)); } catch {}
    }
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/logs?limit=2000&nocache=1');
        let data = [];
        try { data = await res.json(); } catch {}
        if (!Array.isArray(data)) data = [];
        setItems(data);
        try { localStorage.setItem('velotax_logs', JSON.stringify(data)); } catch {}
        try {
          const rres = await fetch('/api/requests');
          let rdata = [];
          try { rdata = await rres.json(); } catch {}
          if (!Array.isArray(rdata)) rdata = [];
          setRequests(rdata);
          try { localStorage.setItem('velotax_requests', JSON.stringify(rdata)); } catch {}
        } catch {}
      } catch {}
      setLoading(false);
    };
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const rows = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    return list
      .filter((l) => {
        const d = l?.detail || {};
        // remover eventos de teste visuais
        return !(isTestString(d?.tipo) || isTestString(d?.agente));
      })
      .map((l) => {
        const base = formatItem(l);
        const tipo = l?.detail?.tipo || '';
        const tipoKey = canonicalizeTypeKey(tipo);
        return {
          id: l.id,
          createdAt: new Date(l.createdAt).toLocaleString(),
          tipoKey,
          action: l.action,
          raw: l,
          ...base,
        };
      });
  }, [items]);

  const filteredRowsByTab = useMemo(() => {
    if (activeTab === 'todos') return rows;
    if (activeTab === 'exclusao') {
      return rows.filter((r) => r.action === 'send_request' && r.tipoKey === 'exclusao de conta');
    }
    if (activeTab === 'alteracao') {
      return rows.filter((r) => r.action === 'send_request' && r.tipoKey === 'alteracao de dados cadastrais');
    }
    if (activeTab === 'erros') {
      return rows.filter((r) => r.action === 'send_request' && r.tipoKey === 'erro bug');
    }
    return rows;
  }, [rows, activeTab]);

  const agentGroups = useMemo(() => {
    const list = (Array.isArray(requests) ? requests : []).filter((r) => !isTestRequest(r));
    const map = {};
    for (const r of list) {
      const raw = r?.agente || '—';
      const key = canonicalizeAgentKey(raw) || '—';
      if (!map[key]) map[key] = { key, label: raw, count: 0 };
      map[key].count += 1;
      // opcional: escolha label mais "bonita" pela maior frequência
      // (mantemos primeira ocorrência para simplicidade)
    }
    return map;
  }, [requests]);

  const allAgents = useMemo(() => {
    return Object.values(agentGroups).sort((a, b) => a.label.localeCompare(b.label));
  }, [agentGroups]);

  const typeGroups = useMemo(() => {
    const list = (Array.isArray(requests) ? requests : []).filter((r) => !isTestRequest(r));
    const map = {};
    for (const r of list) {
      const raw = r?.tipo || 'Outro';
      const key = canonicalizeTypeKey(raw) || 'outro';
      const label = canonicalizeTypeLabel(raw);
      if (!map[key]) map[key] = { key, label, count: 0 };
      map[key].count += 1;
    }
    return map;
  }, [requests]);

  const allTypes = useMemo(() => {
    return Object.values(typeGroups).sort((a, b) => a.label.localeCompare(b.label));
  }, [typeGroups]);

  const filteredRequests = useMemo(() => {
    const list = (Array.isArray(requests) ? requests : []).filter((r) => !isTestRequest(r));
    const fromTs = dateFrom ? new Date(dateFrom + 'T00:00:00').getTime() : null;
    const toTs = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : null;
    return list.filter((r) => {
      const agente = canonicalizeAgentKey(r?.agente || '—') || '—';
      const tipo = canonicalizeTypeKey(r?.tipo || 'Outro') || 'outro';
      const ts = r?.createdAt ? new Date(r.createdAt).getTime() : 0;
      if (selectedAgents.length && !selectedAgents.includes(agente)) return false;
      if (selectedTypes.length && !selectedTypes.includes(tipo)) return false;
      if (fromTs && ts < fromTs) return false;
      if (toTs && ts > toTs) return false;
      return true;
    });
  }, [requests, selectedAgents, selectedTypes, dateFrom, dateTo]);

  const chartData = useMemo(() => {
    const list = filteredRequests;
    // filtrar por dia específico para o gráfico por hora, se selecionado
    const toYmd = (d) => {
      try {
        const dt = new Date(d);
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const dd = String(dt.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      } catch { return ''; }
    };
    const dayYmd = hourDay ? String(hourDay) : null; // input já vem em YYYY-MM-DD
    const listForHour = dayYmd ? list.filter((r) => toYmd(r?.createdAt || 0) === dayYmd) : list;
    const byType = {};
    const byAgent = {};
    const byHour = Array.from({ length: 24 }, () => 0);
    for (const r of list) {
      const tipoKey = canonicalizeTypeKey(r?.tipo || 'Outro') || 'outro';
      const agentKey = canonicalizeAgentKey(r?.agente || '—') || '—';
      byType[tipoKey] = (byType[tipoKey] || 0) + 1;
      byAgent[agentKey] = (byAgent[agentKey] || 0) + 1;
    }
    for (const r of listForHour) {
      const h = new Date(r?.createdAt).getHours?.() ?? new Date(r?.createdAt).getHours();
      if (Number.isFinite(h) && h >= 0 && h < 24) byHour[h] += 1;
    }
    const typeEntries = Object.keys(byType).map((k) => ({ key: k, label: typeGroups[k]?.label || k, value: byType[k] }));
    const agentEntries = Object.keys(byAgent).map((k) => ({ key: k, label: agentGroups[k]?.label || k, value: byAgent[k] }));
    const typeLabels = typeEntries.map((e) => e.label);
    const typeValues = typeEntries.map((e) => e.value);
    const agentLabels = agentEntries.map((e) => e.label);
    const agentValues = agentEntries.map((e) => e.value);
    const hourLabels = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    return {
      byType: { labels: typeLabels, datasets: [{ label: 'Solicitações por tipo', data: typeValues, backgroundColor: 'rgba(59,130,246,0.6)' }] },
      byAgent: { labels: agentLabels, datasets: [{ label: 'Solicitações por agente', data: agentValues, backgroundColor: 'rgba(34,197,94,0.6)' }] },
      byHour: { labels: hourLabels, datasets: [{ label: 'Solicitações por hora', data: byHour, borderColor: 'rgba(234,88,12,1)', backgroundColor: 'rgba(234,88,12,0.2)', pointRadius: 3, pointHoverRadius: 6 }] },
    };
  }, [filteredRequests]);

  return (
    <div className="min-h-screen container-pad py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="titulo-principal">Logs</h1>
        <div className="flex items-center gap-2">
          {/* Build export URL with current filters */}
          {(() => {
            const params = new URLSearchParams();
            if (dateFrom) params.set('dateFrom', dateFrom);
            if (dateTo) params.set('dateTo', dateTo);
            if (hourDay) params.set('hourDay', hourDay);
            if (selectedAgents.length) {
              const labels = selectedAgents.map((k) => (agentGroups[k]?.label || k));
              params.set('agents', labels.join(','));
            }
            if (selectedTypes.length) {
              const labels = selectedTypes.map((k) => (typeGroups[k]?.label || k));
              params.set('types', labels.join(','));
            }
            const xlsxUrl = `/api/logs/export.xlsx?${params.toString()}`;
            return (
              <a href={xlsxUrl} target="_blank" rel="noopener" className="text-sm px-3 py-2 rounded border hover:opacity-90">Baixar XLSX (com gráficos)</a>
            );
          })()}
          <a href="/api/logs/export" target="_blank" rel="noopener" className="text-sm px-3 py-2 rounded border hover:opacity-90">Baixar CSV</a>
        </div>
      </div>
      <div className="mb-3 text-sm text-black/70">{loading ? 'Atualizando…' : 'Atualizado'}</div>

      {/* Abas de assunto para detalhamento de solicitações */}
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <button
          type="button"
          onClick={() => setActiveTab('todos')}
          className={`px-3 py-1.5 rounded-full border ${activeTab === 'todos' ? 'bg-black text-white' : 'bg-white text-black/80'}`}
        >
          Todos os eventos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('exclusao')}
          className={`px-3 py-1.5 rounded-full border ${activeTab === 'exclusao' ? 'bg-black text-white' : 'bg-white text-black/80'}`}
        >
          Exclusão de Conta
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('alteracao')}
          className={`px-3 py-1.5 rounded-full border ${activeTab === 'alteracao' ? 'bg-black text-white' : 'bg-white text-black/80'}`}
        >
          Alteração Cadastral
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('erros')}
          className={`px-3 py-1.5 rounded-full border ${activeTab === 'erros' ? 'bg-black text-white' : 'bg-white text-black/80'}`}
        >
          Erros/Bugs
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('consolidado')}
          className={`px-3 py-1.5 rounded-full border ${activeTab === 'consolidado' ? 'bg-black text-white' : 'bg-white text-black/80'}`}
        >
          Dados Consolidados
        </button>
      </div>
      <div className="p-4 bg-white rounded border border-black/10 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm mb-1">Pesquisar CPF</label>
            <input value={searchCpf} onChange={(e) => setSearchCpf(e.target.value)} placeholder="Digite o CPF" className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm mb-1">De (data)</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm mb-1">Até (data)</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full border rounded px-2 py-1" />
          </div>
          <div className="md:col-span-1"></div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-sm text-black/60">Período rápido:</span>
          <button type="button" onClick={() => setQuickRange('today')} className="text-xs px-2 py-1 rounded border hover:opacity-90">Hoje</button>
          <button type="button" onClick={() => setQuickRange('week')} className="text-xs px-2 py-1 rounded border hover:opacity-90">Semana</button>
          <button type="button" onClick={() => setQuickRange('month')} className="text-xs px-2 py-1 rounded border hover:opacity-90">Mês</button>
          {(dateFrom || dateTo) && (
            <button type="button" onClick={() => { setDateFrom(''); setDateTo(''); }} className="ml-2 text-xs px-2 py-1 rounded border hover:opacity-90">Limpar</button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <div>
            <div className="text-sm mb-1">Agentes</div>
            <div className="flex flex-wrap gap-2">
              {allAgents.map((a) => (
                <label key={a.key} className="flex items-center gap-1 text-sm border rounded px-2 py-1">
                  <input type="checkbox" checked={selectedAgents.includes(a.key)} onChange={(e) => {
                    setSelectedAgents((prev) => e.target.checked ? [...prev, a.key] : prev.filter((x) => x !== a.key));
                  }} />
                  <span>{a.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm mb-1">Tipos</div>
            <div className="flex flex-wrap gap-2">
              {allTypes.map((t) => (
                <label key={t.key} className="flex items-center gap-1 text-sm border rounded px-2 py-1">
                  <input type="checkbox" checked={selectedTypes.includes(t.key)} onChange={(e) => {
                    setSelectedTypes((prev) => e.target.checked ? [...prev, t.key] : prev.filter((x) => x !== t.key));
                  }} />
                  <span>{t.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-4 bg-white rounded border border-black/10">
          <div className="font-medium mb-2">Solicitações por tipo</div>
          {chartsReady && (
            <Bar data={chartData.byType} options={{ responsive: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y} solicitações` } } } }} />
          )}
        </div>
        <div className="p-4 bg-white rounded border border-black/10">
          <div className="font-medium mb-2">Solicitações por agente</div>
          {chartsReady && (
            <Bar data={chartData.byAgent} options={{ responsive: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y} solicitações` } } } }} />
          )}
        </div>
        <div className="p-4 bg-white rounded border border-black/10 md:col-span-2">
          <div className="font-medium mb-2 flex items-center justify-between gap-3">
            <span>Solicitações por hora</span>
            <div className="flex items-center gap-2 text-sm">
              <label className="opacity-80">Dia:</label>
              <input type="date" value={hourDay} onChange={(e)=>setHourDay(e.target.value)} className="border rounded px-2 py-1" />
              {hourDay && (
                <button type="button" onClick={()=>setHourDay('')} className="text-xs px-2 py-1 rounded border">Limpar</button>
              )}
            </div>
          </div>
          {chartsReady && (
            <Line data={chartData.byHour} options={{ responsive: true, interaction: { intersect: false, mode: 'nearest' }, plugins: { legend: { display: false }, tooltip: { callbacks: { title: (items) => items.length ? `Hora ${items[0].label}:00` : '', label: (ctx) => `${ctx.parsed.y} solicitações` } } } }} />
          )}
        </div>
      </div>

      {loading && (
        <div className="mb-6 space-y-2">
          <div className="h-3 rounded bg-black/10 animate-pulse" />
          <div className="h-3 rounded bg-black/10 animate-pulse w-2/3" />
          <div className="h-3 rounded bg-black/10 animate-pulse w-1/3" />
        </div>
      )}
      {searchCpf && (
        <div className="p-4 bg-white rounded border border-black/10 mb-6">
          <div className="font-medium mb-2">Resultados para CPF: {searchCpf}</div>
          <div className="text-sm text-black/60 mb-2">{filteredRequests.filter((r) => !isTestRequest(r) && String(r?.cpf || '').includes(searchCpf.replace(/\D/g, ''))).length} registro(s) encontrado(s)</div>
          <div className="space-y-2 max-h-72 overflow-auto">
            {filteredRequests.filter((r) => !isTestRequest(r) && String(r?.cpf || '').includes(searchCpf.replace(/\D/g, ''))).map((r) => (
              <div key={r.id} className="p-3 bg-white rounded border border-black/10 flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.tipo} — {r.cpf}</div>
                  <div className="text-xs text-black/60">Agente: {r.agente || '—'} • Status: {r.status || '—'}</div>
                </div>
                <div className="text-xs text-black/60">{new Date(r.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="space-y-2">
        {activeTab === 'consolidado' ? (
          // Aba consolidada - renderiza todas as solicitações em uma única tabela
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-black/10">
              <thead className="bg-black/5">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-black/70 uppercase tracking-wider">Data/Hora</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-black/70 uppercase tracking-wider">CPF</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-black/70 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-black/70 uppercase tracking-wider">Agente</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-black/70 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-black/70 uppercase tracking-wider">Detalhes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-black/10">
                {filteredRowsByTab.map((r) => {
                  const d = r?.detail || {};
                  const request = requests.find(req => req.waMessageId === d.waMessageId) || {};
                  return (
                    <tr key={r.id} className="hover:bg-black/5">
                      <td className="px-4 py-2 text-xs text-black-900">{r.createdAt}</td>
                      <td className="px-4 py-2 text-xs font-medium text-black-900">{d.cpf || '—'}</td>
                      <td className="px-4 py-2 text-xs text-black-900">{d.tipo || '—'}</td>
                      <td className="px-4 py-2 text-xs text-black-900">{request.agente || '—'}</td>
                      <td className="px-4 py-2 text-xs text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          request.status === 'feito' ? 'bg-emerald-100 text-emerald-700' : 
                          request.status === 'não feito' ? 'bg-red-100 text-red-700' : 
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {request.status || 'em aberto'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-black-600 max-w-xs truncate" title={r.text || ''}>
                        {r.text || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          // Abas específicas - renderiza tabela personalizada para cada tipo
          (() => {
            const tabData = filteredRowsByTab.filter(r => r.action === 'send_request');
            const tabType = activeTab === 'exclusao' ? 'exclusao de conta' : 
                           activeTab === 'alteracao' ? 'alteracao de dados cadastrais' : 
                           activeTab === 'erros' ? 'erro bug' : null;
            return tabType ? renderTableForType(tabType, tabData, requests, handleSort, sortConfig) : (
              <div className="space-y-2">
                {filteredRowsByTab.map((r) => (
                  <div key={r.id} className="p-3 bg-white rounded border border-black/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{r.icon}</span>
                      <span>{r.text}</span>
                    </div>
                    <div className="text-xs text-black/60">{r.createdAt}</div>
                  </div>
                ))}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
