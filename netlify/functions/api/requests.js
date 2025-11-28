// netlify/functions/api/requests.js - API manual para Netlify Functions
const { Client } = require('pg');

// Configuração do banco
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event, context) => {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  // Handle OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    await client.connect();
    
    if (event.httpMethod === 'GET') {
      // Listar todas as solicitações
      const result = await client.query(
        'SELECT * FROM requests ORDER BY created_at DESC'
      );
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows)
      };
    }
    
    if (event.httpMethod === 'POST') {
      // Criar nova solicitação
      const data = JSON.parse(event.body);
      const { cpf, tipo, agente, status, payload } = data;
      
      const result = await client.query(
        `INSERT INTO requests (cpf, tipo, agente, status, payload, created_at) 
         VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
        [cpf, tipo, agente, status || 'pendente', JSON.stringify(payload || {})]
      );
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }
    
    if (event.httpMethod === 'PUT') {
      // Atualizar solicitação
      const data = JSON.parse(event.body);
      const { id, status } = data;
      
      const result = await client.query(
        'UPDATE requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, id]
      );
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }
    
    if (event.httpMethod === 'DELETE') {
      // Deletar solicitação
      const { id } = event.queryStringParameters;
      
      await client.query('DELETE FROM requests WHERE id = $1', [id]);
      
      return {
        statusCode: 204,
        headers
      };
    }
    
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
    
  } catch (error) {
    console.error('Database error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  } finally {
    await client.end();
  }
};
