import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { sortingAPI } from '../config/api';

type BarcodeScanScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BarcodeScan'>;
type BarcodeScanScreenRouteProp = RouteProp<RootStackParamList, 'BarcodeScan'>;

interface BarcodeScanScreenProps {
  navigation: BarcodeScanScreenNavigationProp;
  route: BarcodeScanScreenRouteProp;
}

export default function BarcodeScanScreen({ navigation, route }: BarcodeScanScreenProps) {
  const { title, count, headerColor } = route.params;
  const [scanMode, setScanMode] = useState<'manual' | 'barcode'>('barcode');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleConfirm = async () => {
    if (!inputValue.trim()) {
      setError('נא להזין ברקוד');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await sortingAPI.scanBarcode({
        sessionId: 6001,
        controlCode: count,
        driverId: 6001,
        barcode: inputValue,
        latitude: '',
        longitude: '',
        isFirstEntry: false,
        isManualEntry: scanMode === 'manual'
      });
      
      if (data.success) {
        setResult(data);
        setInputValue(''); // Clear for next scan
      } else {
        setError(data.message || 'שגיאה בסריקת ברקוד');
      }
    } catch (err: any) {
      setError('שגיאת תקשורת עם השרת');
      console.error('Scan error:', err);
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
            scanMode === 'barcode' && styles.toggleButtonActive
          ]}
          onPress={() => setScanMode('barcode')}
        >
          <Text style={[
            styles.toggleButtonText,
            scanMode === 'barcode' && styles.toggleButtonTextActive
          ]}>
            🔍 סריקת ברקוד
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
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

        {/* Results Display */}
        {result && !error && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>✅ {result.message}</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>משלוחים</Text>
                <Text style={styles.statValue}>{result.shipmentQuantity || 0}</Text>
              </View>
              
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>שגויים</Text>
                <Text style={styles.statValue}>{result.errorQuantity || 0}</Text>
              </View>
              
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>מארזים</Text>
                <Text style={styles.statValue}>{result.containerQuantity || 0}</Text>
              </View>
            </View>

            {result.lastBarcode && (
              <View style={styles.lastBarcodeContainer}>
                <Text style={styles.lastBarcodeLabel}>ברקוד אחרון:</Text>
                <Text style={styles.lastBarcodeValue}>{result.lastBarcode}</Text>
              </View>
            )}
          </View>
        )}
      </View>

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
  content: {
    flex: 1,
    padding: 20,
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
});
