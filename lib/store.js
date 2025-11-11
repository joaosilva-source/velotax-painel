// Simple in-memory store shared by API routes (resets on redeploy)
const messages = new Map(); // messageId -> { agent, cpf, createdAt }
const replies = []; // { messageId, agent, reactor, text, time }

module.exports = { messages, replies };


