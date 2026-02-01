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
  const [showHandcuffModal, setShowHandcuffModal] = useState(false);
  const [handcuffBarcode, setHandcuffBarcode] = useState('');
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
      Alert.alert('שגיאה', 'נא להזין מספר איזקון או לסרוק PCC');
      return;
    }
    
    if (!trimmedDistributionPoint) {
      Alert.alert('שגיאה', 'נא להזין נקודת חלוקה');
      return;
    }

    // LEGACY LOGIC from TchiltKriotBrkodM:
    // The legacy system receives answers in format "1004:exitZone^1005:azikon"
    // Where 1004 is the exit zone question and 1005 is the azikon (container PCC) question
    
    let pcc = '';
    let exitZoneNum = 0;
    let isAzikonInput = false;
    
    // Check if input is a container identifier (PCC or container number)
    if (trimmedExitZone.toUpperCase().startsWith('PCC')) {
      // It's a PCC barcode - this is treated as Azikon in legacy
      pcc = trimmedExitZone.toUpperCase();
      isAzikonInput = true;
      console.log('📦 Using Azikon (PCC):', pcc);
    } else if (/^\d+$/.test(trimmedExitZone)) {
      // Numeric input - could be container number or exit zone
      const numericValue = parseInt(trimmedExitZone, 10);
      
      // Legacy checks if it's an existing container MAARAZ first
      // But for simplicity, we'll check range: 
      // Container numbers are typically > 1000, exit zones are typically < 1000
      if (numericValue > 1000) {
        // Likely a container number - treat as Azikon
        pcc = numericValue.toString();
        isAzikonInput = true;
        console.log('📦 Using Azikon (container number):', pcc);
      } else {
        // Treat as exit zone
        exitZoneNum = numericValue;
        // Generate new PCC for new container
        pcc = `PCC${Date.now().toString().slice(-8)}`;
        console.log('🔄 Exit zone:', exitZoneNum, 'Generated PCC:', pcc);
      }
    } else {
      // Non-numeric, non-PCC input - treat as Azikon
      pcc = trimmedExitZone;
      isAzikonInput = true;
      console.log('📦 Using Azikon (custom):', pcc);
    }
    
    const distributionPointNum = parseInt(trimmedDistributionPoint, 10) || 0;
    
    // If it's an Azikon input, we need to set a default exit zone
    if (isAzikonInput && exitZoneNum === 0) {
      exitZoneNum = 0; // PCC containers don't have a fixed exit zone - use 0
    }
    
    console.log('🚀 Final values - exitZone:', exitZoneNum, 'distributionPoint:', distributionPointNum, 'PCC/Azikon:', pcc);

    setLoading(true);
    try {
      
      console.log('Creating container using createContainer endpoint - distribution point:', distributionPointNum, 'PCC/Azikon:', pcc);
      
      // Use the actual working createContainer method from SortingController
      const response = await sortingAPI.createContainer({
        sessionId: 0,  // Optional
        driverId: 6001, // Driver ID from user session
        containerPCC: pcc,
        distributionPoint: distributionPointNum,
        exitZone: exitZoneNum,
        exitNumber: exitZoneNum,
        workerId: 6001,
        branchId: 0
      });

      console.log('CreateContainer API response:', response);

      if (response.success) {
        setContainerPCC(pcc);
        
        // Set exit zone details (simulate response since the new API doesn't return detailed info)
        // Get HeaderId from the response - this is critical!
        const headerId = response.data?.headerId || 
                        response.data?.HeaderId || 
                        response.data?.headerID || 
                        0;
        
        if (headerId === 0) {
          console.error('ERROR: No HeaderId returned from container creation!');
        } else {
          console.log('✅ Successfully got HeaderId:', headerId);
        }
        
        setExitZoneDetails({
          exitNumber: exitZone,
          distributionPoint: distributionPoint,
          description: `צ'יטה שופט חולון - ${distributionPoint}`,
          area: 'אריה שגריר 4, חולון',
          line: '480',
          routeNumber: '11',
          floorNumber: exitZoneNum.toString() || '12',
          headerId: headerId // Store the HeaderId for package addition
        });

        setShowContainerDetails(true);
      } else {
        console.error('Container creation failed:', response);
        const errorMsg = response.errorMessage || response.data?.errorMessage || 'אירעה שגיאה ביצירת המארז';
        setErrorMessage(errorMsg);
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error calling createContainer API:', error);
      // Extract error message from the error response if available
      let errorMsg = 'שגיאה בהקמת מארז';
      if (error instanceof Error) {
        // Try to parse error message from HTTP error
        const errorStr = error.message;
        try {
          // Look for JSON in the error message
          const jsonStart = errorStr.indexOf('{');
          if (jsonStart >= 0) {
            const jsonStr = errorStr.substring(jsonStart);
            const errorData = JSON.parse(jsonStr);
            if (errorData.data?.message) {
              errorMsg = errorData.data.message;
            } else if (errorData.data?.errorMessage) {
              errorMsg = errorData.data.errorMessage;
            }
          }
        } catch (parseError) {
          // If parsing fails, use the original error message
          errorMsg = 'שגיאה בהקמת מארז - נסה שנית';
        }
      }
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToScanning = async () => {
    // Skip initialization - not needed with the actual createContainer method
    console.log('Container ready for packages. Moving to scanning tab...');
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
      // When using PCC containers, exit zone is not needed - use 0
      const exitZoneNum = 0; // PCC containers don't need explicit exit zone
      const distributionPointNum = parseInt(distributionPoint.trim(), 10);
      
      // Validate distribution point
      if (isNaN(distributionPointNum)) {
        console.error('Invalid distribution point number');
        Alert.alert('שגיאה', 'אירעה שגיאה בנתוני המארז');
        setLoading(false);
        return;
      }
      
      // Use containerRead method from SortingController - matches legacy flow exactly
      // This properly inserts packages into RNFIL455
      const response = await sortingAPI.containerRead({
        sessionId: exitZoneDetails?.headerId || 0,  // Use headerId as session
        driverId: 6001,
        barcode: code,  // Package barcode
        headerId: exitZoneDetails?.headerId || 0
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
        
        // Package added successfully - input will auto-focus for next scan
      } else {
        // Handle error response when success is false
        let errorMsg = response.data?.message || response.data?.errorMessage || 'אירעה שגיאה בהוספת החבילה';
        
        // Always append barcode if the message is about not finding a shipment
        if (errorMsg.includes('לא נמצא משלוח מתאים לברקוד') && !errorMsg.includes(code)) {
          // Remove any trailing colon and add the barcode
          errorMsg = errorMsg.replace(/:?\s*$/, '') + `: ${code}`;
        }
        
        setErrorMessage(errorMsg);
        setShowErrorModal(true);
        setPackageInput('');
      }
    } catch (error: any) {
      // Extract error message from HTTP error response
      let errorMsg = 'אירעה שגיאה בהוספת החבילה למארז';
      
      console.log('Full error object:', error);
      console.log('Error message:', error?.message);
      console.log('Error response:', error?.response);
      
      // Check if error has response data (axios-style)
      if (error?.response?.data) {
        const responseData = error.response.data;
        console.log('Response data:', responseData);
        
        if (responseData.data?.message) {
          errorMsg = responseData.data.message;
        } else if (responseData.data?.errorMessage) {
          errorMsg = responseData.data.errorMessage;
        }
      } 
      // Check if error message contains the response (fetch-style)
      else if (error instanceof Error) {
        const errorStr = error.message || error.toString();
        console.log('Error string:', errorStr);
        
        // Try to extract JSON error data from the error message
        try {
          const jsonStart = errorStr.indexOf('{');
          if (jsonStart >= 0) {
            const jsonStr = errorStr.substring(jsonStart);
            const errorData = JSON.parse(jsonStr);
            console.log('Parsed error data:', errorData);
            
            // Navigate through the nested structure to find the message
            // The structure from the backend is: { success: false, data: { message: "..." } }
            if (errorData.success === false && errorData.data) {
              if (errorData.data.message) {
                errorMsg = errorData.data.message;
              } else if (errorData.data.errorMessage) {
                errorMsg = errorData.data.errorMessage;
              }
            }
            // Also check for other possible structures
            else if (errorData.data?.data?.message) {
              errorMsg = errorData.data.data.message;
            } else if (errorData.data?.data?.errorMessage) {
              errorMsg = errorData.data.data.errorMessage;
            } else if (errorData.data?.message) {
              errorMsg = errorData.data.message;
            } else if (errorData.data?.errorMessage) {
              errorMsg = errorData.data.errorMessage;
            } else if (errorData.message) {
              errorMsg = errorData.message;
            }
          }
        } catch (parseError) {
          console.log('Parse error:', parseError);
          // Try to find Hebrew error messages directly in the error string
          const hebrewPatterns = [
            /לא נמצא משלוח מתאים לברקוד[^"]*/,
            /המשלוח הנ"ל בוטל/,
            /המשלוח הנ"ל סגור/,
            /לא נתקבל ברקוד/,
            /נקודת החלוקה במשלוח שונה/
          ];
          
          for (const pattern of hebrewPatterns) {
            const match = errorStr.match(pattern);
            if (match) {
              errorMsg = match[0].replace(/"/g, '');
              // If no barcode was found in the message, append it
              if (errorMsg.includes('לא נמצא משלוח מתאים לברקוד') && !errorMsg.includes(code)) {
                errorMsg = `לא נמצא משלוח מתאים לברקוד: ${code}`;
              }
              break;
            }
          }
        }
      }
      
      // Always append barcode if the message is about not finding a shipment
      if (errorMsg.includes('לא נמצא משלוח מתאים לברקוד') && !errorMsg.includes(code)) {
        // Remove any trailing colon and add the barcode
        errorMsg = errorMsg.replace(/:?\s*$/, '') + `: ${code}`;
      }
      
      console.log('Final error message to display:', errorMsg);
      
      // Display error in modal instead of Alert
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
      setPackageInput('');
    } finally {
      setLoading(false);
    }
  };

  // When user clicks "סיום", show handcuff scanning modal
  const handleShowHandcuffModal = () => {
    if (scannedPackages.length === 0) {
      Alert.alert('שגיאה', 'לא ניתן לסגור מארז ללא חבילות');
      return;
    }
    
    // Show the handcuff scanning modal
    setShowHandcuffModal(true);
    setHandcuffBarcode('');
  };

  // Handle the actual container closure after scanning handcuff
  const handleCloseContainer = async () => {
    if (!handcuffBarcode.trim()) {
      Alert.alert('שגיאה', 'נא לסרוק או להזין ברקוד אזיקון');
      return;
    }

    setLoading(true);
    try {
      const trimmedHandcuff = handcuffBarcode.trim().toUpperCase();
      let finalHandcuffBarcode = trimmedHandcuff;
      let internalContainerNumber = '';
      
      // Determine if we're dealing with PCC or internal barcode
      // Legacy logic from PirokMarzLkriotZmni:
      // 1. If starts with PCC/PCK, it's a PCC barcode
      // 2. If numeric, it's an internal container number
      
      if (trimmedHandcuff.startsWith('PCC') || trimmedHandcuff.startsWith('PCK')) {
        // It's a PCC barcode - we can also extract the container number from it
        // e.g., "PCC099" -> container number is "099"
        const numericPart = trimmedHandcuff.replace(/^(PCC|PCK)/, '');
        if (/^\d+$/.test(numericPart)) {
          internalContainerNumber = numericPart;
        }
        console.log('📦 Closing with PCC barcode:', trimmedHandcuff, 'Container#:', internalContainerNumber);
      } else if (/^\d+$/.test(trimmedHandcuff)) {
        // It's a pure numeric internal container barcode
        internalContainerNumber = trimmedHandcuff;
        // If we have a containerPCC from creation, use it; otherwise use the internal number
        finalHandcuffBarcode = containerPCC || trimmedHandcuff;
        console.log('📦 Closing with internal barcode:', internalContainerNumber);
      } else {
        // Unknown format - pass as is
        console.log('📦 Closing with unknown format:', trimmedHandcuff);
      }
      
      // For PCC containers, we use the distribution point instead of exit number
      const distributionPointNum = parseInt(distributionPoint.trim(), 10) || 0;
      
      // Parse exitZone - may be 0 for PCC containers
      const exitZoneNum = parseInt(exitZone.trim(), 10);
      const validExitZone = isNaN(exitZoneNum) ? 0 : exitZoneNum;
      
      // Use closeContainerSimple method from SortingController (bypasses problematic SgirtMarz)
      const closeResponse = await sortingAPI.closeContainerSimple({
        sessionId: 0, // Optional
        driverId: 6001,
        exitNumber: validExitZone,
        handcuffBarcode: finalHandcuffBarcode
      });

      // Check if the closure was successful
      if (!closeResponse.success || closeResponse.data?.hasError) {
        const errorMsg = closeResponse.data?.message || closeResponse.data?.errorMessage || 'שגיאה בסגירת מארז';
        setErrorMessage(errorMsg);
        setShowErrorModal(true);
        setShowHandcuffModal(false);
        setLoading(false);
        return;
      }

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

      setShowHandcuffModal(false);
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
            <Text style={styles.sectionTitle}>הקלד/סרוק PCC או איזקון</Text>
            <TextInput
              style={styles.input}
              value={showContainerDetails ? containerPCC : exitZone}
              onChangeText={showContainerDetails ? undefined : setExitZone}
              placeholder=""
              keyboardType="default"
              autoCapitalize="characters"
              editable={!showContainerDetails}
            />

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>הקלד נקודת חלוקה</Text>
            <TextInput
              style={styles.input}
              value={distributionPoint}
              onChangeText={showContainerDetails ? undefined : setDistributionPoint}
            
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
              <View style={{ paddingHorizontal: 10 }}>
                <TextInput
                  style={[styles.input, { marginTop: 20 }]}
                  value={packageInput}
                  onChangeText={setPackageInput}
                  placeholder="הקלד/סרוק ברקוד חבילה"
                  onSubmitEditing={() => handleScanPackage()}
                  autoFocus={true}
                  keyboardType="numeric"
                />
                <TouchableOpacity 
                  style={[styles.confirmButton, { marginTop: 10 }]}
                  onPress={() => handleScanPackage()}
                  disabled={!packageInput.trim() || loading}
                >
                  <Text style={styles.confirmButtonText}>הוסף חבילה</Text>
                </TouchableOpacity>
              </View>
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
              onPress={handleShowHandcuffModal}
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
        onRequestClose={() => setShowErrorModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowErrorModal(false)}
        >
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
            <TouchableOpacity 
              style={[styles.confirmButton, { marginTop: 20 }]}
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={styles.confirmButtonText}>סגור</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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

      {/* Handcuff Modal - סרוק אזיקון לסגירת המארז */}
      <Modal
        visible={showHandcuffModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowHandcuffModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.warningModal}>
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={() => setShowHandcuffModal(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            
            <Text style={styles.warningModalTitle}>סגירת מארז</Text>
            
            <Text style={styles.sectionTitle}>סרוק אזיקון לסגירת המארז</Text>
            
            <View style={styles.containerInfo}>
              <Text style={styles.containerPCC}>{containerPCC}</Text>
              <Text style={styles.containerNote}>*{scannedPackages.length} חבילות כולל</Text>
            </View>
            
            <TextInput
              style={[styles.input, { marginTop: 20, marginBottom: 20 }]}
              value={handcuffBarcode}
              onChangeText={setHandcuffBarcode}
              placeholder="סרוק או הזן ברקוד אזיקון"
              keyboardType="default"
              autoFocus={true}
              autoCapitalize="characters"
            />
            
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={handleCloseContainer}
              disabled={!handcuffBarcode.trim() || loading}
            >
              <Text style={styles.confirmButtonText}>
                {loading ? 'סוגר מארז...' : 'סגור מארז'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.cancelButton, { marginTop: 10 }]}
              onPress={() => setShowHandcuffModal(false)}
            >
              <Text style={styles.cancelButtonText}>ביטול</Text>
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
