import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';

export default function Restituicao() {
  const [valorStr, setValorStr] = useState('');

  // normaliza para número (centavos) e volta formatado
  const parseValor = (s) => {
    const digits = String(s || '').replace(/[^0-9]/g, '');
    const v = Number(digits || 0) / 100;
    return v;
  };
  const formatBRL = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const valor = useMemo(() => parseValor(valorStr), [valorStr]);
  const lotes = useMemo(() => {
    const base = isFinite(valor) ? valor : 0;
    const l1 = base;
    const l2 = base * 1.01; // +1%
    const l3 = base * 1.0179; // +1,79%
    return [l1, l2, l3];
  }, [valor]);

  // formata no blur
  const onBlur = () => {
    try { setValorStr(formatBRL(valor)); } catch {}
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
          <div className="mb-8 surface p-8 text-center rounded-xl">
            <h1 className="titulo-principal">Cálculo de Lotes da Restituição</h1>
            <p className="text-black/70 mt-2">Informe o valor base e veja os lotes com acréscimos.</p>
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
                <div className="text-xl font-semibold">{formatBRL(lotes[0] || 0)}</div>
              </div>
              <div className="p-4 bg-white rounded border border-black/10">
                <div className="text-xs text-black/60 mb-1">2º Lote (+1%)</div>
                <div className="text-xl font-semibold">{formatBRL(lotes[1] || 0)}</div>
              </div>
              <div className="p-4 bg-white rounded border border-black/10">
                <div className="text-xs text-black/60 mb-1">3º Lote (+1,79%)</div>
                <div className="text-xl font-semibold">{formatBRL(lotes[2] || 0)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
