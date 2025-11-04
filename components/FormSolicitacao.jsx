// components/FormSolicitacao.jsx
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function FormSolicitacao({ registrarLog }) {
  const [form, setForm] = useState({
    agente: "",
    cpf: "",
    tipo: "Alteração de Dados Cadastrais",
    infoTipo: "",
    dadoAntigo: "",
    dadoNovo: "",
    fotosVerificadas: false,
    excluirVelotax: false,
    excluirCelcoin: false,
    saldoZerado: false,
    portabilidadePendente: false,
    dividaIrpfQuitada: false,
    observacoes: "",
  });
  const [loading, setLoading] = useState(false);
  const [localLogs, setLocalLogs] = useState([]); // {cpf, tipo, waMessageId, status, createdAt}

  // carregar cache inicial
  useEffect(() => {
    try {
      const cached = localStorage.getItem('velotax_local_logs');
      if (cached) setLocalLogs(JSON.parse(cached));
    } catch {}
  }, []);

  // util: salvar cache
  const saveCache = (items) => {
    setLocalLogs(items);
    try { localStorage.setItem('velotax_local_logs', JSON.stringify(items)); } catch {}
  };

  // função para buscar status atualizados agora
  const refreshNow = async () => {
    if (!localLogs.length) return;
    try {
      const res = await fetch('/api/requests');
      if (!res.ok) return;
      const all = await res.json();
      const updated = localLogs.map(item => {
        const match = item.waMessageId
          ? all.find(r => r.waMessageId === item.waMessageId)
          : all.find(r => r.cpf === item.cpf && r.tipo === item.tipo);
        return match ? { ...item, status: match.status } : item;
      });
      saveCache(updated);
    } catch {}
  };

  // refresh de status a cada 20s buscando no servidor
  useEffect(() => {
    const refresh = async () => {
      if (!localLogs.length) return;
      try {
        const res = await fetch('/api/requests');
        if (!res.ok) return;
        const all = await res.json();
        const updated = localLogs.map(item => {
          // preferir match por waMessageId; fallback por cpf+tipo
          const match = item.waMessageId
            ? all.find(r => r.waMessageId === item.waMessageId)
            : all.find(r => r.cpf === item.cpf && r.tipo === item.tipo);
          return match ? { ...item, status: match.status } : item;
        });
        saveCache(updated);
      } catch {}
    };
    refresh();
    const id = setInterval(refresh, 20000);
    return () => clearInterval(id);
  }, [localLogs.length]);

  const atualizar = (campo, valor) => setForm(prev => ({ ...prev, [campo]: valor }));

  const montarMensagem = () => {
    const simNao = v => (v ? "✅ Sim" : "❌ Não");
    let msg = `*Nova Solicitação Técnica - ${form.tipo}*\n\n`;
    msg += `Agente: ${form.agente}\nCPF: ${form.cpf}\n\n`;

    if (form.tipo === "Exclusão de Conta") {
      msg += `Excluir conta Velotax: ${simNao(form.excluirVelotax)}\n`;
      msg += `Excluir conta Celcoin: ${simNao(form.excluirCelcoin)}\n`;
      msg += `Conta zerada: ${simNao(form.saldoZerado)}\n`;
      msg += `Portabilidade pendente: ${simNao(form.portabilidadePendente)}\n`;
      msg += `Dívida IRPF quitada: ${simNao(form.dividaIrpfQuitada)}\n`;
      msg += `Observações: ${form.observacoes || "—"}\n`;
    } else if (form.tipo === "Alteração de Dados Cadastrais") {
      msg += `Tipo de informação: ${form.infoTipo}\nDado antigo: ${form.dadoAntigo}\nDado novo: ${form.dadoNovo}\nFotos verificadas: ${simNao(form.fotosVerificadas)}\nObservações: ${form.observacoes || "—"}\n`;
    } else { // Exclusão de Chave PIX e outros
      msg += `Observações: ${form.observacoes || "—"}\n`;
    }
    return msg;
  };

  const enviar = async (e) => {
    e.preventDefault();
    setLoading(true);
    registrarLog("Iniciando envio...");

    const mensagemTexto = montarMensagem();

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const defaultJid = process.env.NEXT_PUBLIC_DEFAULT_JID;

    if (!apiUrl || !defaultJid) {
      toast.error("Erro: API_URL ou JID não configurados.");
      registrarLog("❌ Erro: API_URL ou JID não configurados.");
      setLoading(false);
      return;
    }

    const payload = { jid: defaultJid, mensagem: mensagemTexto };

    try {
      const res = await fetch(apiUrl + "/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        registrarLog("✅ Enviado com sucesso");
        toast.success("Solicitação enviada");

        try {
          let waMessageId = null;
          try {
            const data = await res.json();
            waMessageId = data?.messageId || data?.key?.id || null;
          } catch {}

          const defaultJid = process.env.NEXT_PUBLIC_DEFAULT_JID;
          await fetch('/api/requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agente: form.agente,
              cpf: form.cpf,
              tipo: form.tipo,
              payload: form,
              agentContact: defaultJid || null,
              waMessageId,
            })
          });

          await fetch('/api/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'send_request', detail: { tipo: form.tipo, cpf: form.cpf, waMessageId } })
          });

          // salvar no cache local para o agente acompanhar
          const newItem = {
            cpf: form.cpf,
            tipo: form.tipo,
            waMessageId,
            status: 'em aberto',
            createdAt: new Date().toISOString(),
          };
          saveCache([newItem, ...localLogs].slice(0, 50));
        } catch (e) {
          console.warn('Falha ao salvar request/log', e);
        }
      } else {
        const txt = await res.text();
        registrarLog("❌ Erro da API: " + txt);
        toast.error("Erro ao enviar: " + txt);
      }
    } catch (err) {
      registrarLog("❌ Falha de conexão com a API.");
      toast.error("Falha de conexão. A API está no ar?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={enviar} className="space-y-5">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-white/80">Agente</label>
          <div className="input-wrap">
            <span className="input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z" fill="currentColor"/></svg>
            </span>
            <input className="input input-with-icon" placeholder="Nome do agente" value={form.agente} onChange={(e) => atualizar("agente", e.target.value)} required />
          </div>
        </div>
        <div>
          <label className="text-sm text-white/80">CPF</label>
          <div className="input-wrap">
            <span className="input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2H3V5Zm0 4h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Zm4 3v2h6v-2H7Z" fill="currentColor"/></svg>
            </span>
            <input className="input input-with-icon" placeholder="000.000.000-00" value={form.cpf} onChange={(e) => atualizar("cpf", e.target.value)} required />
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm text-white/80">Tipo de Solicitação</label>
        <div className="input-wrap">
          <span className="input-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5H7z" fill="currentColor"/></svg>
          </span>
          <select className="input input-with-icon" value={form.tipo} onChange={(e) => atualizar("tipo", e.target.value)}>
          <option>Alteração de Dados Cadastrais</option>
          <option>Exclusão de Chave PIX</option>
          <option>Exclusão de Conta</option>
          </select>
        </div>
      </div>

      {form.tipo === "Exclusão de Conta" && (
        <div className="bg-white p-4 rounded-lg mt-2 border border-black/10">
          <label className="flex items-center gap-2"><input className="check-anim" type="checkbox" checked={form.excluirVelotax} onChange={(e) => atualizar("excluirVelotax", e.target.checked)} /> Excluir conta Velotax</label>
          <label className="flex items-center gap-2 mt-2"><input className="check-anim" type="checkbox" checked={form.excluirCelcoin} onChange={(e) => atualizar("excluirCelcoin", e.target.checked)} /> Excluir conta Celcoin</label>
          <label className="flex items-center gap-2 mt-2"><input className="check-anim" type="checkbox" checked={form.saldoZerado} onChange={(e) => atualizar("saldoZerado", e.target.checked)} /> Conta zerada</label>
          <label className="flex items-center gap-2 mt-2"><input className="check-anim" type="checkbox" checked={form.portabilidadePendente} onChange={(e) => atualizar("portabilidadePendente", e.target.checked)} /> Portabilidade pendente</label>
          <label className="flex items-center gap-2 mt-2"><input className="check-anim" type="checkbox" checked={form.dividaIrpfQuitada} onChange={(e) => atualizar("dividaIrpfQuitada", e.target.checked)} /> Dívida IRPF quitada</label>
        </div>
      )}

      {form.tipo === "Alteração de Dados Cadastrais" && (
        <div className="bg-white p-4 rounded-lg mt-2 border border-black/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/80">Tipo de informação</label>
              <input className="input" value={form.infoTipo} onChange={(e) => atualizar("infoTipo", e.target.value)} placeholder="Ex: E-mail"/>
            </div>
            <div className="flex items-center pt-7 gap-2">
              <input type="checkbox" className="w-4 h-4" checked={form.fotosVerificadas} onChange={(e) => atualizar("fotosVerificadas", e.target.checked)} />
              <label className="mb-0">Fotos verificadas</label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-sm text-white/80">Dado antigo</label>
              <input className="input" value={form.dadoAntigo} onChange={(e) => atualizar("dadoAntigo", e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-white/80">Dado novo</label>
              <input className="input" value={form.dadoNovo} onChange={(e) => atualizar("dadoNovo", e.target.value)} />
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="text-sm text-black/80">Observações</label>
        <textarea className="input h-28" placeholder="Adicione observações adicionais..." value={form.observacoes} onChange={(e) => atualizar("observacoes", e.target.value)} />
      </div>

      <div className="flex items-center gap-4">
        <button disabled={loading} className={`btn-primary inline-flex items-center gap-2 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`} type="submit">
          {loading && <span className="spinner" />}
          {loading ? "Enviando..." : "Enviar Solicitação"}
        </button>
        <span className="text-sm text-white/70">Envia para o grupo padrão configurado</span>
      </div>

      {/* Logs de Envio (para o agente acompanhar) */}
      <div className="bg-white/80 backdrop-blur p-4 rounded-xl border border-black/10 mt-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-sky-500 to-emerald-500" />
          <h2 className="text-lg font-semibold">Logs de Envio</h2>
          <button type="button" onClick={refreshNow} className="ml-auto text-sm px-2 py-1 rounded bg-black/5 hover:bg-black/10">Atualizar agora</button>
        </div>
        {(!localLogs || localLogs.length === 0) && (
          <div className="text-black/60">Nenhum log ainda.</div>
        )}
        <div className="space-y-2">
          {localLogs.map((l, idx) => {
            const icon = l.status === 'feito' ? '✅' : (l.status === 'não feito' ? '❌' : '⏳');
            return (
              <div key={idx} className="p-3 bg-white rounded border border-black/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{icon}</span>
                  <span className="text-sm">{l.cpf} — {l.tipo}</span>
                </div>
                <div className="text-xs text-black/60">{new Date(l.createdAt).toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      </div>
    </form>
  );
}


