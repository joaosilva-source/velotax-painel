import '@/styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { SessionProvider } from 'next-auth/react';

export default function App({ Component, pageProps }) {
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

      {/* A página atual (ex: index.js) */}
      <Component {...pageProps} />
    </SessionProvider>
  );
}