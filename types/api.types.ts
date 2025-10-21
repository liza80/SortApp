// API Response Types

export interface ShipmentData {
  success: boolean;
  shipmentNumber?: string;
  recipientName?: string;
  address?: string;
  exitNumber?: number;
  containerCode?: string;
  distributionPoint?: string;
  branch?: string;
  line?: string;
  sector?: string;
  errorMessage?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  errorMessage?: string;
}

export interface ShipmentDetailsResponse extends ApiResponse<ShipmentData> {}

export interface ScanShipmentRequest {
  Barcode: string;
}

export interface CloseContainerRequest {
  containerId: string;
  timestamp?: string;
}

export interface FloorPackageRequest {
  packageId: string;
  location: string;
}
