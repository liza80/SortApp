import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';

export default function ShipmentSearchScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('manual');
  const [shipmentNumber, setShipmentNumber] = useState('');

  const handleSearch = () => {
    if (shipmentNumber.trim()) {
      navigation.navigate('ShipmentDetails', { shipmentNumber: shipmentNumber.trim() });
    }
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

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'manual' && styles.activeTab]}
          onPress={() => setActiveTab('manual')}
        >
          <Text style={[styles.tabText, activeTab === 'manual' && styles.activeTabText]}>
            הזנה ידנית 📋
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'barcode' && styles.activeTab]}
          onPress={() => setActiveTab('barcode')}
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
            keyboardType="numeric"
            textAlign="center"
          />
        </View>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity 
          style={[styles.button, styles.confirmButton]}
          onPress={handleSearch}
        >
          <Text style={styles.confirmButtonText}>אישור</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
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
