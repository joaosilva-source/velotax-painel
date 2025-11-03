// pages/index.js
import { useState } from "react";
import FormSolicitacao from "@/components/FormSolicitacao";
import Logs from "@/components/Logs";
import Head from "next/head";

export default function Home() {
  const [logs, setLogs] = useState([]);

  const registrarLog = (msg) => {
    setLogs((prev) => [{ msg, time: new Date().toLocaleString("pt-BR") }, ...prev]);
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
              <h1 className="titulo-principal">Painel de Solicitações</h1>
              <p className="text-white/80">Envie solicitações técnicas para o WhatsApp</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="badge">Online</span>
                <span className="text-white/60 text-sm">Grupo padrão configurado</span>
              </div>
            </div>
            <img src="/velotax-logo.svg" alt="Velotax" className="h-8 opacity-80" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 card hover:-translate-y-0.5 p-6">
              <div className="section-title">Formulário de Solicitação</div>
              <FormSolicitacao registrarLog={registrarLog} />
            </div>
            <div className="card hover:-translate-y-0.5 p-4">
              <Logs logs={logs} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}