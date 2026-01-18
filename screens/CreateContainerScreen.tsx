import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Alert, Modal } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { sortingAPI, shipmentsAPI } from '../config/api';

type CreateContainerScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateContainer'>;
type CreateContainerScreenRouteProp = RouteProp<RootStackParamList, 'CreateContainer'>;

interface CreateContainerScreenProps {
  navigation: CreateContainerScreenNavigationProp;
  route: CreateContainerScreenRouteProp;
}

interface ScannedPackage {
  barcode: string;
  address: string;
  customer: string;
  timestamp: Date;
}

export default function CreateContainerScreen({ navigation }: CreateContainerScreenProps) {
  const [currentTab, setCurrentTab] = useState<'input' | 'scanning'>('input');
  const [exitZone, setExitZone] = useState('');
  const [distributionPoint, setDistributionPoint] = useState('');
  const [containerPCC, setContainerPCC] = useState('');
  const [scanMode, setScanMode] = useState<'manual' | 'barcode'>('manual');
  const [packageInput, setPackageInput] = useState('');
  const [scannedPackages, setScannedPackages] = useState<ScannedPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [exitZoneDetails, setExitZoneDetails] = useState<any>(null);
  const [showContainerDetails, setShowContainerDetails] = useState(false);

  const handleConfirmContainerDetails = async () => {
    console.log('handleConfirmContainerDetails called');
    console.log('exitZone:', exitZone);
    console.log('distributionPoint:', distributionPoint);
    
    // Trim values before validation
    const trimmedExitZone = exitZone.trim();
    const trimmedDistributionPoint = distributionPoint.trim();
    
    if (!trimmedExitZone) {
      Alert.alert('שגיאה', 'נא להזין מספר איזקון');
      return;
    }
    
    if (!trimmedDistributionPoint) {
      Alert.alert('שגיאה', 'נא להזין נקודת חלוקה');
      return;
    }

    // Parse numbers - NO VALIDATION, just use 0 if not a valid number
    const exitZoneNum = parseInt(trimmedExitZone, 10) || 0;
    const distributionPointNum = parseInt(trimmedDistributionPoint, 10) || 0;
    
    console.log('🚀 Proceeding with values - exitZone:', exitZoneNum, 'distributionPoint:', distributionPointNum);

    setLoading(true);
    try {
      // Generate PCC number
      const pcc = `PCC${Date.now().toString().slice(-8)}`;
      
      console.log('Creating container with params:', {
        sessionId: 1234,
        driverId: 6001,
        exitZone: exitZoneNum,
        distributionPoint: distributionPointNum,
        containerPCC: pcc
      });
      
      // Call the createContainer API
      const response = await sortingAPI.createContainer({
        sessionId: 1234, // This would come from user session in a real app
        driverId: 6001, // Driver ID from user session
        exitZone: exitZoneNum,
        distributionPoint: distributionPointNum,
        containerPCC: pcc
      });

      console.log('CreateContainer API response:', response);

      if (response.success && response.data) {
        setContainerPCC(response.data.containerPCC || pcc);
        
        // Set exit zone details from API response
        setExitZoneDetails({
          exitNumber: exitZone,
          distributionPoint: distributionPoint,
          description: response.data.exitDescription || `צ'יפה שופט חולון - ${distributionPoint}`,
          area: response.data.distributionArea || 'אריה שגריר 4, חולון',
          line: response.data.line || '480',
          routeNumber: response.data.branch || '11',
          floorNumber: response.data.exitZone?.toString() || '12',
          headerId: response.data.headerId // Store the header ID for later use
        });

        setShowContainerDetails(true);
      } else {
        console.error('Container creation failed:', response);
        const errorMsg = response.data?.errorMessage || 'אירעה שגיאה ביצירת המארז';
        Alert.alert('שגיאה', errorMsg);
      }
    } catch (error) {
      console.error('Error calling createContainer API:', error);
      const errorMsg = error instanceof Error ? error.message : 'אירעה שגיאה בחיבור לשרת';
      Alert.alert('שגיאת חיבור', `לא ניתן להתחבר לשרת.\n${errorMsg}\n\nוודא שהשרת פועל בכתובת http://localhost:5002`);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToScanning = () => {
    setCurrentTab('scanning');
  };

  const handleScanPackage = async (barcode?: string) => {
    const code = barcode || packageInput;
    
    if (!code.trim()) {
      Alert.alert('שגיאה', 'נא להזין או לסרוק ברקוד');
      return;
    }

    // Check if already scanned
    if (scannedPackages.some(p => p.barcode === code)) {
      setErrorMessage('חבילה זו כבר נסרקה');
      setShowErrorModal(true);
      setPackageInput('');
      return;
    }

    setLoading(true);
    try {
      // Parse and validate numbers for API call
      const exitZoneNum = parseInt(exitZone.trim(), 10);
      const distributionPointNum = parseInt(distributionPoint.trim(), 10);
      
      // These should already be valid from handleConfirmContainerDetails,
      // but double-check to prevent NaN errors
      if (isNaN(exitZoneNum) || isNaN(distributionPointNum)) {
        console.error('Invalid zone/point numbers during package scan');
        Alert.alert('שגיאה', 'אירעה שגיאה בנתוני המארז');
        setLoading(false);
        return;
      }
      
      // Call the addPackageToContainer API
      const response = await sortingAPI.addPackageToContainer({
        sessionId: 1234, // This would come from user session in a real app
        driverId: 6001, // Driver ID from user session
        packageBarcode: code,
        containerPCC: containerPCC,
        exitZone: exitZoneNum,
        distributionPoint: distributionPointNum,
        headerId: exitZoneDetails?.headerId
      });

      if (response.success && response.data) {
        // Check if package is on wrong line
        if (response.data.isWrongLine) {
          setErrorMessage(`חבילה ${code}\nמיועדת לקו: ${response.data.correctLine}\nאנא הנח אותה בצד ואל תכניס לשק`);
          setShowErrorModal(true);
          setPackageInput('');
          return;
        }

        // Add package to list with real data from API
        const newPackage: ScannedPackage = {
          barcode: code,
          address: response.data.address || 'ארלוזורוב 220, תל אביב',
          customer: response.data.customerName || 'ישראל ישראלי',
          timestamp: new Date()
        };

        setScannedPackages([...scannedPackages, newPackage]);
        setPackageInput('');

        // Check if container has packages but not full
        if (scannedPackages.length === 0) {
          setShowWarningModal(true);
        }
      } else {
        Alert.alert('שגיאה', response.data?.errorMessage || 'אירעה שגיאה בהוספת החבילה');
      }
    } catch (error) {
      Alert.alert('שגיאה', 'אירעה שגיאה בהוספת החבילה למארז');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseContainer = async () => {
    if (scannedPackages.length === 0) {
      Alert.alert('שגיאה', 'לא ניתן לסגור מארז ללא חבילות');
      return;
    }

    setLoading(true);
    try {
      // Parse exitZone with proper validation
      const exitZoneNum = parseInt(exitZone.trim(), 10);
      
      // Use 0 as fallback if parsing fails (though it shouldn't at this point)
      const validExitZone = isNaN(exitZoneNum) ? 0 : exitZoneNum;
      
      // API call to close container - using the existing API format
      await sortingAPI.closeContainer({
        sessionId: 1234, // This would come from user session in a real app
        driverId: 6001, // Driver ID from user session
        exitNumber: validExitZone,
        handcuffBarcode: containerPCC
      });

      // Also record the packages that were added to the container
      // In a real implementation, this would be done through a different API endpoint
      for (const pkg of scannedPackages) {
        await shipmentsAPI.updateOperations([{
          EventCode: 600, // Event code for container operation
          MsgDateTime: new Date().toISOString(),
          MsgData: {
            DriverId: 6001,
            ShipmentsList: [{
              ShipmentId: pkg.barcode,
              ActualQuantity: 1,
              IsScan: true
            }],
            Coordinates: ''
          }
        }]);
      }

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error closing container:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בסגירת המארז');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    // Reset all states
    setExitZone('');
    setDistributionPoint('');
    setContainerPCC('');
    setScannedPackages([]);
    setPackageInput('');
    setCurrentTab('input');
    setExitZoneDetails(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backArrow}>→</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>הקמת מארז ידני</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <View style={[styles.tab, currentTab === 'input' && styles.activeTab]}>
          <Text style={[styles.tabText, currentTab === 'input' && styles.activeTabText]}>
            ({currentTab === 'scanning' ? '1' : '0'}) כשל(ו)
          </Text>
        </View>
        <View style={[styles.tab, currentTab === 'scanning' && styles.activeTab]}>
          <Text style={[styles.tabText, currentTab === 'scanning' && styles.activeTabText]}>
            ({scannedPackages.length}) נסרק(ו)
          </Text>
          {currentTab === 'scanning' && (
            <View style={styles.activeTabIndicator} />
          )}
        </View>
      </View>


      {/* Toggle Buttons for Input Mode */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, scanMode === 'manual' && styles.toggleButtonActive]}
          onPress={() => setScanMode('manual')}
        >
          <Text style={[styles.toggleButtonText, scanMode === 'manual' && styles.toggleButtonTextActive]}>
            📋 הזנה ידנית
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, scanMode === 'barcode' && styles.toggleButtonActive]}
          onPress={() => setScanMode('barcode')}
        >
          <Text style={[styles.toggleButtonText, scanMode === 'barcode' && styles.toggleButtonTextActive]}>
            📷 סריקת ברקוד
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {currentTab === 'input' ? (
          <View style={styles.inputContent}>
            <Text style={styles.sectionTitle}>הקלד/סרוק איזקון</Text>
            <TextInput
              style={styles.input}
              value={showContainerDetails ? containerPCC : exitZone}
              onChangeText={showContainerDetails ? undefined : setExitZone}
              placeholder="מספר איזקון"
              keyboardType="numeric"
              editable={!showContainerDetails}
            />

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>הקלד נקודת חלוקה</Text>
            <TextInput
              style={styles.input}
              value={distributionPoint}
              onChangeText={showContainerDetails ? undefined : setDistributionPoint}
              placeholder="מספר נקודה"
              keyboardType="numeric"
              editable={!showContainerDetails}
            />

            {showContainerDetails && exitZoneDetails && (
              <View style={styles.detailsSection}>
                <Text style={styles.detailsText}>
                  {exitZoneDetails.description}
                </Text>
                <Text style={styles.detailsSubText}>
                  {exitZoneDetails.area}
                </Text>
                
                <View style={styles.routeButtonsContainer}>
                  <View style={styles.routeButtonBlack}>
                    <Text style={styles.routeButtonText}>סניף {exitZoneDetails.routeNumber}</Text>
                  </View>
                  <View style={styles.routeButtonBlack}>
                    <Text style={styles.routeButtonText}>אזור הפצה {exitZoneDetails.floorNumber}</Text>
                  </View>
                  <View style={styles.routeButtonBlack}>
                    <Text style={styles.routeButtonText}>קו {exitZoneDetails.line}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.scanningContent}>
            {/* Clean scanning view matching mockup */}
            <View style={styles.scanTitleContainer}>
              <Text style={styles.scanCountNumber}>{scannedPackages.length}</Text>
              <Text style={styles.scanTitle}>סריקת חבילות למארז</Text>
            </View>
            
            {scanMode === 'manual' && (
              <TextInput
                style={[styles.input, { marginTop: 20, marginHorizontal: 10 }]}
                value={packageInput}
                onChangeText={setPackageInput}
                placeholder="הקלד/סרוק ברקוד חבילה"
                onSubmitEditing={() => handleScanPackage()}
              />
            )}

            {/* Scanned Packages List */}
            <View style={{ marginTop: 10 }}>
              {scannedPackages.map((pkg, index) => (
                <View key={index} style={styles.packageCard}>
                  <Text style={styles.packageBarcode}>{pkg.barcode}</Text>
                  <Text style={styles.packageAddress}>{pkg.address}</Text>
                  <Text style={styles.packageCustomer}>{pkg.customer}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        {currentTab === 'input' ? (
          <>
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={showContainerDetails ? handleProceedToScanning : handleConfirmContainerDetails}
              disabled={loading}
            >
              <Text style={styles.confirmButtonText}>אישור</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => {
                if (showContainerDetails) {
                  setShowContainerDetails(false);
                  setExitZone('');
                  setDistributionPoint('');
                  setContainerPCC('');
                  setExitZoneDetails(null);
                } else {
                  navigation.goBack();
                }
              }}
            >
              <Text style={styles.cancelButtonText}>ביטול</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={handleCloseContainer}
              disabled={loading || scannedPackages.length === 0}
            >
              <Text style={styles.confirmButtonText}>סיום</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setCurrentTab('input')}
            >
              <Text style={styles.cancelButtonText}>ביטול</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.errorModal}>
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.errorModalTitle}>שים לב</Text>
            <Text style={styles.errorModalIcon}>✕</Text>
            <Text style={styles.errorModalMessage}>{errorMessage}</Text>
          </View>
        </View>
      </Modal>

      {/* Warning Modal */}
      <Modal
        visible={showWarningModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.warningModal}>
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={() => setShowWarningModal(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.warningIcon}>
              <Text style={styles.warningIconText}>!</Text>
            </View>
            <Text style={styles.warningModalTitle}>שים לב</Text>
            <Text style={styles.warningModalMessage}>
              הינך עומד לסגור שק, אנא וודא{'\n'}
              כי כל החבילות שמופיעות במסך{'\n'}
              כעת נמצאות בתוך השק
            </Text>
            <TouchableOpacity 
              style={styles.warningButton}
              onPress={() => setShowWarningModal(false)}
            >
              <Text style={styles.warningButtonText}>אישור</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={handleSuccessClose}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.successModalTitle}>הקמת מארז</Text>
            <Text style={styles.successModalCount}>📦 {scannedPackages.length}</Text>
            <Text style={styles.successModalIcon}>✓</Text>
            <Text style={styles.successModalMessage}>
              מארז {containerPCC}{'\n'}הוקם בהצלחה!
            </Text>
            <TouchableOpacity 
              style={styles.successButton}
              onPress={handleSuccessClose}
            >
              <Text style={styles.successButtonText}>סיום</Text>
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
    backgroundColor: '#F5F5F5',
    justifyContent: 'space-between',
  },
  header: {
    backgroundColor: '#87CEEB',
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
    color: '#000',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    backgroundColor: '#F8F8F8',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#0066CC',
    fontWeight: '600',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#0066CC',
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
    backgroundColor: '#FFF',
  },
  toggleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0066CC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#0066CC',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066CC',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  inputContent: {
    padding: 20,
    backgroundColor: '#FFF',
    margin: 10,
    borderRadius: 10,
  },
  scanningContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  scanTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFF',
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 10,
  },
  scanCountNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  scanTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
    textAlign: 'center',
  },
  containerInfo: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  containerTitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  containerPCC: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginVertical: 10,
  },
  containerNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  distributionInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 15,
  },
  distributionTitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  distributionNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginVertical: 10,
  },
  distributionDetails: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  distributionAddress: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 15,
  },
  routeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
  routeButton: {
    backgroundColor: '#666',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  routeButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  packageCard: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  packageBarcode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  packageAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  packageCustomer: {
    fontSize: 14,
    color: '#666',
  },
  topButtons: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  bottomButtons: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#87CEEB',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0066CC',
    padding: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066CC',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorModal: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 25,
    width: '80%',
    borderWidth: 3,
    borderColor: '#FF0000',
  },
  warningModal: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 25,
    width: '80%',
    borderWidth: 3,
    borderColor: '#FFA500',
  },
  successModal: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 25,
    width: '80%',
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  modalClose: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
  modalCloseText: {
    fontSize: 24,
    color: '#666',
  },
  errorModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  errorModalIcon: {
    fontSize: 48,
    color: '#FF0000',
    textAlign: 'center',
    marginBottom: 15,
  },
  errorModalMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
  },
  warningIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFA500',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 15,
  },
  warningIconText: {
    fontSize: 36,
    color: '#FFF',
    fontWeight: 'bold',
  },
  warningModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  warningModalMessage: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  warningButton: {
    backgroundColor: '#87CEEB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  warningButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  successModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  successModalCount: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 10,
  },
  successModalIcon: {
    fontSize: 48,
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 15,
  },
  successModalMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  successButton: {
    backgroundColor: '#87CEEB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  detailsSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  detailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  detailsSubText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  routeButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
  routeButtonBlack: {
    backgroundColor: '#333',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
});
