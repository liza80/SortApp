import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, TextInput, Platform, ScrollView, Modal, FlatList } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { sortingAPI, shipmentsAPI, operationalAppAPI } from '../config/api';
import { ShipmentResponse, Shipment, DriverTip, PudoResponse } from '../types/api.types';
import ActionButton from '../components/ActionButton';

// Conditionally import AppBarcodeScanner only on native platforms
// Wrapped in try-catch to handle Expo Go which doesn't support VisionCamera
let AppBarcodeScanner: any = null;
let isScannerAvailable = false;
if (Platform.OS !== 'web') {
  try {
    AppBarcodeScanner = require('../components/AppBarcodeScanner').default;
    isScannerAvailable = true;
  } catch (error) {
    console.warn('VisionCamera not available (Expo Go). Use manual input instead.', error);
    isScannerAvailable = false;
  }
}

type BarcodeScanScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BarcodeScan'>;
type BarcodeScanScreenRouteProp = RouteProp<RootStackParamList, 'BarcodeScan'>;

interface BarcodeScanScreenProps {
  navigation: BarcodeScanScreenNavigationProp;
  route: BarcodeScanScreenRouteProp;
}

// Interface for scanned package
interface ScannedPackage {
  id: string;
  shipmentData: ShipmentResponse;
  scanTime: Date;
  status: 'success' | 'error' | 'pending';
  packageType: 'מקור' | 'יעד';
}

export default function BarcodeScanScreen({ navigation, route }: BarcodeScanScreenProps) {
  const { title, count, headerColor } = route.params;
  // Default to manual mode on web or when scanner unavailable
  const isWeb = Platform.OS === 'web';
  const canUseScanner = !isWeb && isScannerAvailable;
  const [scanMode, setScanMode] = useState<'manual' | 'barcode'>('manual');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [shipmentResponseData, setShipmentResponseData] = useState<ShipmentResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [showScanner, setShowScanner] = useState(false);
  
  // New states for list view
  const [currentScannedPackage, setCurrentScannedPackage] = useState<ShipmentResponse | null>(null);
  const [scannedPackages, setScannedPackages] = useState<ScannedPackage[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'scanned' | 'errors'>('all');
  const [showListView, setShowListView] = useState(false);
  const [showCustomsAlert, setShowCustomsAlert] = useState(false);
  const [customsAlertMessage, setCustomsAlertMessage] = useState('');

  const handleBarcodeScanned = async (code: string) => {
    console.log('Barcode scanned:', code);
    setInputValue(code);
    // Pass the code directly to handleConfirm instead of relying on state
    await handleConfirm(code);
  };

  const handleConfirm = async (scannedCode?: string) => {
    // Use the passed code or fall back to input value
    const codeToProcess = scannedCode || inputValue;
    
    console.log('=== handleConfirm called ===');
    console.log('Code to process:', codeToProcess);
    console.log('Current shipmentResponseData:', shipmentResponseData);
    console.log('EventCode (count):', count);
    
    if (!codeToProcess.trim()) {
      setError('נא להזין ברקוד');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      let currentShipmentData = shipmentResponseData;
      
      // If we don't have shipment data yet, fetch it first
      if (!currentShipmentData) {
        console.log('Fetching shipment data for:', codeToProcess);
        const shipmentResponse = await operationalAppAPI.getShipmentByNumber(codeToProcess);
        console.log('Shipment response:', shipmentResponse);
        
        if (shipmentResponse.success && shipmentResponse.data && shipmentResponse.data.length > 0) {
          console.log('Shipment data found:', shipmentResponse.data[0]);
          currentShipmentData = shipmentResponse.data[0];
          
          // Check if shipment is delayed (at customs)
          if (currentShipmentData.isDelayedShipment) {
            console.log('Shipment is delayed at customs:', codeToProcess);
            setCustomsAlertMessage(`שים לב משלוח מעוכב במכס!\n\nמשלוח ${codeToProcess} מעוכב ואסור למיין אותו.\nיש להחזיר את המשלוח מיידית לסיסוף עמילות`);
            setShowCustomsAlert(true);
            setInputValue(''); // Clear input for next scan
            setLoading(false);
            return;
          }
          
          setShipmentResponseData(currentShipmentData);
        } else {
          console.log('No shipment found or error:', shipmentResponse);
          setError('לא נמצא משלוח');
          setLoading(false);
          return;
        }
      }
      
      // Now send the update operation to record the scan
      console.log('Sending update operation for:', codeToProcess);
      const updateData = {
        EventCode: count, // 83, 53, 600, or 109
        MsgDateTime: new Date().toISOString(),
        MsgData: {
          DriverId: 6001,
          ShipmentsList: [{
            ShipmentId: codeToProcess,
            ActualQuantity: 1,
            IsScan: scanMode === 'barcode' || !!scannedCode // true if barcode scan or scanned code passed
          }],
          Coordinates: ''
        }
      };
      console.log('Update data:', updateData);
      
      const data = await shipmentsAPI.updateOperations([updateData]);
      console.log('Update response:', data);
      
      if (data.success) {
        setResult({
          success: true,
          message: 'ברקוד נסרק בהצלחה',
          shipmentQuantity: 1,
          errorQuantity: 0,
          containerQuantity: 0,
          lastBarcode: codeToProcess
        });
        
        // Set current package and add to list
        setCurrentScannedPackage(currentShipmentData);
        
        // Add package to list
        const newPackage: ScannedPackage = {
          id: String(currentShipmentData.shipment.shipmentId),
          shipmentData: currentShipmentData,
          scanTime: new Date(),
          status: 'success',
          packageType: currentShipmentData.shipment.shipmentType === 2 ? 'יעד' : 'מקור'
        };
        setScannedPackages([...scannedPackages, newPackage]);
        
        // Don't switch to list view automatically - keep scanning interface active
        // setShowListView(true);  // Commented out to keep scanning active
        setActiveTab('all');
        
        // Clear the input field and shipment data for next scan
        setInputValue('');
        setShipmentResponseData(null); // Clear for next scan
        
        // Keep scanner modal open if it was open
        // Scanner will stay open for continuous scanning
      } else {
        setError('שגיאה בסריקת ברקוד');
      }
    } catch (err: any) {
      console.error('Scan error details:', err);
      console.error('Error response:', err.response?.data);
      
      // Always show Hebrew error message
      // Check if it's a 404 (not found) error
      if (err.response?.status === 404) {
        setError('לא נמצא משלוח');
      } else {
        setError('שגיאת תקשורת עם השרת');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Dynamic Header */}
      <View style={[styles.header, { backgroundColor: headerColor }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backArrow}>→</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title} ({count})</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsRow}>
        <ActionButton
          type="manual"
          onPress={() => setScanMode('manual')}
          label="הזנה ידנית"
        />

        <ActionButton
          type="barcode"
          onPress={() => {
            if (canUseScanner) {
              setShowScanner(true);
            }
          }}
          label={canUseScanner ? "סריקת ברקוד" : "סריקת ברקוד (לא זמין)"}
        />
      </View>

      {/* Tabs - Always visible */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'errors' && styles.activeTab]}
          onPress={() => {
            setActiveTab('errors');
            setShowListView(true);
          }}
        >
          <Text style={[styles.tabText, activeTab === 'errors' && styles.activeTabText]}>
            שגויים {scannedPackages.filter(p => p.status === 'error').length > 0 && 
              `(${scannedPackages.filter(p => p.status === 'error').length})`}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'scanned' && styles.activeTab]}
          onPress={() => {
            setActiveTab('scanned');
            setShowListView(true);
          }}
        >
          <Text style={[styles.tabText, activeTab === 'scanned' && styles.activeTabText]}>
            נסרקו {scannedPackages.filter(p => p.status === 'success').length > 0 && 
              `(${scannedPackages.filter(p => p.status === 'success').length})`}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => {
            setActiveTab('all');
            setShowListView(false);
          }}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            סרוק
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
        <View style={styles.content}>
          {showListView ? (
            <>

              {/* Package List */}
              <FlatList
                data={scannedPackages.filter(p => 
                  activeTab === 'all' ? true :
                  activeTab === 'scanned' ? p.status === 'success' :
                  activeTab === 'errors' ? p.status === 'error' : false
                )}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  activeTab === 'all' ? (
                    // Show both source and destination cards in סרוק tab
                    <View style={styles.doubleCardContainer}>
                      <Text style={styles.shipmentIdText}>משלוח {item.shipmentData.shipment.shipmentId}</Text>
                      
                      {/* Source Card */}
                      <View style={[styles.detailCard, styles.sourceCard]}>
                        <View style={styles.cardHeader}>
                          <View style={styles.packageIconContainer}>
                            <Text style={styles.packageIconText}>📦</Text>
                            <Text style={styles.packageQuantity}>{item.shipmentData.shipment.actualQuantity || 2}</Text>
                          </View>
                        </View>
                        <Text style={styles.cardLabel}>מקור</Text>
                        <Text style={styles.cardAddress}>
                          {item.shipmentData.shipment.sourceName || 'פוקוס חום בע״מ'}
                        </Text>
                        <Text style={styles.cardCity}>
                          {item.shipmentData.shipment.sourceAddress || 'ארלוזורוב 33 רמת גן'}
                        </Text>
                        
                        <View style={styles.cardTags}>
                          {item.shipmentData.shipment.distributionLine && (
                            <View style={styles.lightTag}>
                              <Text style={styles.lightTagText}>קו {item.shipmentData.shipment.distributionLine}</Text>
                            </View>
                          )}
                          {item.shipmentData.shipment.distributionArea && (
                            <View style={styles.lightTag}>
                              <Text style={styles.lightTagText}>אזור הפצה {item.shipmentData.shipment.distributionArea}</Text>
                            </View>
                          )}
                          {item.shipmentData.shipment.distributionSegment && (
                            <View style={styles.lightTag}>
                              <Text style={styles.lightTagText}>סניף {item.shipmentData.shipment.distributionSegment}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      
                      {/* Destination Card */}
                      <View style={[styles.detailCard, styles.destinationCard]}>
                        <View style={styles.cardHeader}>
                          <View style={styles.packageIconContainer}>
                            <Text style={styles.packageIconText}>📦</Text>
                            <Text style={styles.packageQuantity}>{item.shipmentData.shipment.actualQuantity || 2}</Text>
                          </View>
                        </View>
                        <Text style={styles.cardLabel}>יעד</Text>
                        <Text style={styles.cardAddress}>
                          {item.shipmentData.shipment.destinationAddress || 'צ׳יטה שופט חולון - 5432'}
                        </Text>
                        <Text style={styles.cardCity}>
                          {item.shipmentData.shipment.destinationCityCode ? 
                            `${item.shipmentData.shipment.destinationCityCode}, חולון` : 
                            'אריה שקנר 4, חולון'}
                        </Text>
                        
                        <View style={styles.cardTags}>
                          {item.shipmentData.shipment.distributionLine && (
                            <View style={styles.darkTag}>
                              <Text style={styles.darkTagText}>קו {item.shipmentData.shipment.distributionLine}</Text>
                            </View>
                          )}
                          {item.shipmentData.shipment.distributionArea && (
                            <View style={styles.darkTag}>
                              <Text style={styles.darkTagText}>אזור הפצה {item.shipmentData.shipment.distributionArea}</Text>
                            </View>
                          )}
                          {item.shipmentData.shipment.distributionSegment && (
                            <View style={styles.darkTag}>
                              <Text style={styles.darkTagText}>סניף {item.shipmentData.shipment.distributionSegment}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  ) : (
                    // Show different colored cards based on tab
                    <View style={[
                      styles.packageCard,
                      activeTab === 'scanned' && styles.packageCardWhite  // White for scanned
                      // Default pink for errors (no need for extra style)
                    ]}>
                      <View style={styles.packageHeader}>
                        <View style={styles.packageIconContainer}>
                          <Text style={styles.packageIconText}>📦</Text>
                          <Text style={styles.packageQuantity}>{item.shipmentData.shipment.actualQuantity || 2}</Text>
                        </View>
                        <Text style={styles.packageNumber}>{item.shipmentData.shipment.shipmentId}</Text>
                      </View>
                      
                      <Text style={styles.packageAddress}>
                        {item.shipmentData.shipment.destinationAddress || 'צ׳יטה שופט חולון - 5432'}
                      </Text>
                      <Text style={styles.packageCity}>
                        {item.shipmentData.shipment.destinationCityCode ? 
                          `${item.shipmentData.shipment.destinationCityCode}, חולון` : 
                          'אריה שקנר 4, חולון'}
                      </Text>
                      
                      <View style={styles.packageTags}>
                        {item.shipmentData.shipment.distributionLine && (
                          <View style={styles.packageTag}>
                            <Text style={styles.packageTagText}>קו {item.shipmentData.shipment.distributionLine}</Text>
                          </View>
                        )}
                        {item.shipmentData.shipment.distributionArea && (
                          <View style={styles.packageTag}>
                            <Text style={styles.packageTagText}>אזור הפצה {item.shipmentData.shipment.distributionArea}</Text>
                          </View>
                        )}
                        {item.shipmentData.shipment.distributionSegment && (
                          <View style={styles.packageTag}>
                            <Text style={styles.packageTagText}>סניף {item.shipmentData.shipment.distributionSegment}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )
                )}
                contentContainerStyle={styles.listContent}
              />
            </>
          ) : (
            <>
              <ScrollView style={styles.scrollContent} contentContainerStyle={styles.contentContainer}>
                <Text style={styles.contentTitle}>הקלד/סרוק חבילה או שק</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>מספר</Text>
                  <TextInput
                    style={styles.input}
                    value={inputValue}
                    onChangeText={setInputValue}
                    placeholder=""
                    keyboardType="default"
                    autoFocus={true}
                    editable={!loading}
                  />
                </View>

                {/* Show current scanned package cards (both source and destination) */}
                {currentScannedPackage && !error && (
                  <View style={styles.scannedCardContainer}>
                    <Text style={styles.scannedShipmentNumber}>
                      משלוח {currentScannedPackage.shipment.shipmentId}
                    </Text>
                    
                    {/* Source Card */}
                    <View style={styles.scannedSourceCard}>
                      <View style={styles.scannedCardHeader}>
                        <View style={styles.packageIconContainer}>
                          <Text style={styles.packageIcon}>📦</Text>
                          <Text style={styles.packageCount}>{currentScannedPackage.shipment.actualQuantity || 2}</Text>
                        </View>
                      </View>
                      
                      <Text style={styles.scannedCardLabel}>מקור</Text>
                      <Text style={styles.scannedCardAddress}>
                        {currentScannedPackage.shipment.sourceName || 'פוקוס חום בע״מ'}
                      </Text>
                      <Text style={styles.scannedCardCity}>
                        {currentScannedPackage.shipment.sourceAddress || 'ארלוזורוב 33 רמת גן'}
                      </Text>
                      
                      <View style={styles.scannedCardTags}>
                        {currentScannedPackage.shipment.distributionLine && (
                          <View style={styles.scannedLightTag}>
                            <Text style={styles.scannedLightTagText}>קו {currentScannedPackage.shipment.distributionLine}</Text>
                          </View>
                        )}
                        {currentScannedPackage.shipment.distributionArea && (
                          <View style={styles.scannedLightTag}>
                            <Text style={styles.scannedLightTagText}>אזור הפצה {currentScannedPackage.shipment.distributionArea}</Text>
                          </View>
                        )}
                        {currentScannedPackage.shipment.distributionSegment && (
                          <View style={styles.scannedLightTag}>
                            <Text style={styles.scannedLightTagText}>סניף {currentScannedPackage.shipment.distributionSegment}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    
                    {/* Destination Card */}
                    <View style={styles.scannedDestinationCard}>
                      <View style={styles.scannedCardHeader}>
                        <View style={styles.packageIconContainer}>
                          <Text style={styles.packageIcon}>📦</Text>
                          <Text style={styles.packageCount}>{currentScannedPackage.shipment.actualQuantity || 2}</Text>
                        </View>
                      </View>
                      
                      <Text style={styles.scannedCardLabel}>יעד</Text>
                      <Text style={styles.scannedCardAddress}>
                        {'צ׳יטה שופט חולון - 5432'}
                      </Text>
                      <Text style={styles.scannedCardCity}>
                        {currentScannedPackage.shipment.destinationAddress || 'אריה שקנר 4, חולון'}
                      </Text>
                      
                      <View style={styles.scannedCardTags}>
                        {currentScannedPackage.shipment.distributionLine && (
                          <View style={styles.scannedTag}>
                            <Text style={styles.scannedTagText}>קו {currentScannedPackage.shipment.distributionLine}</Text>
                          </View>
                        )}
                        {currentScannedPackage.shipment.distributionArea && (
                          <View style={styles.scannedTag}>
                            <Text style={styles.scannedTagText}>אזור הפצה {currentScannedPackage.shipment.distributionArea}</Text>
                          </View>
                        )}
                        {currentScannedPackage.shipment.distributionSegment && (
                          <View style={styles.scannedTag}>
                            <Text style={styles.scannedTagText}>סניף {currentScannedPackage.shipment.distributionSegment}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                )}

          {/* Loading State */}
          {loading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>סורק...</Text>
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>❌ {error}</Text>
            </View>
          )}

          {/* Shipment Data Display */}
          {shipmentResponseData && !error && result && (
            <View style={styles.shipmentDataContainer}>
            <Text style={styles.shipmentDataTitle}>📦 פרטי משלוח</Text>
            
            {/* Return Shipment Badge */}
            {shipmentResponseData.shipment.shipmentType === 2 && (
              <View style={styles.returnShipmentBadge}>
                <Text style={styles.returnShipmentText}>🔄 משלוח חוזר</Text>
              </View>
            )}

            
            <View style={styles.shipmentDataRow}>
              <Text style={styles.shipmentDataLabel}>מספר משלוח</Text>
              <Text style={styles.shipmentDataValue}>{shipmentResponseData.shipment.shipmentId}</Text>
            </View>

            {shipmentResponseData.shipment.customerName && (
              <View style={styles.shipmentDataRow}>
                <Text style={styles.shipmentDataLabel}>שם לקוח</Text>
                <Text style={styles.shipmentDataValue}>{shipmentResponseData.shipment.customerName}</Text>
              </View>
            )}

            {shipmentResponseData.shipment.destinationAddress && (
              <View style={styles.shipmentDataRow}>
                <Text style={styles.shipmentDataLabel}>כתובת יעד</Text>
                <Text style={styles.shipmentDataValue}>{shipmentResponseData.shipment.destinationAddress}</Text>
              </View>
            )}

            {shipmentResponseData.shipment.consigneePhone && (
              <View style={styles.shipmentDataRow}>
                <Text style={styles.shipmentDataLabel}>טלפון</Text>
                <Text style={styles.shipmentDataValue}>{shipmentResponseData.shipment.consigneePhone}</Text>
              </View>
            )}

            {/* Show Line, Branch, and Distribution Point for all shipments with this data */}
            {shipmentResponseData.shipment.distributionLine && (
              <View style={styles.shipmentDataRow}>
                <Text style={styles.shipmentDataLabel}>קו</Text>
                <Text style={styles.shipmentDataValue}>{shipmentResponseData.shipment.distributionLine}</Text>
              </View>
            )}

            {shipmentResponseData.shipment.distributionArea && (
              <View style={styles.shipmentDataRow}>
                <Text style={styles.shipmentDataLabel}>סניף</Text>
                <Text style={styles.shipmentDataValue}>{shipmentResponseData.shipment.distributionArea}</Text>
              </View>
            )}

            {(shipmentResponseData.shipment.distributionSegment !== null && shipmentResponseData.shipment.distributionSegment !== undefined) && (
              <View style={styles.shipmentDataRow}>
                <Text style={styles.shipmentDataLabel}>נקודת חלוקה</Text>
                <Text style={styles.shipmentDataValue}>{shipmentResponseData.shipment.distributionSegment}</Text>
              </View>
            )}

            {/* Only show PUDO for non-return shipments */}
            {shipmentResponseData.shipment.shipmentType !== 3 && (
              <>
                {shipmentResponseData.pudo && (
                  <>
                    <Text style={styles.sectionTitle}>📍 נקודת איסוף (PUDO)</Text>
                    <View style={styles.shipmentDataRow}>
                      <Text style={styles.shipmentDataLabel}>שם</Text>
                      <Text style={styles.shipmentDataValue}>{shipmentResponseData.pudo.pudoName}</Text>
                    </View>
                    <View style={styles.shipmentDataRow}>
                      <Text style={styles.shipmentDataLabel}>כתובת</Text>
                      <Text style={styles.shipmentDataValue}>{shipmentResponseData.pudo.pudoAddress}</Text>
                    </View>
                    {shipmentResponseData.pudo.pudoPhone && (
                      <View style={styles.shipmentDataRow}>
                        <Text style={styles.shipmentDataLabel}>טלפון</Text>
                        <Text style={styles.shipmentDataValue}>{shipmentResponseData.pudo.pudoPhone}</Text>
                      </View>
                    )}
                  </>
                )}
              </>
            )}

            {/* Only show driver tips for non-return shipments */}
            {shipmentResponseData.shipment.shipmentType !== 3 && shipmentResponseData.driverTipList && shipmentResponseData.driverTipList.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>💡 טיפים לנהג</Text>
                {shipmentResponseData.driverTipList.map((tip, index) => (
                  <View key={index} style={styles.tipContainer}>
                    <Text style={styles.tipText}>• {tip.tipText}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
          )}
          </ScrollView>
            </>
          )}
        </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity 
          style={styles.confirmButton}
          onPress={() => handleConfirm()}
        >
          <Text style={styles.confirmButtonText}>אישור</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={handleCancel}
        >
          <Text style={styles.cancelButtonText}>ביטול</Text>
        </TouchableOpacity>
      </View>

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
              סריקת חבילה
            </Text>
          </View>
          
          <AppBarcodeScanner 
            onBarcodeScanned={(code: string) => {
              console.log('Scanned barcode:', code);
              handleBarcodeScanned(code);
              // Don't close scanner modal - allow continuous scanning
              // setShowScanner(false);  // Commented out for continuous scanning
            }}
            handleNoPermission={() => setShowScanner(false)}
          />
        </SafeAreaView>
      </Modal>

      {/* Customs Alert Modal */}
      <Modal
        visible={showCustomsAlert}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCustomsAlert(false)}
      >
        <View style={styles.customsAlertOverlay}>
          <View style={styles.customsAlertContainer}>
            {/* Close button */}
            <TouchableOpacity 
              style={styles.customsAlertClose}
              onPress={() => setShowCustomsAlert(false)}
            >
              <Text style={styles.customsAlertCloseText}>✕</Text>
            </TouchableOpacity>
            
            {/* Warning icon */}
            <View style={styles.customsAlertIconContainer}>
              <Text style={styles.customsAlertIcon}>!</Text>
            </View>
            
            {/* Message */}
            <View style={styles.customsAlertMessageContainer}>
              <Text style={styles.customsAlertMessage}>
                {customsAlertMessage}
              </Text>
            </View>
            
            {/* OK Button */}
            <TouchableOpacity 
              style={styles.customsAlertButton}
              onPress={() => setShowCustomsAlert(false)}
            >
              <Text style={styles.customsAlertButtonText}>אישור</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  backArrow: {
    fontSize: 22,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    letterSpacing: -0.3,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: 'transparent',
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0066CC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#0066CC',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066CC',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  toggleButtonDisabled: {
    backgroundColor: '#E0E0E0',
    borderColor: '#B0B0B0',
    opacity: 0.6,
  },
  toggleButtonTextDisabled: {
    color: '#999',
  },
  // Toggle View Button styles
  toggleViewContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  toggleViewButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleViewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 20,
  },
  scannerWrapper: {
    flex: 1,
    backgroundColor: '#000',
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 20,
    textAlign: 'center',
    backgroundColor: '#F9FAFB',
    fontWeight: '600',
  },
  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingVertical: 18,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.3,
  },
  loadingContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  errorContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991B1B',
    textAlign: 'center',
    lineHeight: 22,
  },
  resultContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#E8F5E9',
    borderRadius: 15,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  statBox: {
    alignItems: 'center',
    padding: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  lastBarcodeContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  lastBarcodeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  lastBarcodeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  shipmentDataContainer: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  shipmentDataTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    paddingVertical: 14,
    backgroundColor: '#F3F4F6',
    letterSpacing: -0.2,
  },
  shipmentDataRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  shipmentDataLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  shipmentDataValue: {
    fontSize: 15,
    color: '#1A1A1A',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 20,
  },
  warningText: {
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4F46E5',
    marginTop: 16,
    marginBottom: 10,
    paddingHorizontal: 20,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  tipContainer: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    marginHorizontal: 20,
    marginVertical: 4,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  tipText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
    fontWeight: '500',
  },
  returnShipmentBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  returnShipmentText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  summarySection: {
    backgroundColor: '#F5F7FA',
    padding: 15,
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scannerHeader: {
    backgroundColor: '#87CEEB',
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
  // Modal styles for package details popup
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalCardPurple: {
    backgroundColor: '#FFFFFF',
    borderColor: '#9C27B0',
    borderWidth: 2,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  modalText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  modalAddress: {
    fontSize: 15,
    color: '#333',
    marginBottom: 5,
  },
  modalDistribution: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  modalTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  tag: {
    backgroundColor: '#E5E5E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 5,
    marginBottom: 5,
  },
  tagDark: {
    backgroundColor: '#424242',
  },
  tagText: {
    fontSize: 12,
    color: '#333',
  },
  tagTextLight: {
    color: 'white',
  },
  modalOkButton: {
    backgroundColor: '#0066CC',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 40,
    alignSelf: 'center',
    marginTop: 10,
  },
  modalOkText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Tabs styles
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#0066CC',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#0066CC',
    fontWeight: '700',
  },
  // Package list styles
  listContent: {
    padding: 15,
  },
  packageCard: {
    backgroundColor: '#FFE5E5',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFB3B3',
  },
  packageCardWhite: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
  },
  packageCardRed: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  packageIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  packageIconText: {
    fontSize: 20,
  },
  packageQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  packageNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  packageAddress: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
  },
  packageCity: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
  },
  packageTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  packageTag: {
    backgroundColor: '#424242',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 5,
  },
  packageTagText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  // Source and Destination Cards styles for סרוק tab
  doubleCardContainer: {
    marginBottom: 15,
  },
  shipmentIdText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sourceCard: {
    borderColor: '#E0E0E0',
  },
  destinationCard: {
    borderColor: '#9C27B0',
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  cardAddress: {
    fontSize: 15,
    color: '#333',
    marginBottom: 5,
  },
  cardCity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  cardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  lightTag: {
    backgroundColor: '#E5E5E5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 5,
    marginBottom: 5,
  },
  lightTagText: {
    fontSize: 11,
    color: '#333',
    fontWeight: '500',
  },
  darkTag: {
    backgroundColor: '#424242',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 5,
    marginBottom: 5,
  },
  darkTagText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  // Customs Alert Modal styles
  customsAlertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customsAlertContainer: {
    backgroundColor: '#FF1744',
    borderRadius: 20,
    width: '85%',
    maxWidth: 350,
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  customsAlertClose: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
    zIndex: 1,
  },
  customsAlertCloseText: {
    fontSize: 24,
    color: '#000',
    fontWeight: 'bold',
  },
  customsAlertIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFD54F',
    borderWidth: 3,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  customsAlertIcon: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  customsAlertMessageContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 15,
    marginBottom: 20,
    width: '100%',
  },
  customsAlertMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    lineHeight: 24,
  },
  customsAlertButton: {
    backgroundColor: '#0066CC',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 50,
    marginTop: 10,
  },
  customsAlertButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // Scanned card styles (shown on scan screen after scanning)
  scannedCardContainer: {
    marginTop: 20,
  },
  scannedSourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  scannedDestinationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    borderWidth: 2,
    borderColor: '#9C27B0',
    shadowColor: '#9C27B0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scannedLightTag: {
    backgroundColor: '#E5E5E5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 5,
    marginBottom: 5,
  },
  scannedLightTagText: {
    fontSize: 11,
    color: '#333',
    fontWeight: '500',
  },
  scannedShipmentNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  scannedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    borderWidth: 2,
    borderColor: '#9C27B0',
    shadowColor: '#9C27B0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scannedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  packageIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  packageCount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  scannedCardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  scannedCardAddress: {
    fontSize: 15,
    color: '#333',
    marginBottom: 5,
  },
  scannedCardCity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  scannedCardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  scannedTag: {
    backgroundColor: '#424242',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 5,
    marginBottom: 5,
  },
  scannedTagText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
