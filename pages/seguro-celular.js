// pages/seguro-celular.js
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

const SeguroCelular = () => {
  const router = useRouter();
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch('/seguro-celular/index.html');
        if (!response.ok) throw new Error('Falha ao carregar o conteúdo');
        const html = await response.text();
        setHtmlContent(html);
      } catch (err) {
        console.error('Erro ao carregar o conteúdo:', err);
        setError('Não foi possível carregar o conteúdo. Por favor, tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  // Efeito de transição ao entrar na página
  useEffect(() => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease-in-out';
    const timer = setTimeout(() => {
      document.body.style.opacity = '1';
    }, 50);
    
    return () => {
      document.body.style.opacity = '1';
      clearTimeout(timer);
    };
  }, []);

  // Função para voltar para a página anterior
  const handleBack = () => {
    document.body.style.opacity = '0.8';
    document.body.style.transition = 'opacity 0.3s ease-in-out';
    setTimeout(() => {
      router.back();
    }, 200);
  };

  // Extrair apenas o conteúdo necessário do HTML
  const extractContent = (html) => {
    if (!html) return '';
    
    // Extrair o conteúdo entre as tags body
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    let content = bodyMatch ? bodyMatch[1] : html;
    
    // Remover scripts e estilos inline que podem estar causando conflitos
    content = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Ajustar caminhos das imagens
    content = content
      .replace(/src="\.\//g, 'src="/seguro-celular/')
      .replace(/src="\//g, 'src="/seguro-celular/')
      .replace(/src=".*?tipo_velotax_ajustada_cor\(1\)\.png"/, 'src="/velotax-logo.svg"');
    
    // Ajustar caminhos dos links
    content = content
      .replace(/href="\.\//g, 'href="/seguro-celular/')
      .replace(/href="\//g, 'href="/seguro-celular/');
    
    // Garantir que as imagens não ultrapassem a largura
    content = content.replace(/<img/g, '<img style="max-width:100%;height:auto;display:block;margin:0 auto;"');
    
    // Adicionar o logo da Velotax no cabeçalho
    const headerContent = `
      <div class="header">
        <div class="logo-container">
          <img src="/velotax-logo.svg" alt="Velotax" class="logo">
        </div>
        <div class="header-text">
          <h1>Seguro Celular Velotax</h1>
          <p>Material de Atendimento para o Time de Vendas</p>
        </div>
      </div>
    `;
    
    // Substituir o cabeçalho existente pelo novo
    content = content.replace(/<div class="header">[\s\S]*?<\/div>/, headerContent);
    
    // Adicionar estilos inline para melhorar a aparência
    const customStyles = `
      <style>
        body {
          font-family: 'Poppins', sans-serif;
          line-height: 1.6;
          color: #333;
          background: #f8f9fa;
          padding: 0;
          margin: 0;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 0 30px rgba(0, 0, 88, 0.1);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 40px;
        }
        .header {
          background: linear-gradient(135deg, #000058 0%, #1634FF 100%);
          color: white;
          padding: 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
        }
        .logo-container {
          width: 200px;
        }
        .logo {
          width: 100%;
          height: auto;
          filter: brightness(0) invert(1);
        }
        .header-text {
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          margin-bottom: 10px;
          color: white;
        }
        .header p {
          margin: 0;
          opacity: 0.9;
          color: rgba(255, 255, 255, 0.9);
          font-size: 16px;
        }
        .content {
          padding: 40px;
        }
        
        @media (max-width: 768px) {
          .content {
            padding: 25px 20px;
          }
        }
        .section {
          margin-bottom: 50px;
        }
        
        .section:last-child {
          margin-bottom: 30px;
        }
        h2 {
          color: #000058;
          font-size: 26px;
          margin: 0 0 25px 0;
          padding-bottom: 12px;
          border-bottom: 2px solid #f0f4ff;
          font-weight: 600;
          position: relative;
        }
        
        h2:after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 60px;
          height: 3px;
          background: linear-gradient(90deg, #000058, #1634FF);
          border-radius: 3px;
        }
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 25px;
          margin: 30px 0;
        }
        .card {
          border: 1px solid #e0e0ff;
          border-radius: 12px;
          padding: 25px;
          background: white;
          box-shadow: 0 6px 16px rgba(0, 0, 100, 0.08);
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(0, 0, 100, 0.12);
        }
        .card h3 {
          color: #000058;
          margin: 0 0 15px 0;
          font-size: 18px;
          padding-bottom: 15px;
          border-bottom: 1px solid #f0f0f0;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .card h3 .icon {
          font-size: 24px;
        }
        .card ul {
          padding-left: 20px;
          margin: 15px 0;
          flex-grow: 1;
        }
        .card ul li {
          margin-bottom: 10px;
          color: #444;
          line-height: 1.5;
          position: relative;
          padding-left: 10px;
        }
        .card ul li:before {
          content: "•";
          color: #1634FF;
          font-weight: bold;
          position: absolute;
          left: -10px;
        }
        .price {
          font-size: 24px;
          font-weight: 700;
          color: #000058;
          margin: 15px 0;
          text-align: center;
          padding: 12px;
          background: #f8f9ff;
          border-radius: 8px;
          border: 1px solid #e0e0ff;
        }
        .card-value {
          display: block;
          text-align: center;
          font-weight: 600;
          color: #1634FF;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px dashed #e0e0ff;
        }
        .highlight-box {
          background: #f8f9ff;
          border-left: 4px solid #1634FF;
          padding: 25px;
          margin: 30px 0;
          border-radius: 0 8px 8px 0;
          position: relative;
          overflow: hidden;
        }
        .highlight-box:before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #000058 0%, #1634FF 100%);
        }
        .highlight-box h3 {
          color: #000058;
          margin: 0 0 15px 0;
          font-size: 18px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .highlight-box h3:before {
          content: 'ℹ️';
          font-size: 20px;
        }
        .contact-box {
          background: linear-gradient(135deg, #000058 0%, #1634FF 100%);
          color: white;
          padding: 40px 30px;
          border-radius: 12px;
          margin: 50px 0;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 100, 0.2);
        }
        .contact-box:before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29-22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23000058' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E");
          opacity: 0.3;
          pointer-events: none;
        }
        .contact-box h3 {
          font-size: 24px;
          margin: 0 0 15px 0;
          font-weight: 600;
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .contact-box h3:before {
          content: '📞';
          font-size: 28px;
        }
        .contact-box p {
          font-size: 16px;
          line-height: 1.7;
          margin: 0 0 25px 0;
          max-width: 700px;
          position: relative;
        }
        .contact-button {
          background: #00D1FF;
          color: #000;
          padding: 14px 32px;
          border-radius: 50px;
          font-weight: 600;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
          font-size: 16px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 209, 255, 0.3);
        }
        .contact-button:before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: 0.5s;
        }
        .contact-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0, 209, 255, 0.4);
        }
        .contact-button:hover:before {
          left: 100%;
        }
        .contact-button .icon {
          font-size: 20px;
        }
        .footer {
          text-align: center;
          padding: 20px;
          background: #f8f9ff;
          color: #666;
          font-size: 14px;
          margin-top: 0;
          border-top: 1px solid #e8ecf8;
          line-height: 1.6;
        }
        
        .footer p {
          margin: 0;
          color: #666;
        }
        ul.bullet-list {
          list-style: none;
          padding: 0;
          margin: 20px 0;
        }
        .bullet-list {
          list-style: none;
          padding: 0;
          margin: 25px 0;
        }
        .bullet-list li {
          padding: 12px 0 12px 50px;
          position: relative;
          border-bottom: 1px solid #f0f0f0;
          line-height: 1.7;
          color: #444;
          font-size: 15px;
          display: flex;
          align-items: center;
          min-height: 50px;
        }
        .bullet-list li:last-child {
          border-bottom: none;
        }
        .bullet-list li:before {
          content: attr(data-number);
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 36px;
          height: 36px;
          background: #000058;
          border-radius: 50%;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 600;
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
        }
        .bullet-list li:nth-child(1):before { content: '1'; }
        .bullet-list li:nth-child(2):before { content: '2'; }
        .bullet-list li:nth-child(3):before { content: '3'; }
        .bullet-list li:nth-child(4):before { content: '4'; }
        
        @media (max-width: 768px) {
          .content {
            padding: 20px 15px;
          }
          .header {
            padding: 25px 15px;
            flex-direction: column;
            text-align: center;
          }
          .header h1 {
            font-size: 22px;
            margin-top: 15px;
          }
          .logo-container {
            width: 150px;
          }
          .cards-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    `;
    
    // Inserir os estilos no head e retornar o conteúdo do body
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Seguro Celular Velotax</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
        ${customStyles}
      </head>
      <body>
        <div class="container">
          ${content}
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="transition-opacity duration-300 ease-in-out">
      <Head>
        <title>Velotax • Guia do Seguro Celular</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <button 
            onClick={handleBack}
            className="mb-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 flex items-center gap-2 text-sm font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span>Voltar para o painel</span>
          </button>

          {loading ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center animate-pulse">
              <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Carregando guia do Seguro Celular...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-red-500 text-lg mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="mt-2">{error}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <div 
              className="bg-white rounded-xl shadow-lg overflow-hidden"
              dangerouslySetInnerHTML={{ __html: extractContent(htmlContent) }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default SeguroCelular;
