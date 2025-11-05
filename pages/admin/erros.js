import { useState } from 'react';

export default function AdminErros() {
  const [categoria, setCategoria] = useState('APP');
  const [descricao, setDescricao] = useState('');
  const [agente, setAgente] = useState('');
  const [cpf, setCpf] = useState('');
  const [imgs, setImgs] = useState([]); // [{name,dataUrl}]
  const [enviando, setEnviando] = useState(false);
  const [okMsg, setOkMsg] = useState('');

  // compressão simples para reduzir tamanho (opcional)
  const compressImage = (file, maxW = 1200, maxH = 1200, quality = 0.9) => new Promise((resolve) => {
    try {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = () => {
        img.onload = () => {
          let { width, height } = img;
          const scale = Math.min(maxW / width, maxH / height, 1);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    } catch { resolve(null); }
  });

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    const out = [];
    for (const f of files) {
      const dataUrl = await compressImage(f);
      if (dataUrl) out.push({ name: f.name, dataUrl });
    }
    setImgs(out);
  };

  const enviar = async () => {
    setOkMsg('');
    if (!categoria || !descricao) {
      alert('Preencha categoria e descrição');
      return;
    }
    setEnviando(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const defaultJid = process.env.NEXT_PUBLIC_DEFAULT_JID;
      const msg = `Relato de Erro\nCategoria: ${categoria}\nAgente: ${agente || '—'}\nCPF: ${cpf || '—'}\nDescrição: ${descricao}\nImagens: ${imgs.length}`;

      if (apiUrl && defaultJid) {
        // 1) Envia texto (opcional)
        try {
          await fetch(apiUrl + '/send', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jid: defaultJid, mensagem: msg })
          });
        } catch {}
        // 2) Envia cada imagem usando imageBase64 conforme especificação Bailey
        for (const im of imgs) {
          try {
            const base64 = String(im.dataUrl || '').split(',')[1] || '';
            if (!base64) continue;
            await fetch(apiUrl + '/send', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jid: defaultJid,
                imageBase64: base64,
                caption: `Erro ${categoria} - ${descricao?.slice(0, 100) || ''}`,
                mimeType: 'image/jpeg'
              })
            });
          } catch (e) { console.error('Falha ao enviar imagem', e); }
        }
      }

      // Sempre registra no painel
      await fetch('/api/requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agente: agente || null, cpf: cpf || null, tipo: `Erro - ${categoria}`, payload: { descricao, imagens: imgs }, agentContact: defaultJid || null, waMessageId: null })
      });
      await fetch('/api/logs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_request', detail: { tipo: `Erro - ${categoria}`, cpf: cpf || null, imagens: imgs.length } })
      });
      setOkMsg('Erro registrado e imagens enviadas (se configurado).');
      setDescricao(''); setImgs([]);
    } catch {
      alert('Falha ao registrar.');
    }
    setEnviando(false);
  };

  return (
    <div className="min-h-screen container-pad py-8 max-w-4xl mx-auto">
      <h1 className="titulo-principal mb-4">Reportar Erro / Bug</h1>
      <div className="bg-white p-5 rounded-xl border border-black/10 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-black/80">Agente</label>
            <input className="input" value={agente} onChange={(e) => setAgente(e.target.value)} placeholder="Nome do agente" />
          </div>
          <div>
            <label className="text-sm text-black/80">CPF</label>
            <input className="input" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-black/80">Categoria</label>
            <select className="input" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option>APP</option>
              <option>Crédito Pessoal</option>
              <option>Crédito do Trabalhador</option>
              <option>Antecipação</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-black/80">Imagens (até 5)</label>
            <input type="file" accept="image/*" multiple onChange={onFiles} className="block w-full text-sm" />
          </div>
        </div>
        <div>
          <label className="text-sm text-black/80">Descrição do erro</label>
          <textarea className="input h-32" placeholder="Explique o problema..." value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </div>
        {imgs.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {imgs.map((im, idx) => (
              <div key={idx}>
                <img src={im.dataUrl} alt={im.name} className="w-full h-24 object-cover rounded border" />
              </div>
            ))}
          </div>
        )}
        <div>
          <button className={`btn-primary ${enviando ? 'opacity-60 cursor-not-allowed' : ''}`} onClick={enviar} disabled={enviando}>
            {enviando ? 'Enviando...' : 'Enviar Erro'}
          </button>
        </div>
        {okMsg && <div className="text-green-700 text-sm">{okMsg}</div>}
      </div>
    </div>
  );
}
