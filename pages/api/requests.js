// pages/api/requests.js
import { promises as fs } from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'requests.json');

async function getRequests() {
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    // Se o arquivo não existir, retorna um array vazio
    if (error.code === 'ENOENT') {
      await fs.writeFile(filePath, JSON.stringify([], null, 2));
      return [];
    }
    console.error('Erro ao ler arquivo de requisições:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const requests = await getRequests();
      return res.status(200).json(requests);
    } 
    
    // Para outros métodos HTTP, retorne um erro
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Método ${req.method} não permitido` });
  } catch (error) {
    console.error('Erro na API de requisições:', error);
    return res.status(500).json({ 
      error: 'Erro ao processar a requisição',
      details: error.message 
    });
  }
}
