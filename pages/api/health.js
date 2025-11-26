export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Health check básico
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'velotax-painel'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      error: error.message 
    });
  }
}
