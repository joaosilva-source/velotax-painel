// components/FormSolicitacao.jsx
import { useState } from "react";
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
    observacoes: "",
  });
  const [loading, setLoading] = useState(false);

  const atualizar = (campo, valor) => setForm(prev => ({ ...prev, [campo]: valor }));

  const montarMensagem = () => {
    const simNao = v => (v ? "✅ Sim" : "❌ Não");
    let msg = `*Nova Solicitação Técnica - ${form.tipo}*\n\n`;
    msg += `Agente: ${form.agente}\nCPF: ${form.cpf}\n\n`;

    if (form.tipo === "Exclusão de Conta") {
      msg += `Excluir conta Velotax: ${simNao(form.excluirVelotax)}\n`;
      msg += `Excluir conta Celcoin: ${simNao(form.excluirCelcoin)}\n`;
      msg += `Conta com saldo zerado: ${simNao(form.saldoZerado)}\n`;
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
          <label className="flex items-center gap-2 mt-2"><input className="check-anim" type="checkbox" checked={form.saldoZerado} onChange={(e) => atualizar("saldoZerado", e.target.checked)} /> Conta com saldo zerado</label>
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
    </form>
  );
}


