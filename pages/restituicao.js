import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

export default function Restituicao() {
  const router = useRouter();
  const [valorStr, setValorStr] = useState('');

  const parseCents = (s) => {
    const digits = String(s || '').replace(/[^0-9]/g, '');
    return Number(digits || 0);
  };
  const formatBRLFromCents = (c) => (c/100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const baseCents = useMemo(() => parseCents(valorStr), [valorStr]);
  const lotesCents = useMemo(() => {
    const base = Number.isFinite(baseCents) ? baseCents : 0;
    const l1 = base; // base
    const l2 = Math.round(base * 101 / 100); // +1%
    const l3 = Math.round(base * 10179 / 10000); // +1,79%
    return [l1, l2, l3];
  }, [baseCents]);

  // formata no blur
  const onBlur = () => {
    try { setValorStr(formatBRLFromCents(baseCents)); } catch {}
  };

  useEffect(() => {
    try {
      const cached = localStorage.getItem('velotax_restituicao_valor');
      if (cached) setValorStr(cached);
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('velotax_restituicao_valor', valorStr); } catch {}
  }, [valorStr]);

  return (
    <>
      <Head>
        <title>Velotax • Cálculo de Lotes da Restituição</title>
      </Head>
      <div className="min-h-screen container-pad py-10">
        <div className="max-w-3xl mx-auto animate-fadeUp">
          <div className="mb-8 surface p-8 rounded-xl">
            <div className="flex items-center justify-between gap-3 mb-4">
              <button type="button" onClick={() => router.back()} className="px-3 py-1.5 rounded-lg border text-sm hover:opacity-90">
                ← Voltar
              </button>
              <div />
            </div>
            <h1 className="titulo-principal text-center">Cálculo de Lotes da Restituição</h1>
            <p className="text-black/70 mt-2 text-center">Informe o valor base e veja os lotes com acréscimos.</p>
          </div>

          <div className="card p-6 space-y-5">
            <div>
              <label className="text-sm text-black/80">Valor base</label>
              <input
                className="input w-full"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={valorStr}
                onChange={(e) => setValorStr(e.target.value)}
                onBlur={onBlur}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded border border-black/10">
                <div className="text-xs text-black/60 mb-1">1º Lote (base)</div>
                <div className="text-xl font-semibold">{formatBRLFromCents(lotesCents[0] || 0)}</div>
              </div>
              <div className="p-4 bg-white rounded border border-black/10">
                <div className="text-xs text-black/60 mb-1">2º Lote (+1%)</div>
                <div className="text-xl font-semibold">{formatBRLFromCents(lotesCents[1] || 0)}</div>
              </div>
              <div className="p-4 bg-white rounded border border-black/10">
                <div className="text-xs text-black/60 mb-1">3º Lote (+1,79%)</div>
                <div className="text-xl font-semibold">{formatBRLFromCents(lotesCents[2] || 0)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
