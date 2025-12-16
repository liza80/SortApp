// API Response Types

export interface ShipmentDetailsResponse {
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
  vendorPhone?: string;        // טלפון יעד - NEW
  packageQuantity?: string;    // כמות חבילות - NEW
  errorMessage?: string;
  errorMessageHebrew?: string;
  errorCode?: string;
  customerName?: string;
  currentStage?: string;
  exitDescription?: string;
  servicePoint?: string;
  branchName?: string;
  branchCode?: string;
  segment?: string;
}

// Keep for backward compatibility
export interface ShipmentData extends ShipmentDetailsResponse {}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  errorMessage?: string;
}

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
