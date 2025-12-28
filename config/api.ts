import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import {
  ShipmentDetailsResponse,
  ScanShipmentRequest,
  CloseContainerRequest,
  FloorPackageRequest,
  ApiResponse,
  GetShipmentResponse,
} from '../types/api.types';

// API Base URLs Configuration
// INSTRUCTIONS:
// 1. For Android Emulator: Automatically uses 10.0.2.2
// 2. For iOS/Web: Automatically uses localhost
// 3. For Physical Device: Set PHYSICAL_DEVICE_IP to your computer's IP (e.g., 192.168.1.100)
// 4. Make sure the port matches your CourierApi port (default is 5002)

const PHYSICAL_DEVICE_IP = null; // Set this to your computer's IP if using a physical device
const API_PORT = '5002';          // Change this if your API runs on a different port
const API_PROTOCOL = 'http';      // Change to 'https' if using SSL

// Automatically determine the correct host based on platform
const getApiHost = () => {
  if (PHYSICAL_DEVICE_IP) {
    return PHYSICAL_DEVICE_IP;
  }
  
  if (Platform.OS === 'android') {
    return '10.0.2.2'; // Android emulator uses this to access host machine's localhost
  }
  
  return 'localhost'; // iOS and web use localhost
};

const API_HOST = getApiHost();

const SORTING_API_BASE_URL = `${API_PROTOCOL}://${API_HOST}:${API_PORT}/CourierApi/Sorting`;
const SHIPMENTS_API_BASE_URL = `${API_PROTOCOL}://${API_HOST}:${API_PORT}/CourierApi/Shipments`;


// Create axios instances with default config
const sortingApiClient: AxiosInstance = axios.create({
  baseURL: SORTING_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const shipmentsApiClient: AxiosInstance = axios.create({
  baseURL: SHIPMENTS_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
shipmentsApiClient.interceptors.request.use(
  (config) => {
    // TODO: Get token from storage/context
    // For now, using a temporary token or you can disable [Authorize] in ShipmentsController for testing
    const token = 'YOUR_AUTH_TOKEN_HERE'; // Replace with actual token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API Endpoints
export const sortingAPI = {
  /**
   * Get shipment details by barcode
   * @param barcode - Shipment barcode
   * @returns API response with shipment details
   */
  getShipmentDetails: async (barcode: string): Promise<ShipmentDetailsResponse> => {
    try {
      const response = await sortingApiClient.get<any>('/GetShipmentDetails', {
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
      const response = await sortingApiClient.post<ShipmentDetailsResponse>('/ScanShipment', request);
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
      const response = await sortingApiClient.post<ApiResponse>('/CloseContainer', request);
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
      const response = await sortingApiClient.post<ApiResponse>('/ProcessFloorPackage', request);
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
      const response = await sortingApiClient.get<ApiResponse>(`/ValidateWorkerSession/${sessionId}`, {
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

};

// Shipments API for UpdateOperations
export const shipmentsAPI = {
  /**
   * Update operations - for barcode scanning operations (83, 53, 600, 109)
   * @param requests - Array of operation requests
   * @returns API response
   */
  updateOperations: async (requests: Array<{
    Id?: number;
    EventCode: number;
    MsgDateTime: string;
    MsgData: {
      DriverId: number;
      ShipmentId?: number;
      Coordinates?: string;
      ShipmentsList?: Array<{
        ShipmentId: string;
        ActualQuantity?: number;
        IsScan?: boolean;
      }>;
    };
  }>): Promise<ApiResponse> => {
    try {
      const response = await shipmentsApiClient.post<any>('/UpdateOperations', requests);
      return response.data;
    } catch (error) {
      console.error('Error updating operations:', error);
      throw error;
    }
  }
};

// Operational App API for shipment data (via CourierApi)
export const operationalAppAPI = {
  /**
   * Get shipment by number from OperationalApp (via CourierApi)
   * Uses the existing FindShipmentsByID endpoint
   * @param shipmentNumber - Shipment number or barcode
   * @returns Shipment data response
   */
  getShipmentByNumber: async (shipmentNumber: string): Promise<GetShipmentResponse> => {
    try {
      // Use existing FindShipmentsByID endpoint with isCard=false to get full shipment data
      const response = await shipmentsApiClient.get<any>(
        `/FindShipmentsByID/${shipmentNumber}/false`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching shipment by number:', error);
      throw error;
    }
  }
};

export default sortingApiClient;
