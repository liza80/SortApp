import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';

export default function ShipmentDetailsScreen({ navigation, route }) {
  const { shipmentNumber } = route.params;

  // Mock data - in a real app, this would come from an API
  const shipmentData = {
    shipmentNumber: shipmentNumber,
    recipientName: 'יוסי כהן',
    phone: '0507654321',
    address: 'משה דיין 55 פתח תיקווה',
    packagesCount: 1,
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>→</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>איתור משלוח</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Shipment Number */}
        <View style={styles.section}>
          <Text style={styles.label}>מספר משלוח</Text>
          <View style={styles.valueBox}>
            <Text style={styles.value}>{shipmentData.shipmentNumber}</Text>
          </View>
        </View>

        {/* Recipient Name */}
        <View style={styles.section}>
          <Text style={styles.label}>שם הנמען</Text>
          <View style={styles.valueBox}>
            <Text style={styles.value}>{shipmentData.recipientName}</Text>
          </View>
        </View>

        {/* Phone */}
        <View style={styles.section}>
          <Text style={styles.label}>טלפון יעד</Text>
          <View style={styles.valueBox}>
            <Text style={styles.value}>{shipmentData.phone}</Text>
          </View>
        </View>

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.label}>כתובת יעד</Text>
          <View style={styles.valueBox}>
            <Text style={styles.value}>{shipmentData.address}</Text>
          </View>
        </View>

        {/* Packages Count */}
        <View style={styles.section}>
          <Text style={styles.label}>כמות חבילות</Text>
          <View style={styles.valueBox}>
            <Text style={styles.value}>{shipmentData.packagesCount}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity 
          style={[styles.button, styles.confirmButton]}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.confirmButtonText}>אישור</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.navigate('Home')}
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  valueBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 18,
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
    fontSize: 20,
    color: '#000',
    textAlign: 'center',
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
    backgroundColor: '#A8D5FF',
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
