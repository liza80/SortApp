import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, TextInput, Platform, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { sortingAPI, shipmentsAPI, operationalAppAPI } from '../config/api';
import { ShipmentResponse, Shipment, DriverTip, PudoResponse } from '../types/api.types';

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

  const handleBarcodeScanned = async (code: string) => {
    setInputValue(code);
    await handleConfirm();
  };

  const handleConfirm = async () => {
    if (!inputValue.trim()) {
      setError('נא להזין ברקוד');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setShipmentResponseData(null);

    try {
      // First, fetch shipment data from OperationalApp
      console.log('Fetching shipment data for:', inputValue);
      const shipmentResponse = await operationalAppAPI.getShipmentByNumber(inputValue);
      console.log('Shipment response:', shipmentResponse);
      
      if (shipmentResponse.success && shipmentResponse.data && shipmentResponse.data.length > 0) {
        // Store shipment response data (ShipmentResponse with additional fields)
        console.log('Shipment data found:', shipmentResponse.data[0]);
        setShipmentResponseData(shipmentResponse.data[0]);
        
        // Then, update operations with RunRequestDTO structure
        const data = await shipmentsAPI.updateOperations([{
          EventCode: count, // 83, 53, 600, or 109
          MsgDateTime: new Date().toISOString(),
          MsgData: {
            DriverId: 6001,
            ShipmentsList: [{
              ShipmentId: inputValue,
              ActualQuantity: 1,
              IsScan: scanMode === 'barcode' // true if barcode scan, false if manual
            }],
            Coordinates: ''
          }
        }]);
        
        if (data.success) {
          setResult({
            success: true,
            message: 'ברקוד נסרק בהצלחה',
            shipmentQuantity: 1,
            errorQuantity: 0,
            containerQuantity: 0,
            lastBarcode: inputValue
          });
          // Don't clear input immediately so user can see what was scanned
          // setInputValue('');
        } else {
          setError('שגיאה בסריקת ברקוד');
        }
      } else {
        // Always show Hebrew message for not found shipments
        console.log('No shipment found or error:', shipmentResponse);
        setError('לא נמצא משלוח');
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

      {/* Toggle Buttons */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            scanMode === 'manual' && styles.toggleButtonActive
          ]}
          onPress={() => setScanMode('manual')}
        >
          <Text style={[
            styles.toggleButtonText,
            scanMode === 'manual' && styles.toggleButtonTextActive
          ]}>
            📋 הזיזה ידנית
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            scanMode === 'barcode' && styles.toggleButtonActive,
            !canUseScanner && styles.toggleButtonDisabled
          ]}
          onPress={() => {
            if (canUseScanner) {
              setScanMode('barcode');
            }
          }}
          disabled={!canUseScanner}
        >
          <Text style={[
            styles.toggleButtonText,
            scanMode === 'barcode' && styles.toggleButtonTextActive,
            !canUseScanner && styles.toggleButtonTextDisabled
          ]}>
            🔍 סריקת ברקוד {!canUseScanner && (isWeb ? '(לא זמין באתר)' : '(לא זמין ב-Expo Go)')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {scanMode === 'barcode' && canUseScanner ? (
          <View style={styles.scannerContainer}>
            <AppBarcodeScanner
              onBarcodeScanned={(code: string) => {
                setInputValue(code);
                handleConfirm();
              }}
              handleNoPermission={() => {
                setError('אין הרשאת מצלמה. עבור להזנה ידנית.');
                setScanMode('manual');
              }}
            />
          </View>
        ) : (
          <>
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
          </>
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
              <Text style={styles.shipmentDataValue}>{shipmentResponseData.shipment.shipmentId}</Text>
              <Text style={styles.shipmentDataLabel}>מספר משלוח:</Text>
            </View>

            {shipmentResponseData.shipment.customerName && (
              <View style={styles.shipmentDataRow}>
                <Text style={styles.shipmentDataValue}>{shipmentResponseData.shipment.customerName}</Text>
                <Text style={styles.shipmentDataLabel}>שם לקוח:</Text>
              </View>
            )}

            {shipmentResponseData.shipment.destinationAddress && (
              <View style={styles.shipmentDataRow}>
                <Text style={styles.shipmentDataValue}>{shipmentResponseData.shipment.destinationAddress}</Text>
                <Text style={styles.shipmentDataLabel}>כתובת יעד:</Text>
              </View>
            )}

            {shipmentResponseData.shipment.consigneePhone && (
              <View style={styles.shipmentDataRow}>
                <Text style={styles.shipmentDataValue}>{shipmentResponseData.shipment.consigneePhone}</Text>
                <Text style={styles.shipmentDataLabel}>טלפון:</Text>
              </View>
            )}

            {/* Show Line, Branch, and Distribution Point for return shipments (type 3) */}
            {shipmentResponseData.shipment.shipmentType === 3 && (
              <>
                <View style={styles.shipmentDataRow}>
                  <Text style={styles.shipmentDataValue}>{shipmentResponseData.shipment.distributionLine}</Text>
                  <Text style={styles.shipmentDataLabel}>קו:</Text>
                </View>

                <View style={styles.shipmentDataRow}>
                  <Text style={styles.shipmentDataValue}>{shipmentResponseData.shipment.distributionArea}</Text>
                  <Text style={styles.shipmentDataLabel}>סניף:</Text>
                </View>

                <View style={styles.shipmentDataRow}>
                  <Text style={styles.shipmentDataValue}>{shipmentResponseData.shipment.distributionSegment || 0}</Text>
                  <Text style={styles.shipmentDataLabel}>נקודת חלוקה:</Text>
                </View>
              </>
            )}

            {/* Only show PCC and PUDO for non-return shipments */}
            {shipmentResponseData.shipment.shipmentType !== 3 && (
              <>
                {shipmentResponseData.shipment.pccId && (
                  <View style={styles.shipmentDataRow}>
                    <Text style={styles.shipmentDataValue}>{shipmentResponseData.shipment.pccId}</Text>
                    <Text style={styles.shipmentDataLabel}>PCC:</Text>
                  </View>
                )}

                <View style={styles.shipmentDataRow}>
                  <Text style={styles.shipmentDataValue}>
                    {shipmentResponseData.pudo?.pudoName || 
                     (shipmentResponseData.shipment.pudoId ? shipmentResponseData.shipment.pudoId.toString() : '0')}
                  </Text>
                  <Text style={styles.shipmentDataLabel}>נקודת חלוקה:</Text>
                </View>

                {shipmentResponseData.pudo && (
                  <>
                    <Text style={styles.sectionTitle}>📍 נקודת איסוף (PUDO)</Text>
                    <View style={styles.shipmentDataRow}>
                      <Text style={styles.shipmentDataValue}>{shipmentResponseData.pudo.pudoName}</Text>
                      <Text style={styles.shipmentDataLabel}>שם:</Text>
                    </View>
                    <View style={styles.shipmentDataRow}>
                      <Text style={styles.shipmentDataValue}>{shipmentResponseData.pudo.pudoAddress}</Text>
                      <Text style={styles.shipmentDataLabel}>כתובת:</Text>
                    </View>
                    {shipmentResponseData.pudo.pudoPhone && (
                      <View style={styles.shipmentDataRow}>
                        <Text style={styles.shipmentDataValue}>{shipmentResponseData.pudo.pudoPhone}</Text>
                        <Text style={styles.shipmentDataLabel}>טלפון:</Text>
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

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity 
          style={styles.confirmButton}
          onPress={handleConfirm}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: 10,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  backArrow: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'left',
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 15,
    paddingBottom: 20,
  },
  scannerContainer: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 15,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    textAlign: 'center',
    backgroundColor: '#F9F9F9',
  },
  bottomButtons: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#87CEEB',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0066CC',
    padding: 18,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0066CC',
  },
  loadingContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#FFF9C4',
    borderRadius: 10,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F57C00',
  },
  errorContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D32F2F',
    textAlign: 'center',
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
    marginTop: 10,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
  },
  shipmentDataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1565C0',
    textAlign: 'center',
    marginBottom: 10,
  },
  shipmentDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#BBDEFB',
  },
  shipmentDataLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#424242',
    flex: 1,
  },
  shipmentDataValue: {
    fontSize: 13,
    color: '#1565C0',
    flex: 1,
    textAlign: 'right',
    fontWeight: '500',
  },
  warningText: {
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1565C0',
    marginTop: 10,
    marginBottom: 6,
    textAlign: 'center',
  },
  tipContainer: {
    backgroundColor: '#FFF9C4',
    padding: 8,
    marginVertical: 3,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#F57C00',
  },
  tipText: {
    fontSize: 13,
    color: '#424242',
    lineHeight: 18,
  },
  returnShipmentBadge: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  returnShipmentText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
