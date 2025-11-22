// pages/index.js - Landing moderna Velotax
import Head from "next/head";

export default function Home() {
  const velohubUrl = 'https://app.velohub.velotax.com.br/';

  return (
    <>
      <Head>
        <title>Velotax • Atendimento</title>
      </Head>

      <div className="min-h-screen bg-[#ECECEC] text-black relative">
        <div className="max-w-5xl mx-auto py-10 px-4 md:px-6 animate-fadeUp">
          {/* HERO SIMPLES */}
          <div className="flex flex-col items-center md:items-start gap-4 mb-10">
            <img src="/brand/velotax-symbol.png" alt="Velotax" className="h-14 w-auto" />
            <h1 className="text-3xl font-semibold tracking-tight text-[#000058]">Atendimento Velotax</h1>
          </div>

          {/* 3 CARDS NA PARTE DE BAIXO */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a href="/painel" className="card hover:-translate-y-0.5 transition-transform p-6 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-sky-500 to-emerald-500" />
                <h2 className="text-lg font-semibold">Painel de Solicitações</h2>
              </div>
              <p className="text-sm text-black/70">
                Enviar solicitações técnicas, acompanhar status por CPF e visualizar histórico por agente.
              </p>
              <div className="mt-auto text-xs text-sky-700 font-medium">Acessar painel →</div>
            </a>

            <a href="/erros-bugs" className="card hover:-translate-y-0.5 transition-transform p-6 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-rose-500 to-amber-500" />
                <h2 className="text-lg font-semibold">Erros / Bugs</h2>
              </div>
              <p className="text-sm text-black/70">
                Registrar problemas do app com prints, descrição e status de resolução pela equipe técnica.
              </p>
              <div className="mt-auto text-xs text-rose-700 font-medium">Abrir página de erros →</div>
            </a>

            <a href={velohubUrl} target="_blank" rel="noopener" className="card hover:-translate-y-0.5 transition-transform p-6 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-emerald-500 to-sky-500" />
                <h2 className="text-lg font-semibold">Velohub</h2>
              </div>
              <p className="text-sm text-black/70">
                Acessar o hub principal da Velotax com visão consolidada de clientes, produtos e indicadores.
              </p>
              <div className="mt-auto text-xs text-emerald-700 font-medium">Ir para o Velohub ↗</div>
            </a>
          </div>

          <div className="mt-10 text-[11px] text-black/50 text-center md:text-left">
            Painel interno Velotax • Acesso restrito à equipe de atendimento.
          </div>
        </div>

        <img
          src="/brand/loading.gif"
          alt="Carregando"
          className="hidden md:block fixed bottom-4 right-6 w-10 h-10 opacity-40 object-contain pointer-events-none"
        />
      </div>
    </>
  );
}