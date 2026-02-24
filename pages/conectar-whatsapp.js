// pages/conectar-whatsapp.js
// Página para exibir o QR Code da API WhatsApp (evita depender dos logs do Render)
// VERSION: v1.0.0

import Head from "next/head";
import Link from "next/link";
import { getApiUrl } from "@/lib/apiConfig";

export default function ConectarWhatsApp() {
  const apiUrl = (typeof getApiUrl === "function" ? getApiUrl() : "").replace(/\/$/, "");
  const qrPageUrl = apiUrl ? `${apiUrl}/qr` : "";

  return (
    <>
      <Head>
        <title>Conectar WhatsApp • Velotax</title>
      </Head>

      <div className="min-h-screen container-pad py-10">
        <div className="max-w-2xl mx-auto animate-fadeUp">
          <div className="mb-6 flex items-center gap-4">
            <Link href="/painel" className="text-sm text-black/60 dark:text-white/60 hover:underline">
              ← Voltar ao painel
            </Link>
          </div>

          <div className="surface p-6 md:p-8 rounded-2xl">
            <h1 className="text-xl font-semibold mb-2">Conectar WhatsApp (API)</h1>
            <p className="text-sm text-black/70 dark:text-white/70 mb-6">
              Escaneie o QR Code abaixo com o celular para conectar a API ao WhatsApp. Se o QR não aparecer, a API pode já estar conectada ou ainda estar gerando — recarregue a página em alguns segundos.
            </p>

            {!qrPageUrl ? (
              <div className="py-8 text-center text-black/70 dark:text-white/70">
                <p>Configure <strong>NEXT_PUBLIC_API_URL</strong> nas variáveis de ambiente do painel (Vercel) com a URL da API no Render.</p>
                <p className="mt-2 text-sm">Ex.: https://whatsapp-api-xxxx.onrender.com</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-black/50 dark:text-white/50 mb-3">
                  Ou abra no navegador: <a href={qrPageUrl} target="_blank" rel="noopener noreferrer" className="underline break-all">{qrPageUrl}</a>
                </p>
                <div className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 min-h-[320px] flex items-center justify-center">
                  <iframe
                    src={qrPageUrl}
                    title="QR Code WhatsApp"
                    className="w-full h-[360px] border-0"
                    sandbox="allow-same-origin"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
