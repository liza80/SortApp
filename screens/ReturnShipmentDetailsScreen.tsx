import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';

type ReturnShipmentDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ReturnShipmentDetails'>;
type ReturnShipmentDetailsScreenRouteProp = RouteProp<RootStackParamList, 'ReturnShipmentDetails'>;

interface ReturnShipmentDetailsScreenProps {
  navigation: ReturnShipmentDetailsScreenNavigationProp;
  route: ReturnShipmentDetailsScreenRouteProp;
}

export default function ReturnShipmentDetailsScreen({ navigation, route }: ReturnShipmentDetailsScreenProps) {
  // Example data based on the screenshot - in production, this would come from API
  const returnShipmentData = {
    shipmentId: 78624171,
    customerName: 'ליזה-חדש',
    consigneePhone: 583253646,
    customerEmail: 'it@chita-il.com',
    destinationAddress: 'פתח תקווה, 11',
    destinationCityCode: '7900',
    destinationStreetCode: '1008',
    destinationBuildingNo: 11,
    distributionArea: 41,
    distributionLine: 700,
    distributionSegment: 2,
    shipmentStatus: 125,
    shipmentType: 3,
    shipmentRef1: 'ABCD1239',
    shipmentListingTimestamp: '2025-06-30 11:35:03',
    shipmentUpdateTimestamp: '2025-06-30 11:35:03',
    sourceAddress: 'קרול מחנה יבנה 1 , דוד',
    sourceBuildingNo: 1,
    sourceCityCode: '7000',
    sourceStreetCode: '89ש',
    sourcePhone: 1234567,
    sourceSecondPhone: 0,
    actualQuantity: 0,
    scannedQuantity: 0,
    contactlessDelivery: 0,
    pudoId: 0,
    pccId: '',
    udr: false,
    codType: false,
    weightType: false,
    confirmationCode: 1111,
    driverId: 0,
  };

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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>→</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>פרטי משלוח החזרה</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Return Shipment Badge */}
        <View style={styles.returnBadge}>
          <Text style={styles.returnBadgeText}>📦 משלוח החזרה</Text>
        </View>

        {/* Shipment Information */}
        <Text style={styles.sectionTitle}>מידע משלוח</Text>
        {renderSection('מספר משלוח', returnShipmentData.shipmentId)}

        {/* Distribution Information - Only קו, סניף, נקודה */}
        <Text style={styles.sectionTitle}>פרטי חלוקה</Text>
        
        {/* Line - קו */}
        {renderSection('קו', returnShipmentData.distributionLine)}
        
        {/* Branch - סניף (distributionArea) */}
        {renderSection('סניף', returnShipmentData.distributionArea)}
        
        {/* Point - נקודה (using distributionSegment as point) */}
        {renderSection('נקודה', returnShipmentData.distributionSegment)}

        {/* Spacing at bottom */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity 
          style={[styles.button, styles.homeButton]}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>חזרה לדף הבית</Text>
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
    backgroundColor: '#8B4513',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    textAlign: 'right',
    marginTop: 15,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: '#8B4513',
  },
  section: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    textAlign: 'right',
    marginBottom: 6,
  },
  valueBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  value: {
    fontSize: 16,
    color: '#000',
    textAlign: 'right',
  },
  bottomSpacing: {
    height: 20,
  },
  bottomButtons: {
    padding: 20,
    backgroundColor: '#F0F0F0',
  },
  button: {
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  homeButton: {
    backgroundColor: '#8B4513',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
