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

// Shipment model from OperationalApp
export interface Shipment {
  shipmentId: number;
  shipmentType: number;
  shipmentRef1?: string;
  shipmentRef2?: string;
  distributionLine: number;
  distributionArea: number;
  distributionSegment?: number;
  driverId: number;
  customerName?: string;
  consigneePhone: number;
  additionalPhone?: number;
  destinationAddress?: string;
  addressRemarks?: string;
  actualQuantity: number;
  scannedQuantity: number;
  weightType: boolean;
  udr: boolean;
  swapShipmentNumber?: number;
  codType?: boolean;
  codSum?: number;
  codCheckDate?: string;
  sourceName?: string;
  shipmentListingTimestamp?: string;
  shipmentUpdateTimestamp: string;
  signedForBy?: string;
  shipmentClosureCode?: number;
  actualDropoffIndex?: number;
  consigneeRemarks?: string;
  pccId?: string;
  deliveryTimeRange?: string;
  pudoId?: number;
  customerEmail?: string;
  destinationCityCode: string;
  destinationStreetCode: string;
  destinationBuildingNo: number;
  shipmentStatus: number;
  sourceAddress: string;
  sourcePhone: number;
  sourceSecondPhone: number;
  contactlessDelivery?: number;
  sourceBuildingNo?: number;
  sourceStreetCode?: string;
  sourceCityCode?: string;
  sourceEntrance?: string;
  destinationEntrance?: string;
  confirmationCode?: number;
  statusUpdateTime?: string;
}

// Driver Tip model
export interface DriverTip {
  tipId: number;
  shipmentId: number;
  tipText: string;
  tipType: string;
  createdAt?: string;
}

// Pudo Response model
export interface PudoResponse {
  pudoId: number;
  pudoName: string;
  pudoAddress: string;
  pudoPhone?: string;
  pudoType?: string;
}

// Shipment Response wrapper from FindShipmentsByID endpoint
export interface ShipmentResponse {
  shipment: Shipment;
  driverTipList: DriverTip[];
  destinationDriver: number;
  driverBranch: number;
  pudo?: PudoResponse | null;
  isWrongStatus: boolean;
  isDelayedShipment: boolean;
}

export interface GetShipmentResponse {
  success: boolean;
  data?: ShipmentResponse[];
  errorMessage?: string;
}
