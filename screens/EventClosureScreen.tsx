import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, TextInput, Modal, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { sortingAPI } from '../config/api';
import { CloseContainerRequest, CloseContainerResponse } from '../types/api.types';

type EventClosureScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EventClosure'>;

interface EventClosureScreenProps {
  navigation: EventClosureScreenNavigationProp;
}

type TabType = 'new' | 'history';

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
      // Parse exit number from the first field if it's numeric, otherwise from second field
      let exitNum = 1; // Default
      
      console.log('First field (handcuffBarcode):', handcuffBarcode);
      console.log('Second field (shotBarcode):', shotBarcode);
      
      // Check if first field is a number (exit number) instead of PCC barcode
      if (!isNaN(Number(handcuffBarcode)) && handcuffBarcode.length > 0) {
        exitNum = parseInt(handcuffBarcode, 10);
        console.log('Using first field as exit number:', exitNum);
      }
      // Otherwise check if second field is a number
      else if (!isNaN(Number(shotBarcode)) && shotBarcode.length > 0) {
        exitNum = parseInt(shotBarcode, 10);
        console.log('Using second field as exit number:', exitNum);
      } else {
        console.log('No numeric field found, using default exit:', exitNum);
      }
      
      const request: CloseContainerRequest = {
        sessionId: 1,           // Placeholder - should come from worker session
        driverId: 1,            // Placeholder - should come from logged-in driver
        exitNumber: exitNum,    // Use parsed exit number
        handcuffBarcode: handcuffBarcode  // First field value (could be PCC barcode or exit number)
      };
      
      console.log('Final request being sent:', request);
      
      const response = await sortingAPI.closeContainer(request);
      
      if (response.success && response.data) {
        // Add to scanned items
        setScannedItems([...scannedItems, handcuffBarcode]);
        setSuccessPackageId(handcuffBarcode);
        
        // Set package count from API response
        setPackageCount(response.data.packageCount || 0);
        
        // Note: Distribution point data is not provided by the current backend API
        // If needed, these would need to be added to the backend response
        
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
  };

  const handleCloseError = () => {
    setShowErrorModal(false);
    setErrorMessage('');
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
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonIcon}>📷</Text>
          <Text style={styles.actionButtonText}>סריקה ברקוד</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'new' ? (
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
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={handleCloseSuccess}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>סגירת מארזים</Text>
            
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>{packageCount} 📦</Text>
              <Text style={styles.successCheckmark}>✓</Text>
            </View>
            
            <Text style={styles.successMessage}>
              מארז {successPackageId} נסגר בהצלחה!
            </Text>
            
            {/* Distribution Point Information */}
            {(distributionPointNumber || distributionPointName || lineCode || branchCode || pointCode) && (
              <View style={styles.distributionInfo}>
                {distributionPointNumber && (
                  <Text style={styles.distributionPointTitle}>
                    צ'יקה שופס חולון - {distributionPointNumber}
                  </Text>
                )}
                {distributionPointName && !distributionPointNumber && (
                  <Text style={styles.distributionPointTitle}>{distributionPointName}</Text>
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
  successCheckmark: {
    fontSize: 80,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  successMessage: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 25,
    color: '#000',
    fontWeight: '600',
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
});
