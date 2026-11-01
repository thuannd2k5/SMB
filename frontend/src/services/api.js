import axios from 'axios';

// Use relative URL for Vite proxy in development, fallback to localhost:3000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 35000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Không thể kết nối đến máy chủ';
    return Promise.reject(new Error(message));
  }
);

export const checkHealth = async () => {
  return await apiClient.get('/health');
};

export const getInventoryOverview = async () => {
  return await apiClient.get('/inventory/overview');
};

export const getAiStatus = async () => {
  return await apiClient.get('/ai/status');
};

export const retrieveBarcode = async (barcode) => {
  return await apiClient.post('/ai/retrieve-barcode', { barcode });
};

export const inboundInventory = async (inboundData) => {
  return await apiClient.post('/inventory/inbound', inboundData);
};

export const getInventoryItems = async (params = {}) => {
  return await apiClient.get('/inventory/items', { params });
};

export const adjustStock = async (adjustmentData) => {
  return await apiClient.post('/inventory/adjust-stock', adjustmentData);
};

export const processVisionOcr = async (payload) => {
  return await apiClient.post('/ai/vision-ocr', payload);
};

export const getSmartPricing = async (pricingData) => {
  return await apiClient.post('/ai/smart-pricing', pricingData);
};

export const getInventoryHealth = async (storeId = 'store-001') => {
  return await apiClient.get('/inventory/analytics/health', {
    params: { storeId },
  });
};

export const getReorderDrafts = async (storeId = 'store-001') => {
  return await apiClient.get('/inventory/reorder/drafts', {
    params: { storeId },
  });
};

export const regenerateCustomReorderPrompt = async (payload) => {
  return await apiClient.post('/inventory/reorder/custom-prompt', payload);
};

export const sendVoiceQuery = async (query) => {
  return await apiClient.post('/ai/voice-query', { query });
};

export const seedDemoData = async (storeId = 'store-001') => {
  return await apiClient.post('/inventory/seed-demo-data', null, {
    params: { storeId },
  });
};
