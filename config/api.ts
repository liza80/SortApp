import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import {
  ShipmentDetailsResponse,
  ScanShipmentRequest,
  CloseContainerRequest,
  CloseContainerResponse,
  FloorPackageRequest,
  ApiResponse,
  GetShipmentResponse,
} from '../types/api.types';

// API Base URLs Configuration
// PRODUCTION CONFIG: Update PRODUCTION_API_HOST with your actual production server URL
// DEVELOPMENT CONFIG: Set PHYSICAL_DEVICE_IP to your computer's IP for testing on physical devices

const IS_PRODUCTION = false; // Set to false for development/testing with local API
const PRODUCTION_API_HOST = 'dcz9s109vojxy.cloudfront.net'; // CloudFront distribution URL
const PHYSICAL_DEVICE_IP = null; // For development: Set this to your computer's IP if using a physical device
const API_PORT = '5002';          // CourierApi is running on port 5002
const API_PROTOCOL = 'http'; // Using HTTP for local development (not HTTPS)

// Automatically determine the correct host based on environment and platform
const getApiHost = () => {
  if (IS_PRODUCTION) {
    return PRODUCTION_API_HOST;
  }
  
  // Development mode logic
  if (PHYSICAL_DEVICE_IP) {
    return PHYSICAL_DEVICE_IP;
  }
  
  if (Platform.OS === 'android') {
    return '10.0.2.2'; // Android emulator uses this to access host machine
  }
  
  // For web development, use localhost
  return 'localhost';
};

const API_HOST = getApiHost();

// Build URL with or without port
const buildApiUrl = (path: string) => {
  const baseUrl = `${API_PROTOCOL}://${API_HOST}`;
  return API_PORT ? `${baseUrl}:${API_PORT}${path}` : `${baseUrl}${path}`;
};

const SORTING_API_BASE_URL = buildApiUrl('/CourierApi/Sorting');
const SHIPMENTS_API_BASE_URL = buildApiUrl('/CourierApi/Shipments');


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
  closeContainer: async (request: CloseContainerRequest): Promise<ApiResponse<CloseContainerResponse>> => {
    try {
      // Convert camelCase to PascalCase for C# backend
      // Send both HandcuffBarcode and ContainerBarcode for compatibility with RUN system
      const backendRequest = {
        SessionId: request.sessionId,
        DriverId: request.driverId,
        ExitNumber: request.exitNumber,
        HandcuffBarcode: request.handcuffBarcode,
        ContainerBarcode: request.handcuffBarcode  // RUN controller uses this property
      };
      const response = await sortingApiClient.post<ApiResponse<CloseContainerResponse>>('/CloseContainer', backendRequest);
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

  /**
   * Create new container
   * @param request - Container creation request
   * @returns API response
   */
  createContainer: async (request: {
    sessionId: number;
    driverId: number;
    exitZone: number;
    distributionPoint: number;
    containerPCC: string;
  }): Promise<ApiResponse<any>> => {
    try {
      const backendRequest = {
        SessionId: request.sessionId,
        DriverId: request.driverId,
        ExitZone: request.exitZone,
        DistributionPoint: request.distributionPoint,
        ContainerPCC: request.containerPCC
      };
      const response = await sortingApiClient.post<ApiResponse<any>>('/CreateContainer', backendRequest);
      return response.data;
    } catch (error) {
      console.error('Error creating container:', error);
      throw error;
    }
  },

  /**
   * Add package to container
   * @param request - Package addition request
   * @returns API response
   */
  addPackageToContainer: async (request: {
    sessionId: number;
    driverId: number;
    packageBarcode: string;
    containerPCC: string;
    exitZone: number;
    distributionPoint?: number;
    headerId?: number;
  }): Promise<ApiResponse<any>> => {
    try {
      const backendRequest = {
        SessionId: request.sessionId,
        DriverId: request.driverId,
        PackageBarcode: request.packageBarcode,
        ContainerPCC: request.containerPCC,
        ExitZone: request.exitZone,
        DistributionPoint: request.distributionPoint,
        HeaderId: request.headerId
      };
      const response = await sortingApiClient.post<ApiResponse<any>>('/AddPackageToContainer', backendRequest);
      return response.data;
    } catch (error: any) {
      console.error('Error adding package to container:', error);
      
      // If it's an axios error with response data, extract the error message
      if (error.response?.data) {
        console.log('Axios error response data:', error.response.data);
        
        // If the response contains our API response structure
        if (error.response.data.data?.message || error.response.data.data?.errorMessage) {
          // Return the error response data so the component can handle it
          return error.response.data;
        }
      }
      
      // Re-throw the error for other cases
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
