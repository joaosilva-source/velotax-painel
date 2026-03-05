// pages/consulta-cpf-conecta.js
// Consulta simples: busca por CPF na lista Ação Conecta Mais

import Head from "next/head";
import Link from "next/link";
import { useState, useMemo } from "react";
import fs from "fs";
import path from "path";

/** Formata CPF para exibição 000.000.000-00 */
function formatCpf(digits) {
  const s = String(digits).replace(/\D/g, "").slice(0, 11);
  if (s.length <= 3) return s;
  if (s.length <= 6) return `${s.slice(0, 3)}.${s.slice(3)}`;
  return `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${s.slice(9)}`;
}

/** Extrai só dígitos do CPF */
function onlyDigits(val) {
  return String(val).replace(/\D/g, "");
}

export default function ConsultaCpfConecta({ cpfs = [] }) {
  const [busca, setBusca] = useState("");

  const setCpf = useMemo(() => new Set(cpfs.map((c) => String(c).replace(/\D/g, ""))), [cpfs]);
  const cpfDigitado = onlyDigits(busca);
  const encontrado = cpfDigitado.length >= 11 && setCpf.has(cpfDigitado);

  return (
    <>
      <Head>
        <title>Consulta CPF • Ação Conecta Mais • Velotax</title>
      </Head>

      <div className="min-h-screen container-pad py-10">
        <div className="max-w-2xl mx-auto animate-fadeUp">
          <div className="mb-6 flex items-center gap-4">
            <Link href="/" className="text-sm text-black/60 dark:text-white/60 hover:underline">
              ← Início
            </Link>
            <Link href="/painel" className="text-sm text-black/60 dark:text-white/60 hover:underline">
              Painel
            </Link>
          </div>

          <div className="surface p-6 md:p-8 rounded-2xl space-y-6">
            <h1 className="text-xl font-semibold">Consulta CPF – Ação Conecta Mais</h1>
            <p className="text-sm text-black/60 dark:text-white/60">
              Busque por CPF para verificar se o cliente está na lista Ação Conecta Mais.
            </p>

            {/* Busca por CPF */}
            <div>
              <label className="block text-sm font-medium mb-2">CPF do cliente</label>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00 ou só números"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="flex-1 min-w-[200px] px-4 py-2 rounded-lg border bg-transparent"
                />
              </div>
              {cpfDigitado.length >= 11 && (
                <div className="mt-3 p-3 rounded-lg surface">
                  {encontrado ? (
                    <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ CPF {formatCpf(cpfDigitado)} está na lista Ação Conecta Mais.
                    </p>
                  ) : (
                    <p className="text-amber-600 dark:text-amber-400">
                      CPF {formatCpf(cpfDigitado)} não consta na lista.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export async function getStaticProps() {
  let cpfs = [];
  try {
    const filePath = path.join(process.cwd(), "data", "cpf-conecta-maisacao.json");
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    cpfs = Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("[consulta-cpf-conecta] Erro ao carregar lista:", e.message);
  }
  return { props: { cpfs } };
}
