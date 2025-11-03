import '@/styles/globals.css';
import { Toaster } from 'react-hot-toast';

export default function App({ Component, pageProps }) {
  return (
    <>
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
    </>
  );
}