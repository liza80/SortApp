// API Response Types

export interface ShipmentDetailsResponse {
  success: boolean;
  // Basic shipment info
  shipmentId?: number;
  shipmentNumber?: string;
  shipmentType?: number;
  shipmentRef1?: string;
  shipmentRef2?: string;
  shipmentStatus?: number;
  
  // Customer/Recipient info
  customerName?: string;
  recipientName?: string;
  consigneePhone?: number;
  additionalPhone?: number;
  vendorPhone?: string;
  customerEmail?: string;
  
  // Destination address
  destinationAddress?: string;
  address?: string;
  addressRemarks?: string;
  destinationEntrance?: string;
  destinationCityCode?: string;
  destinationStreetCode?: string;
  destinationBuildingNo?: number;
  
  // Source address
  sourceAddress?: string;
  sourceName?: string;
  sourcePhone?: number;
  sourceSecondPhone?: number;
  sourceBuildingNo?: number;
  sourceStreetCode?: string;
  sourceCityCode?: string;
  sourceEntrance?: string;
  
  // Distribution info
  distributionLine?: number;
  distributionArea?: number;
  distributionSegment?: number;
  distributionPoint?: string;
  line?: string;
  segment?: string;
  
  // Branch/Driver info
  driverId?: number;
  destinationDriver?: number;
  driverBranch?: number;
  branch?: string;
  branchName?: string;
  branchCode?: string;
  sector?: string;
  
  // Package/Quantity info
  actualQuantity?: number;
  scannedQuantity?: number;
  packageQuantity?: string;
  
  // Exit/Container info
  exitNumber?: number;
  exitDescription?: string;
  containerCode?: string;
  pccId?: string;
  
  // Delivery details
  deliveryTimeRange?: string;
  servicePoint?: string;
  pudoId?: number;
  pudoName?: string;           // שם נקודת מסירה
  pudoAddress?: string;        // כתובת נקודת מסירה
  pudoPhone?: string;          // טלפון נקודת מסירה
  actualDropoffIndex?: number;
  signedForBy?: string;
  shipmentClosureCode?: number;
  consigneeRemarks?: string;
  
  // Special flags
  weightType?: boolean;
  udr?: boolean;
  swapShipmentNumber?: number;
  codType?: boolean;
  codSum?: number;
  codCheckDate?: string;
  contactlessDelivery?: number;
  confirmationCode?: number;
  
  // Status flags
  currentStage?: string;
  stageDescription?: string;
  isWrongStatus?: boolean;
  isDelayedShipment?: boolean;
  
  // Return shipment fields
  isReturn?: boolean;
  returnReasonCode?: number;
  returnReasonDesc?: string;
  doubleReturnFlag?: boolean;
  returnType?: string;
  
  // Timestamps
  shipmentListingTimestamp?: string;
  shipmentUpdateTimestamp?: string;
  statusUpdateTime?: string;
  
  // Error handling
  errorMessage?: string;
  errorMessageHebrew?: string;
  errorCode?: string;
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
  sessionId: number;
  driverId: number;
  exitNumber: number;
  handcuffBarcode: string;
}

export interface CloseContainerResponse {
  success: boolean;
  message: string;
  containerNumber?: number;
  packageCount: number;
  hasError: boolean;
  errorMessage: string;
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
