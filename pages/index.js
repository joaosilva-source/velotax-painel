// pages/index.js
import { useState } from "react";
import FormSolicitacao from "@/components/FormSolicitacao";
import Logs from "@/components/Logs";
import Head from "next/head";

export default function Home() {
  const [logs, setLogs] = useState([]);
  const [searchCpf, setSearchCpf] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const registrarLog = (msg) => {
    setLogs((prev) => [{ msg, time: new Date().toLocaleString("pt-BR") }, ...prev]);
  };

  const buscarCpf = async () => {
    const digits = String(searchCpf || "").replace(/\D/g, "");
    if (!digits) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await fetch('/api/requests');
      if (!res.ok) return;
      const list = await res.json();
      const filtered = Array.isArray(list)
        ? list.filter((r) => String(r?.cpf || '').replace(/\D/g, '').includes(digits))
        : [];
      setSearchResults(filtered);
    } catch {}
    setSearchLoading(false);
  };

  return (
    <>
      <Head>
        <title>Velotax • Painel de Solicitações</title>
      </Head>

      <div className="min-h-screen container-pad py-10">
        <div className="max-w-6xl mx-auto animate-fadeUp">
          {/* HERO */}
          <div className="mb-8 surface p-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <img src="/brand/velotax-symbol.png" alt="Velotax" className="h-10 md:h-12 w-auto" />
                <h1 className="titulo-principal">Painel de Solicitações</h1>
              </div>
              <p className="text-white/80">Envie solicitações técnicas para o WhatsApp</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="badge">Online</span>
                <span className="text-white/60 text-sm">Grupo padrão configurado</span>
              </div>
            </div>
            <img src="/brand/velotax-wordmark.png" alt="Velotax" className="h-14 md:h-16 opacity-95" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 card hover:-translate-y-0.5 p-6">
              <div className="mb-6 bg-white/80 backdrop-blur p-4 rounded-xl border border-black/10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-sky-500 to-emerald-500" />
                  <h2 className="text-lg font-semibold">Consulta de CPF</h2>
                </div>
                <div className="flex flex-col md:flex-row gap-2 md:items-end">
                  <div className="flex-1">
                    <label className="text-sm text-black/80">CPF</label>
                    <input className="input" placeholder="Digite o CPF" value={searchCpf} onChange={(e) => setSearchCpf(e.target.value)} />
                  </div>
                  <button type="button" onClick={buscarCpf} className="btn-primary px-3 py-2" disabled={searchLoading}>{searchLoading ? 'Buscando...' : 'Buscar'}</button>
                </div>
                {searchCpf && (
                  <div className="text-sm text-black/60 mt-2">{searchResults.length} registro(s) encontrado(s)</div>
                )}
                {searchResults && searchResults.length > 0 && (
                  <div className="space-y-2 mt-3 max-h-64 overflow-auto">
                    {searchResults.slice(0,8).map((r) => (
                      <div key={r.id} className="p-3 bg-white rounded border border-black/10 flex items-center justify-between">
                        <div>
                          <div className="font-medium">{r.tipo} — {r.cpf}</div>
                          <div className="text-xs text-black/60">Agente: {r.agente || '—'} • Status: {r.status || '—'}</div>
                        </div>
                        <div className="text-xs text-black/60">{new Date(r.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="section-title">Formulário de Solicitação</div>
              <FormSolicitacao registrarLog={registrarLog} />
            </div>
            <div className="card hover:-translate-y-0.5 p-4">
              <Logs logs={logs} />
            </div>
            <a href="/erros-bugs" className="block card hover:-translate-y-0.5 p-4 text-center">
              <div className="text-lg font-semibold mb-1">Erros / Bugs</div>
              <div className="text-black/70">Reportar problemas com anexos de imagem</div>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}