import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { ShipmentData } from '../types/api.types';

type ShipmentDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ShipmentDetails'>;
type ShipmentDetailsScreenRouteProp = RouteProp<RootStackParamList, 'ShipmentDetails'>;

interface ShipmentDetailsScreenProps {
  navigation: ShipmentDetailsScreenNavigationProp;
  route: ShipmentDetailsScreenRouteProp;
}

export default function ShipmentDetailsScreen({ navigation, route }: ShipmentDetailsScreenProps) {
  const { shipmentData, barcode } = route.params || {};

  // Display the shipment data from API
  const renderSection = (label: string, value: string | number | undefined) => {
    if (!value && value !== 0) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueBox}>
          <Text style={styles.value}>{value}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>→</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>פרטי משלוח</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Barcode/Shipment Number */}
        {renderSection('מספר משלוח', shipmentData?.shipmentNumber || barcode)}

        {/* Recipient Name */}
        {renderSection('שם הנמען', shipmentData?.recipientName)}

        {/* Phone Number - NEW */}
        {renderSection('טלפון יעד', shipmentData?.vendorPhone)}

        {/* Address */}
        {renderSection('כתובת יעד', shipmentData?.address)}

        {/* Package Quantity - NEW */}
        {renderSection('כמות חבילות', shipmentData?.packageQuantity)}

        {/* Exit Number */}
        {renderSection('מספר יציאה', shipmentData?.exitNumber?.toString())}

        {/* Container Code */}
        {renderSection('קוד מכולה', shipmentData?.containerCode)}

        {/* Distribution Point */}
        {renderSection('נקודת חלוקה', shipmentData?.distributionPoint)}

        {/* Branch */}
        {renderSection('סניף', shipmentData?.branch)}

        {/* Line */}
        {renderSection('קו', shipmentData?.line)}

        {/* Sector */}
        {renderSection('סקטור', shipmentData?.sector)}

        {/* Success Message */}
        {shipmentData?.success && !shipmentData?.errorMessage && (
          <View style={[styles.section, styles.messageSection]}>
            <View style={[styles.valueBox, styles.successBox]}>
              <Text style={styles.successText}>משלוח נמצא במערכת</Text>
            </View>
          </View>
        )}

        {/* Error Message */}
        {shipmentData?.errorMessage && (
          <View style={[styles.section, styles.messageSection]}>
            <View style={[styles.valueBox, styles.errorBox]}>
              <Text style={styles.errorText}>{shipmentData.errorMessage}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity 
          style={[styles.button, styles.confirmButton]}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.confirmButtonText}>חזרה לדף הבית</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.searchButton]}
          onPress={() => navigation.navigate('ShipmentSearch')}
        >
          <Text style={styles.searchButtonText}>חיפוש נוסף</Text>
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 15,
  },
  messageSection: {
    marginTop: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    textAlign: 'right',
    marginBottom: 8,
  },
  valueBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  value: {
    fontSize: 18,
    color: '#000',
    textAlign: 'right',
  },
  successBox: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  successText: {
    fontSize: 16,
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    fontSize: 16,
    color: '#C62828',
    textAlign: 'center',
    fontWeight: '600',
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
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  searchButton: {
    backgroundColor: '#2196F3',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
