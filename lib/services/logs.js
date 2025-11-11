import { httpJson } from './http';

export const LogsService = {
  async list() {
    return httpJson('/api/logs');
  },
  async create(body) {
    return httpJson('/api/logs', { method: 'POST', body: JSON.stringify(body) });
  }
};
