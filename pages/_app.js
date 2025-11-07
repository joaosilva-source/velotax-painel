import '@/styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { SessionProvider } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function App({ Component, pageProps }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('velotax_theme');
      if (saved) setDark(saved === 'dark');
    } catch {}
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark'); else root.classList.remove('dark');
    try { localStorage.setItem('velotax_theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);

  return (
    <SessionProvider session={pageProps.session}>
      {/* Toasts customizados */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'hot-toast',
          style: { background: 'transparent' },
          success: { className: 'hot-toast hot-toast-success' },
          error: { className: 'hot-toast hot-toast-error' }
        }}
      />

      {/* Toggle tema discreto */}
      <button
        aria-label="Alternar tema"
        onClick={() => setDark((v) => !v)}
        className="fixed right-3 bottom-3 z-50 rounded-full border px-3 py-1 text-xs opacity-80 hover:opacity-100"
        style={{ background: 'var(--surface)', color: 'var(--foreground)', borderColor: 'color-mix(in oklab, var(--foreground) 12%, transparent)' }}
      >
        {dark ? 'Modo Claro' : 'Modo Escuro'}
      </button>

      {/* A página atual (ex: index.js) */}
      <Component {...pageProps} />
    </SessionProvider>
  );
}