import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { sortingAPI } from '../config/api';
import { AxiosError } from 'axios';

type ShipmentSearchScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ShipmentSearch'>;

interface ShipmentSearchScreenProps {
  navigation: ShipmentSearchScreenNavigationProp;
}

type TabType = 'manual' | 'barcode';

export default function ShipmentSearchScreen({ navigation }: ShipmentSearchScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>('manual');
  const [shipmentNumber, setShipmentNumber] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSearch = async () => {
    if (!shipmentNumber.trim()) {
      setErrorMessage('אנא הזן מספר משלוח');
      return;
    }

    setLoading(true);
    setErrorMessage(''); // Clear previous errors
    try {
      // Call the API to get shipment details
      const response = await sortingAPI.getShipmentDetails(shipmentNumber.trim());
      
      // Check if the response was successful
      if (response.success && response.data && response.data.success) {
        // Navigate to details screen with the API response
        navigation.navigate('ShipmentDetails', { 
          shipmentData: response.data,
          barcode: shipmentNumber.trim()
        });
      } else {
        // Show error message from API
        const errMsg = response.data?.errorMessage || 
                       response.errorMessage || 
                       'לא נמצאו פרטים עבור משלוח זה';
        setErrorMessage(errMsg);
      }
    } catch (error) {
      console.error('Error searching shipment:', error);
      
      // Handle different error types
      const axiosError = error as AxiosError<any>;
      
      if (axiosError.response) {
        // Server responded with error status (including 404)
        const status = axiosError.response.status;
        let errMsg = 'שגיאה בשרת';
        
        // Try to extract error message from response
        if (axiosError.response.data) {
          errMsg = axiosError.response.data.data?.errorMessage || 
                   axiosError.response.data.errorMessage ||
                   axiosError.response.data.message || 
                   errMsg;
        }
        
        // Special handling for 404
        if (status === 404) {
          setErrorMessage(errMsg === 'שגיאה בשרת' ? 'משלוח לא נמצא במערכת' : errMsg);
        } else {
          setErrorMessage(errMsg);
        }
      } else if (axiosError.request) {
        // Request was made but no response
        setErrorMessage('שגיאת תקשורת - לא ניתן להתחבר לשרת');
      } else {
        // Something else happened
        setErrorMessage('אירעה שגיאה בלתי צפויה');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
          disabled={loading}
        >
          <Text style={styles.backArrow}>→</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>איתור משלוח</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'manual' && styles.activeTab]}
          onPress={() => setActiveTab('manual')}
          disabled={loading}
        >
          <Text style={[styles.tabText, activeTab === 'manual' && styles.activeTabText]}>
            הזנה ידנית 📋
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'barcode' && styles.activeTab]}
          onPress={() => setActiveTab('barcode')}
          disabled={loading}
        >
          <Text style={[styles.tabText, activeTab === 'barcode' && styles.activeTabText]}>
            סריקה ברקוד 📷
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.instructionText}>הקלד/סרוק חבילה או שק</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={shipmentNumber}
            onChangeText={setShipmentNumber}
            placeholder="מספר"
            placeholderTextColor="#999"
            keyboardType="default"
            textAlign="center"
            editable={!loading}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3949AB" />
            <Text style={styles.loadingText}>מחפש משלוח...</Text>
          </View>
        )}

        {errorMessage && !loading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>שגיאה ❌</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity 
          style={[styles.button, styles.confirmButton, loading && styles.disabledButton]}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#333" />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  header: {
    backgroundColor: '#3949AB',
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
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 8,
    padding: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#3949AB',
  },
  tabText: {
    fontSize: 16,
    color: '#3949AB',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instructionText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginTop: 40,
    marginBottom: 30,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  loadingContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 18,
    color: '#3949AB',
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 30,
    backgroundColor: '#FFEBEE',
    borderRadius: 15,
    padding: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#F44336',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C62828',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#C62828',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  button: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: '#A8D5FF',
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#3949AB',
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3949AB',
  },
});
