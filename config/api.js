import axios from 'axios';

// API Base URL - Update this with your actual API URL
const API_BASE_URL = 'http://localhost:5115/CourierApi/Sorting';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API Endpoints
export const sortingAPI = {
  /**
   * Get shipment details by barcode
   * @param {string} barcode - Shipment barcode
   * @returns {Promise} API response with shipment details
   */
  getShipmentDetails: async (barcode) => {
    try {
      const response = await apiClient.get('/GetShipmentDetails', {
        params: { barcode }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching shipment details:', error);
      throw error;
    }
  },

  /**
   * Scan shipment barcode
   * @param {string} barcode - Shipment barcode
   * @returns {Promise} API response with shipment details
   */
  scanShipment: async (barcode) => {
    try {
      const response = await apiClient.post('/ScanShipment', {
        Barcode: barcode
      });
      return response.data;
    } catch (error) {
      console.error('Error scanning shipment:', error);
      throw error;
    }
  },

  /**
   * Close container
   * @param {object} request - Container closure request
   * @returns {Promise} API response
   */
  closeContainer: async (request) => {
    try {
      const response = await apiClient.post('/CloseContainer', request);
      return response.data;
    } catch (error) {
      console.error('Error closing container:', error);
      throw error;
    }
  },

  /**
   * Process floor package
   * @param {object} request - Floor package request
   * @returns {Promise} API response
   */
  processFloorPackage: async (request) => {
    try {
      const response = await apiClient.post('/ProcessFloorPackage', request);
      return response.data;
    } catch (error) {
      console.error('Error processing floor package:', error);
      throw error;
    }
  },

  /**
   * Validate worker session
   * @param {number} sessionId - Worker session ID
   * @param {string} runToken - Run token
   * @returns {Promise} API response
   */
  validateWorkerSession: async (sessionId, runToken = '') => {
    try {
      const response = await apiClient.get(`/ValidateWorkerSession/${sessionId}`, {
        headers: {
          'runToken': runToken
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error validating worker session:', error);
      throw error;
    }
  }
};

export default apiClient;
