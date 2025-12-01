// pages/index.js - Landing moderna Velotax
import Head from "next/head";

export default function Home() {
  const velohubUrl = "https://app.velohub.velotax.com.br/";

  return (
    <>
      <Head>
        <title>Painel de Solicitações • Migrou para o Velohub</title>
      </Head>

      <div className="min-h-screen bg-[#ECECEC] text-black flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white shadow-md rounded-2xl p-8 text-center flex flex-col gap-4">
          <img
            src="/brand/velotax-symbol.png"
            alt="Velotax"
            className="h-14 w-auto mx-auto"
          />
          <h1 className="text-2xl font-semibold text-[#000058]">
            Este painel foi movido para o Velohub
          </h1>
          <p className="text-sm text-black/70">
            O Painel de Solicitações agora acontece dentro do nosso novo hub de serviços.
            Acesse o Velohub para continuar utilizando o painel normalmente.
          </p>
          <a
            href={velohubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-[#000058] text-white text-sm font-medium hover:bg-[#00006f] transition-colors"
          >
            Ir para o Velohub ↗
          </a>
          <p className="text-[11px] text-black/50 mt-2">
            Se o link não abrir, copie e cole no navegador: {velohubUrl}
          </p>
        </div>
      </div>
    </>
  );
}