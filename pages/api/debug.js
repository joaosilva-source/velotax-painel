// pages/api/debug.js - Debug para verificar API e Database
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  try {
    // Testar conexão com banco
    const dbTest = await prisma.$queryRaw`SELECT 1 as test`;
    
    // Contar registros na tabela requests
    const count = await prisma.request.count();
    
    // Buscar últimos 5 registros
    const latest = await prisma.request.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    // Verificar variáveis de ambiente (sem mostrar secrets)
    const envStatus = {
      DATABASE_URL: process.env.DATABASE_URL ? '✅ Configurada' : '❌ Não configurada',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✅ Configurada' : '❌ Não configurada',
      NODE_ENV: process.env.NODE_ENV || '❌ Não configurada'
    };
    
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      database: {
        connection: dbTest ? '✅ OK' : '❌ Falha',
        totalRequests: count,
        latestRequests: latest.map(r => ({
          id: r.id,
          cpf: r.cpf,
          tipo: r.tipo,
          agente: r.agente,
          status: r.status,
          createdAt: r.createdAt
        }))
      },
      environment: envStatus,
      endpoints: {
        '/api/requests': 'GET/POST - Listar/Criar solicitações',
        '/api/requests/[id]': 'GET/PUT/DELETE - Detalhes da solicitação'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
