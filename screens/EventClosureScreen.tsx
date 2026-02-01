import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, TextInput, Modal, ScrollView, FlatList, ActivityIndicator, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { sortingAPI, operationalAppAPI } from '../config/api';
import { CloseContainerRequest, CloseContainerResponse } from '../types/api.types';
import AppBarcodeScanner from '../components/AppBarcodeScanner';

type EventClosureScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EventClosure'>;

interface EventClosureScreenProps {
  navigation: EventClosureScreenNavigationProp;
}

type TabType = 'new' | 'history';

// Container Details interface for displaying closed container info
interface ContainerDetails {
  containerNumber?: number;
  containerBarcode: string;
  exitNumber: number;
  packageCount: number;
  distributionPointNumber?: number;
  distributionPointName?: string;
  pudoAddress?: string;
  lineCode?: string;
  branchCode?: string;
  areaCode?: string;
}

export default function EventClosureScreen({ navigation }: EventClosureScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [cartonEtiquette, setCartonEtiquette] = useState<string>('');
  const [cartonBarcode, setCartonBarcode] = useState<string>('');
  const [scannedItems, setScannedItems] = useState<string[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successPackageId, setSuccessPackageId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [packageCount, setPackageCount] = useState<number>(0);
  const [distributionPointNumber, setDistributionPointNumber] = useState<number | undefined>();
  const [distributionPointName, setDistributionPointName] = useState<string | undefined>();
  const [lineCode, setLineCode] = useState<string | undefined>();
  const [branchCode, setBranchCode] = useState<string | undefined>();
  const [pointCode, setPointCode] = useState<string | undefined>();
  const [containerBarcode, setContainerBarcode] = useState<string>('');
  const [pudoAddress, setPudoAddress] = useState<string | undefined>();
  const [currentContainerDetails, setCurrentContainerDetails] = useState<ContainerDetails | null>(null);
  const [showContainerSummary, setShowContainerSummary] = useState<boolean>(false);
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [scanningField, setScanningField] = useState<'etiquette' | 'barcode'>('etiquette');

  // Mock counter for demonstration
  const totalScanned = scannedItems.length;

  const handleConfirm = async () => {
    // Validate inputs
    if (!cartonEtiquette.trim() && !cartonBarcode.trim()) {
      setErrorMessage('יש למלא את שני השדות');
      setShowErrorModal(true);
      return;
    }

    const handcuffBarcode = cartonEtiquette.trim(); // PCC barcode from first field
    const shotBarcode = cartonBarcode.trim(); // CH barcode from second field

    // Check if already scanned
    if (scannedItems.includes(handcuffBarcode)) {
      setErrorMessage('האזיקון כבר נסרק');
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    
    try {
      // Correct field assignment:
      // First field (סרוק אזיקון): Container number or PCC barcode
      // Second field (סרוק ברקוד-שוט): Exit number
      
      let exitNum = 1; // Default
      let containerIdentifier = handcuffBarcode; // Container number or PCC barcode
      
      console.log('First field (container/PCC):', handcuffBarcode);
      console.log('Second field (exit):', shotBarcode);
      
      // The SECOND field should be the exit number
      if (!isNaN(Number(shotBarcode)) && shotBarcode.length > 0) {
        exitNum = parseInt(shotBarcode, 10);
        console.log('Using second field as exit number:', exitNum);
      }
      // Fallback: if second field is empty but first field looks like an exit (small number)
      else if (!isNaN(Number(handcuffBarcode)) && handcuffBarcode.length <= 4) {
        exitNum = parseInt(handcuffBarcode, 10);
        containerIdentifier = ''; // No container specified
        console.log('Using first field as exit number (fallback):', exitNum);
      }
      
      const request: CloseContainerRequest = {
        sessionId: 1,           // Placeholder - should come from worker session
        driverId: 1,            // Placeholder - should come from logged-in driver
        exitNumber: exitNum,    // Exit number from second field
        handcuffBarcode: containerIdentifier  // Container from first field
      };
      
      console.log('Final request being sent:', request);
      
      // Use the standard closeContainer endpoint (uses SgirtMarz)
      const response = await sortingAPI.closeContainer(request);
      
      // Response is wrapped in ApiResponse with data property
      if (response.success && response.data) {
        // DEBUG: Log what we're getting from backend
        console.log('=== RECEIVED FROM BACKEND ===');
        console.log('containerBarcode:', response.data.containerBarcode);
        console.log('packageCount:', response.data.packageCount);
        console.log('distributionPoint:', response.data.distributionPoint);
        console.log('distributionPointName:', response.data.distributionPointName);
        console.log('lineCode:', response.data.lineCode);
        console.log('branchCode:', response.data.branchCode);
        console.log('areaCode:', response.data.areaCode);
        console.log('=== END BACKEND DATA ===');
        
        // Add to scanned items
        const barcodeToStore = response.data.containerBarcode || handcuffBarcode;
        setScannedItems([...scannedItems, barcodeToStore]);
        setSuccessPackageId(barcodeToStore);
        setContainerBarcode(barcodeToStore);
        
        // Set package count from API response - NO FALLBACK
        setPackageCount(response.data.packageCount || 0);
        
        // Set distribution point data if available from backend - NO MOCK DATA
        let distPointNum = exitNum;
        if (response.data.distributionPoint) {
          const parsedNum = parseInt(response.data.distributionPoint, 10);
          if (!isNaN(parsedNum)) {
            distPointNum = parsedNum;
            setDistributionPointNumber(parsedNum);
          }
        }
        if (response.data.distributionPointName) {
          setDistributionPointName(response.data.distributionPointName);
        }
        if (response.data.lineCode) {
          setLineCode(response.data.lineCode);
        }
        if (response.data.branchCode) {
          setBranchCode(response.data.branchCode);
        }
        if (response.data.areaCode) {
          setPointCode(response.data.areaCode);
        }
        
        // Call FindShipmentsByID to get additional distribution details
        try {
          console.log('Calling FindShipmentsByID with container barcode:', barcodeToStore);
          const shipmentResponse = await operationalAppAPI.getShipmentByNumber(barcodeToStore);
          
          console.log('=== SHIPMENT RESPONSE FROM COURIER-API ===');
          console.log('Full response:', JSON.stringify(shipmentResponse, null, 2));
          
          // Extract distribution information from the shipment response
          if (shipmentResponse && shipmentResponse.success && shipmentResponse.data && shipmentResponse.data.length > 0) {
            // Use the actual shipment count since backend returns 0
            const actualPackageCount = shipmentResponse.data.length;
            console.log('Actual package count from shipments:', actualPackageCount);
            setPackageCount(actualPackageCount);  // Override the 0 from backend
            
            const firstShipmentData = shipmentResponse.data[0];
            
            // Check if we have a Shipment object with distribution info
            if (firstShipmentData.shipment) {
              const shipment = firstShipmentData.shipment;
              
              console.log('DistributionLine:', shipment.distributionLine);
              console.log('DistributionArea:', shipment.distributionArea);
              console.log('DistributionSegment:', shipment.distributionSegment);
              
              // Update distribution data with values from FindShipmentsByID
              if (shipment.distributionLine) {
                setLineCode(shipment.distributionLine.toString());
              }
              if (shipment.distributionArea) {
                setPointCode(shipment.distributionArea.toString());
              }
              if (shipment.distributionSegment) {
                // Use segment as additional area info if needed
                console.log('Segment:', shipment.distributionSegment);
              }
            }
            
            // Check for Pudo info if available
            if (firstShipmentData.pudo) {
              const pudo = firstShipmentData.pudo;
              console.log('PUDO Info:', pudo);
              
              if (pudo.pudoName) {
                setDistributionPointName(pudo.pudoName);
              }
              if (pudo.pudoId) {
                setDistributionPointNumber(pudo.pudoId);
              }
              if (pudo.pudoAddress) {
                setPudoAddress(pudo.pudoAddress);
              }
            }
          }
        } catch (shipmentError) {
          // Don't fail the whole operation if we can't get additional details
          console.error('Error fetching shipment details from FindShipmentsByID:', shipmentError);
          console.log('Continuing with data from closeContainer response only');
        }
        
        // DO NOT set mock data - only show what backend provides!
        // Comment out mock data to see ONLY real data
        /*
        if (!response.data.distributionPoint && !response.data.distributionPointName) {
          // Mock distribution point data matching Figma
          setDistributionPointNumber(5432);
          setDistributionPointName('צ\'יטה שופס חולון');
          setLineCode('4');
          setPointCode('12');
          setBranchCode('480');
        }
        */
        
        // Create container details for summary view - ONLY REAL DATA
        const containerDetails: ContainerDetails = {
          containerNumber: response.data.containerNumber,
          containerBarcode: barcodeToStore,
          exitNumber: exitNum,
          packageCount: response.data.packageCount || 0,
          distributionPointNumber: distPointNum || exitNum,
          distributionPointName: response.data.distributionPointName,  // NO FALLBACK - show only real data
          pudoAddress: pudoAddress,  // PUDO address from API
          lineCode: response.data.lineCode,  // NO FALLBACK
          branchCode: response.data.branchCode,  // NO FALLBACK
          areaCode: response.data.areaCode  // NO FALLBACK
        };
        
        setCurrentContainerDetails(containerDetails);
        setShowContainerSummary(true);
        setShowSuccessModal(true);
        
        // Clear inputs
        setCartonEtiquette('');
        setCartonBarcode('');
      } else {
        // Check for Hebrew message first, then English errorMessage, then default
        const errorMsg = response.data?.message || 
                        response.data?.errorMessage || 
                        response.errorMessage || 
                        'שגיאה בסגירת מארז';
        setErrorMessage(errorMsg);
        setShowErrorModal(true);
      }
    } catch (error: any) {
      console.error('Error closing container:', error);
      // CourierApi returns ResponseDTO with nested data structure
      // The actual error is in error.response.data.data (nested)
      const errorData = error?.response?.data?.data;
      const errorMsg = errorData?.message ||           // Hebrew message from backend
                      errorData?.errorMessage ||       // English error message
                      error?.response?.data?.message || // Direct message
                      error?.response?.data?.errorMessage || // Direct error
                      error?.message ||                // Generic error
                      'שגיאה בתקשורת עם השרת';
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    setSuccessPackageId('');
    // Reset the container summary view to show empty form for next container
    setShowContainerSummary(false);
    setCurrentContainerDetails(null);
    // Clear any lingering data
    setPackageCount(0);
    setDistributionPointNumber(undefined);
    setDistributionPointName(undefined);
    setLineCode(undefined);
    setBranchCode(undefined);
    setPointCode(undefined);
    setContainerBarcode('');
  };

  const handleCloseError = () => {
    setShowErrorModal(false);
    setErrorMessage('');
  };

  // Barcode Scanner handlers
  const handleBarcodeScanned = (scannedCode: string) => {
    console.log('Barcode scanned:', scannedCode);
    if (scanningField === 'etiquette') {
      setCartonEtiquette(scannedCode);
    } else {
      setCartonBarcode(scannedCode);
    }
    setShowScanner(false);
  };

  const openBarcodeScanner = (field: 'etiquette' | 'barcode') => {
    setScanningField(field);
    setShowScanner(true);
  };

  const renderScannedItem = ({ item, index }: { item: string; index: number }) => (
    <View style={styles.scannedItem}>
      <Text style={styles.scannedItemText}>{item}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>→</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>סגירת מארזים</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'new' && styles.activeTab]}
          onPress={() => setActiveTab('new')}
        >
          <Text style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}>
            חדש
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            מארזים סגורים({totalScanned})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonIcon}>📋</Text>
          <Text style={styles.actionButtonText}>הזנה ידנית</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => openBarcodeScanner('etiquette')}
        >
          <Text style={styles.actionButtonIcon}>📷</Text>
          <Text style={styles.actionButtonText}>סריקה ברקוד</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'new' ? (
        showContainerSummary && currentContainerDetails ? (
          // Container Summary View (after successful closure)
          <View style={styles.content}>
            {/* Container Barcode Display */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>הקלד/סרוק אזיקון</Text>
              <View style={styles.displayField}>
                <Text style={styles.displayFieldText}>{currentContainerDetails.containerBarcode}</Text>
              </View>
            </View>

            {/* Distribution Point Number */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>הקלד נקודת חלוקה</Text>
              <View style={styles.displayField}>
                <Text style={styles.displayFieldText}>{currentContainerDetails.exitNumber}</Text>
              </View>
            </View>

            {/* Location Details - ONLY show if we have real data */}
            {(currentContainerDetails.distributionPointName || currentContainerDetails.branchCode || currentContainerDetails.lineCode || currentContainerDetails.areaCode) && (
              <View style={styles.locationSection}>
                {currentContainerDetails.distributionPointName && (
                  <Text style={styles.locationTitle}>
                    {currentContainerDetails.distributionPointName}
                  </Text>
                )}
                {!currentContainerDetails.distributionPointName && (
                  <Text style={styles.locationTitle}>
                    יציאה {currentContainerDetails.exitNumber}
                  </Text>
                )}
                
                {/* Location Badges - only show if we have real data */}
                <View style={styles.badgesContainer}>
                  {currentContainerDetails.branchCode && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>סניף {currentContainerDetails.branchCode}</Text>
                    </View>
                  )}
                  {currentContainerDetails.areaCode && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>אזור הפצה {currentContainerDetails.areaCode}</Text>
                    </View>
                  )}
                  {currentContainerDetails.lineCode && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>קו {currentContainerDetails.lineCode}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        ) : (
          // Original input form
          <View style={styles.content}>
            {/* Handcuff Barcode Section (PCC) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>סרוק אזיקון</Text>
              <TextInput
                style={styles.input}
                value={cartonEtiquette}
                onChangeText={setCartonEtiquette}
                placeholder="PCC12345678"
                placeholderTextColor="#999"
                textAlign="center"
                returnKeyType="next"
              />
            </View>

            {/* Shot Barcode Section (CH) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>סרוק ברקוד-שוט</Text>
              <TextInput
                style={styles.input}
                value={cartonBarcode}
                onChangeText={setCartonBarcode}
                placeholder="CH25201"
                placeholderTextColor="#999"
                textAlign="center"
                returnKeyType="done"
                onSubmitEditing={handleConfirm}
              />
            </View>
          </View>
        )
      ) : (
        <View style={styles.content}>
          <Text style={styles.listTitle}>רשימת אייקונים שנכנסו</Text>
          {scannedItems.length > 0 ? (
            <FlatList
              data={scannedItems}
              renderItem={renderScannedItem}
              keyExtractor={(item, index) => `${item}-${index}`}
              style={styles.list}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>אין פריטים סרוקים</Text>
            </View>
          )}
          
          {/* Pagination */}
          {scannedItems.length > 0 && (
            <View style={styles.pagination}>
              <TouchableOpacity style={styles.paginationButton}>
                <Text style={styles.paginationButtonText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.paginationText}>1/{Math.max(1, Math.ceil(scannedItems.length / 10))}</Text>
              <TouchableOpacity style={styles.paginationButton}>
                <Text style={styles.paginationButtonText}>›</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity 
          style={[styles.button, styles.confirmButton, loading && styles.disabledButton]}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.confirmButtonText}>אישור</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>ביטול</Text>
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseSuccess}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContent}>
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={handleCloseSuccess}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>סגירת מארזים</Text>
            
            <View style={styles.packageCountContainer}>
              <Text style={styles.packageCountText}>{packageCount} 📦</Text>
            </View>
            
            <View style={styles.successCheckContainer}>
              <Text style={styles.successCheckmark}>✓</Text>
            </View>
            
            <Text style={styles.successMessage}>
              מארז {successPackageId}
            </Text>
            <Text style={styles.successSubMessage}>
              נסגר בהצלחה!
            </Text>
            
            {/* Distribution Point Information - Only show if we have real data */}
            {(distributionPointName || pudoAddress || lineCode || branchCode || pointCode) && (
              <View style={styles.distributionInfo}>
                {distributionPointName && (
                  <Text style={styles.distributionPointTitle}>
                    {distributionPointName}
                    {distributionPointNumber && ` - ${distributionPointNumber}`}
                  </Text>
                )}
                {pudoAddress && (
                  <Text style={styles.locationSubtitle}>{pudoAddress}</Text>
                )}
                
                {/* Location Badges */}
                <View style={styles.badgesContainer}>
                  {lineCode && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>קו {lineCode}</Text>
                    </View>
                  )}
                  {pointCode && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>אזור הפצה {pointCode}</Text>
                    </View>
                  )}
                  {branchCode && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>סניף {branchCode}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={handleCloseSuccess}
            >
              <Text style={styles.modalButtonText}>סיום</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseError}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.errorIcon}>
              <Text style={styles.errorIconText}>⚠</Text>
            </View>
            
            <Text style={styles.errorTitle}>שים לב</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={handleCloseError}
            >
              <Text style={styles.modalButtonText}>אישור</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Barcode Scanner Modal */}
      <Modal
        visible={showScanner}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        <SafeAreaView style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity 
              onPress={() => setShowScanner(false)}
              style={styles.scannerCloseButton}
            >
              <Text style={styles.scannerCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>
              סריקת {scanningField === 'etiquette' ? 'אזיקון' : 'ברקוד-שוט'}
            </Text>
          </View>
          
          <AppBarcodeScanner 
            onBarcodeScanned={handleBarcodeScanned}
            handleNoPermission={() => setShowScanner(false)}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    right: 20,
    padding: 5,
  },
  backArrow: {
    fontSize: 24,
    color: '#000',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingTop: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabInfo: {
    flex: 1,
  },
  tabInfoText: {
    fontSize: 14,
    color: '#999',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  activeTab: {
    borderBottomColor: '#0088FF',
  },
  tabText: {
    fontSize: 14,
    color: '#999',
  },
  activeTabText: {
    color: '#0088FF',
    fontWeight: '600',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 15,
    backgroundColor: '#FFFFFF',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0088FF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    gap: 8,
  },
  actionButtonIcon: {
    fontSize: 20,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#0088FF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    backgroundColor: '#E8E8E8',
    borderRadius: 25,
    padding: 18,
    fontSize: 18,
    color: '#000',
  },
  listTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  scannedItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scannedItemText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    color: '#999',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 20,
  },
  paginationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paginationButtonText: {
    fontSize: 24,
    color: '#333',
  },
  paginationText: {
    fontSize: 16,
    color: '#333',
  },
  bottomButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: '#5CB3FF',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0088FF',
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0088FF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  successModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#4CAF50',
    padding: 30,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalClose: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
  },
  modalCloseText: {
    fontSize: 24,
    color: '#666',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successIconText: {
    fontSize: 32,
    marginBottom: 10,
  },
  packageCountContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  packageCountText: {
    fontSize: 20,
    color: '#000',
  },
  successCheckContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  successCheckmark: {
    fontSize: 60,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  successMessage: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 5,
    color: '#000',
    fontWeight: '600',
  },
  successSubMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#000',
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorIconText: {
    fontSize: 48,
    color: '#000',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
    color: '#666',
  },
  modalButton: {
    backgroundColor: '#0088FF',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 60,
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  distributionInfo: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    alignItems: 'center',
  },
  distributionPointTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
    textAlign: 'center',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  badge: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  displayField: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  displayFieldText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  locationSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
    textAlign: 'center',
  },
  locationSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scannerHeader: {
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  scannerCloseButton: {
    position: 'absolute',
    left: 20,
    padding: 5,
  },
  scannerCloseText: {
    fontSize: 24,
    color: '#000',
  },
  scannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
});
