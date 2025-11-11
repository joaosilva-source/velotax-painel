// Serviço para gerenciamento de armazenamento local

// Chaves de armazenamento
const STORAGE_KEYS = {
  AGENT: 'velotax_agent',
  LOCAL_LOGS: 'velotax_local_logs',
  MY_REQUEST_IDS: 'velotax_my_request_ids',
  MY_WA_IDS: 'velotax_my_waids',
  RESTITUICAO: 'velotax_restituicao_valor'
};

// Verifica se o localStorage está disponível
const isLocalStorageAvailable = () => {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

// Obtém um item do localStorage de forma segura
export const getItem = (key, defaultValue = null) => {
  if (!isLocalStorageAvailable()) return defaultValue;
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Erro ao obter item do localStorage (${key}):`, error);
    return defaultValue;
  }
};

// Define um item no localStorage de forma segura
export const setItem = (key, value) => {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Erro ao definir item no localStorage (${key}):`, error);
    return false;
  }
};

// Remove um item do localStorage de forma segura
export const removeItem = (key) => {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Erro ao remover item do localStorage (${key}):`, error);
    return false;
  }
};

// Funções específicas para cada tipo de dado

export const getAgent = () => getItem(STORAGE_KEYS.AGENT, '');
export const setAgent = (agent) => setItem(STORAGE_KEYS.AGENT, agent);

export const getLocalLogs = () => getItem(STORAGE_KEYS.LOCAL_LOGS, []);
export const setLocalLogs = (logs) => setItem(STORAGE_KEYS.LOCAL_LOGS, logs);

export const getMyRequestIds = () => getItem(STORAGE_KEYS.MY_REQUEST_IDS, []);
export const addMyRequestId = (id) => {
  if (!id) return false;
  const ids = getMyRequestIds();
  if (!ids.includes(id)) {
    return setItem(STORAGE_KEYS.MY_REQUEST_IDS, [id, ...ids].slice(0, 200));
  }
  return true;
};

export const getMyWaIds = () => getItem(STORAGE_KEYS.MY_WA_IDS, []);
export const addMyWaId = (id) => {
  if (!id) return false;
  const ids = getMyWaIds();
  if (!ids.includes(id)) {
    return setItem(STORAGE_KEYS.MY_WA_IDS, [id, ...ids].slice(0, 300));
  }
  return true;
};

export const getRestituicaoValor = () => getItem(STORAGE_KEYS.RESTITUICAO, '');
export const setRestituicaoValor = (valor) => setItem(STORAGE_KEYS.RESTITUICAO, valor);

// Limpa todos os dados do aplicativo
export const clearAppData = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    removeItem(key);
  });
  return true;
};
