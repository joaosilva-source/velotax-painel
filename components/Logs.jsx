// components/Logs.jsx
export default function Logs({ logs }) {
  const exportar = () => {
    const conteudo = logs.map(l => `${l.time} - ${l.msg}`).join("\n");
    const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "logs_painel.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl p-4 h-[640px] flex flex-col">
      <div className="flex justify-between items-center mb-3 pb-3 border-b border-velotax-accent/20">
        <h2 className="section-title mb-0">Logs de Envio</h2>
        <button onClick={exportar} className="px-3 py-1 bg-velotax-accent text-white rounded text-sm font-semibold hover:opacity-90">Exportar</button>
      </div>

      <div className="space-y-2 text-sm overflow-y-auto flex-1">
        {logs.length === 0 && <div className="text-black/60">Nenhum log ainda.</div>}
        {logs.map((l, i) => (
          <div key={i} className="p-2 bg-white rounded-md border border-black/10 transition-transform duration-200 hover:-translate-y-0.5">
            <div className="text-xs text-green-600 font-mono">{l.time}</div>
            <div className="text-[#272A30]">{l.msg}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


