import axios, { AxiosInstance } from 'axios';
import {
  ShipmentDetailsResponse,
  ScanShipmentRequest,
  CloseContainerRequest,
  FloorPackageRequest,
  ApiResponse,
} from '../types/api.types';

// API Base URL - Update this with your actual API URL
const API_BASE_URL = 'https://localhost:5002/CourierApi/Sorting';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
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
   * @param barcode - Shipment barcode
   * @returns API response with shipment details
   */
  getShipmentDetails: async (barcode: string): Promise<ShipmentDetailsResponse> => {
    try {
      const response = await apiClient.get<any>('/GetShipmentDetails', {
        params: { barcode }
      });
      // API returns { success, errorMessage, data: {...} }
      // We need to return the inner data object
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching shipment details:', error);
      throw error;
    }
  },

  /**
   * Scan shipment barcode
   * @param barcode - Shipment barcode
   * @returns API response with shipment details
   */
  scanShipment: async (barcode: string): Promise<ShipmentDetailsResponse> => {
    try {
      const request: ScanShipmentRequest = {
        Barcode: barcode
      };
      const response = await apiClient.post<ShipmentDetailsResponse>('/ScanShipment', request);
      return response.data;
    } catch (error) {
      console.error('Error scanning shipment:', error);
      throw error;
    }
  },

  /**
   * Close container
   * @param request - Container closure request
   * @returns API response
   */
  closeContainer: async (request: CloseContainerRequest): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>('/CloseContainer', request);
      return response.data;
    } catch (error) {
      console.error('Error closing container:', error);
      throw error;
    }
  },

  /**
   * Process floor package
   * @param request - Floor package request
   * @returns API response
   */
  processFloorPackage: async (request: FloorPackageRequest): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>('/ProcessFloorPackage', request);
      return response.data;
    } catch (error) {
      console.error('Error processing floor package:', error);
      throw error;
    }
  },

  /**
   * Validate worker session
   * @param sessionId - Worker session ID
   * @param runToken - Run token
   * @returns API response
   */
  validateWorkerSession: async (sessionId: number, runToken: string = ''): Promise<ApiResponse> => {
    try {
      const response = await apiClient.get<ApiResponse>(`/ValidateWorkerSession/${sessionId}`, {
        headers: {
          'runToken': runToken
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error validating worker session:', error);
      throw error;
    }
  },

  /**
   * Scan barcode with statistics
   * @param request - Barcode scan request
   * @returns Barcode scan response with statistics
   */
  scanBarcode: async (request: {
    sessionId: number;
    controlCode: number;
    driverId: number;
    barcode: string;
    latitude?: string;
    longitude?: string;
    isFirstEntry?: boolean;
    isManualEntry?: boolean;
  }): Promise<any> => {
    try {
      const response = await apiClient.post<any>('/ScanBarcode', request);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error scanning barcode:', error);
      throw error;
    }
  }
};

export default apiClient;
