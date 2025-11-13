import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const marketService = {
  // Get all trending markets
  getMarkets: async (limit = 30) => {
    const response = await axios.get(`${API}/markets`, { params: { limit } });
    return response.data.markets;
  },

  // Get specific market details
  getMarketDetails: async (marketId) => {
    const response = await axios.get(`${API}/markets/${marketId}`);
    return response.data;
  },

  // Get orderbook for a token
  getOrderbook: async (marketId, tokenId) => {
    const response = await axios.get(`${API}/markets/${marketId}/orderbook`, { params: { token_id: tokenId } });
    return response.data;
  },

  // Get price chart data
  getChartData: async (marketId, tokenId, interval = '1h') => {
    const response = await axios.get(`${API}/markets/${marketId}/chart`, { 
      params: { token_id: tokenId, interval } 
    });
    return response.data.data;
  },
};

export const positionService = {
  // Create a new position
  createPosition: async (positionData) => {
    const response = await axios.post(`${API}/positions`, positionData);
    return response.data;
  },

  // Get user's positions
  getPositions: async (userId) => {
    const response = await axios.get(`${API}/positions`, { params: { user_id: userId } });
    return response.data.positions;
  },
};

export const orderService = {
  // Create a new order
  createOrder: async (orderData) => {
    const response = await axios.post(`${API}/orders`, orderData);
    return response.data;
  },

  // Get user's orders
  getOrders: async (userId) => {
    const response = await axios.get(`${API}/orders`, { params: { user_id: userId } });
    return response.data.orders;
  },
};
