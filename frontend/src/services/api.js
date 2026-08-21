import axios from 'axios';

// Use environment variable, fallback to VPS if not set
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://165.22.196.162:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Legacy polling endpoints (kept for fallback)
export const getCryptoData = async (limit = 50, offset = 0) => {
  const response = await api.get(`/crypto-data?limit=${limit}&offset=${offset}`);
  return response.data.items || [];
};

export const getMarketStats = async (limit = 10, offset = 0) => {
  const response = await api.get(`/market-stats?limit=${limit}&offset=${offset}`);
  return response.data.items || [];
};

export const getHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

// Server-Sent Events (SSE) streaming - comprehensive data stream
export const connectToStreamingAPI = (onMessage, onError) => {
  const eventSource = new EventSource(`${API_BASE_URL}/stream/all`);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (err) {
      console.error('Failed to parse SSE data:', err);
      onError(err);
    }
  };

  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error);
    onError(error);
    // EventSource will automatically try to reconnect
  };

  // Return cleanup function
  return () => {
    eventSource.close();
  };
};

export default api;
