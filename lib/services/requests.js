import { httpJson } from './http';

export const RequestsService = {
  async list() {
    return httpJson('/api/requests');
  },
  async create(body) {
    return httpJson('/api/requests', { method: 'POST', body: JSON.stringify(body) });
  },
  async autoStatus(body) {
    return httpJson('/api/requests/auto-status', { method: 'POST', body: JSON.stringify(body) });
  }
};
