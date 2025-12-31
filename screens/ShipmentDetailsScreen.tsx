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

  // Helper to get value from either PascalCase or camelCase
  const getValue = (data: any, pascalKey: string, camelKey: string) => {
    return data?.[pascalKey] ?? data?.[camelKey];
  };

  // Display the shipment data from API
  const renderSection = (label: string, value: string | number | boolean | undefined | null) => {
    if (value === undefined || value === null || value === '') return null;
    
    // Convert boolean to Hebrew
    let displayValue = value;
    if (typeof value === 'boolean') {
      displayValue = value ? 'כן' : 'לא';
    }
    
    return (
      <View style={styles.section}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueBox}>
          <Text style={styles.value}>{displayValue.toString()}</Text>
        </View>
      </View>
    );
  };

  const renderSectionTitle = (title: string) => {
    return <Text style={styles.sectionTitle}>{title}</Text>;
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
        {/* Return Shipment Badge - if applicable */}
        {shipmentData?.isReturn && (
          <View style={styles.returnBadge}>
            <Text style={styles.returnBadgeText}>📦 משלוח החזרה</Text>
          </View>
        )}

        {/* Shipment Number */}
        {renderSectionTitle('מידע משלוח')}
        {renderSection('מספר משלוח', getValue(shipmentData, 'ShipmentId', 'shipmentId') || getValue(shipmentData, 'ShipmentNumber', 'shipmentNumber') || barcode)}
        
        {/* Customer Name */}
        {renderSection('שם לקוח', getValue(shipmentData, 'CustomerName', 'customerName'))}
        
        {/* Destination Address */}
        {renderSection('כתובת יעד', getValue(shipmentData, 'DestinationAddress', 'destinationAddress'))}
        
        {/* Phone */}
        {renderSection('טלפון', getValue(shipmentData, 'ConsigneePhone', 'consigneePhone'))}

        {/* Distribution Information - Only קו, סניף, נקודה */}
        {renderSectionTitle('פרטי חלוקה')}
        
        {/* Line - קו */}
        {renderSection('קו', getValue(shipmentData, 'DistributionLine', 'distributionLine') || getValue(shipmentData, 'Line', 'line'))}

        {/* Branch - סניף (distributionArea) */}
        {renderSection('סניף', getValue(shipmentData, 'DistributionArea', 'distributionArea') || getValue(shipmentData, 'Segment', 'segment'))}

        {/* Point - נקודת חלוקה */}
        {renderSection('נקודת חלוקה', getValue(shipmentData, 'DistributionPoint', 'distributionPoint') || getValue(shipmentData, 'ServicePoint', 'servicePoint') || getValue(shipmentData, 'DistributionSegment', 'distributionSegment'))}

        {/* Error Message */}
        {shipmentData?.errorMessage && (
          <View style={[styles.section, styles.messageSection]}>
            <View style={[styles.valueBox, styles.errorBox]}>
              <Text style={styles.errorText}>{shipmentData.errorMessage}</Text>
            </View>
          </View>
        )}

        {/* Spacing at bottom */}
        <View style={styles.bottomSpacing} />
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
    padding: 15,
  },
  returnBadge: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  returnBadgeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3949AB',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 2,
    borderBottomColor: '#3949AB',
  },
  section: {
    marginBottom: 8,
  },
  messageSection: {
    marginTop: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    textAlign: 'right',
    marginBottom: 4,
  },
  valueBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  value: {
    fontSize: 16,
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
  bottomSpacing: {
    height: 10,
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
