// pages/conectar-whatsapp.js
// Página: QR Code da API WhatsApp + status Conectado/Desconectado
// VERSION: v1.1.0

import Head from "next/head";
import Link from "next/link";
import { getApiUrl, getApiHeaders } from "@/lib/apiConfig";
import { useEffect, useState } from "react";

export default function ConectarWhatsApp() {
  const apiUrl = (typeof getApiUrl === "function" ? getApiUrl() : "").replace(/\/$/, "");
  const qrPageUrl = apiUrl ? `${apiUrl}/qr` : "";
  const pingUrl = apiUrl ? `${apiUrl}/ping` : "";

  const [status, setStatus] = useState("loading"); // 'loading' | 'connected' | 'disconnected' | 'error'
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!pingUrl) {
      setStatus("error");
      setErrorMsg("API não configurada");
      return;
    }
    const fetchStatus = async () => {
      try {
        const res = await fetch(pingUrl, { headers: getApiHeaders() });
        const data = await res.json().catch(() => ({}));
        const whatsapp = data?.whatsapp || "";
        if (whatsapp === "connected") setStatus("connected");
        else setStatus("disconnected");
        setErrorMsg("");
      } catch (e) {
        setStatus("error");
        setErrorMsg(e?.message || "Não foi possível contactar a API");
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, [pingUrl]);

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

            {/* Status: Conectado / Desconectado */}
            <div className="mb-6 flex items-center gap-3 flex-wrap">
              <span className="text-sm text-black/60 dark:text-white/60">Status:</span>
              {status === "loading" && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/10 dark:bg-white/10 text-sm">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Verificando...
                </span>
              )}
              {status === "connected" && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                  Conectado
                </span>
              )}
              {status === "disconnected" && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 text-red-700 dark:text-red-300 text-sm font-medium">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                  Desconectado
                </span>
              )}
              {status === "error" && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-sm">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                  Erro {errorMsg && `— ${errorMsg}`}
                </span>
              )}
            </div>

            <p className="text-sm text-black/70 dark:text-white/70 mb-6">
              {status === "connected"
                ? "A API está conectada ao WhatsApp. Não é necessário escanear o QR."
                : "Escaneie o QR Code abaixo com o celular para conectar a API ao WhatsApp. O status é atualizado a cada 8 segundos."}
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
