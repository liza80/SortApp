import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type BarcodeMenuScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BarcodeMenu'>;

interface BarcodeMenuScreenProps {
  navigation: BarcodeMenuScreenNavigationProp;
}

export default function BarcodeMenuScreen({ navigation }: BarcodeMenuScreenProps) {
  // Get today's date
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = String(today.getFullYear()).slice(-2);
  const todayDate = `${day}/${month}/${year}`;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.languageSwitch}>עב 🌐</Text>
          <View style={styles.logo}>
            <Image 
              source={require('../assets/icon.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>
        <Text style={styles.date}>{todayDate}</Text>
        <Text style={styles.greeting}>שלום ליזה</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Title Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ברקוד</Text>
          <TouchableOpacity style={styles.inputButton}>
            <Text style={styles.inputButtonText}>בחר את הפעילה המבוקשת</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity 
          style={[styles.actionButton, styles.blueButton]}
          onPress={() => navigation.navigate('BarcodeScan', {
            title: 'כניסה למרכז מיון',
            count: 83,
            headerColor: '#0066CC'
          })}
        >
          <Text style={styles.actionButtonText}>כניסה למרכז מיון (83)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.grayButton]}
          onPress={() => navigation.navigate('BarcodeScan', {
            title: 'ביקורת מחסן',
            count: 53,
            headerColor: '#9E9E9E'
          })}
        >
          <Text style={styles.actionButtonText}>ביקורת מחסן (53)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.greenButton]}
          onPress={() => navigation.navigate('BarcodeScan', {
            title: 'סריקת מיין במה',
            count: 600,
            headerColor: '#00A651'
          })}
        >
          <Text style={styles.actionButtonText}>סריקת מיין במה (600)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.blackButton]}
          onPress={() => navigation.navigate('BarcodeScan', {
            title: 'איתור משלוח מיין',
            count: 109,
            headerColor: '#2C2C2C'
          })}
        >
          <Text style={styles.actionButtonText}>איתור משלוח מיין (109)</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🔍</Text>
          <Text style={styles.navLabel}>חיפוש</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>אזור אישי</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, styles.navItemActive]}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.navIconActive}>🏠</Text>
          <Text style={styles.navLabelActive}>בית</Text>
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
    backgroundColor: '#FFD700',
    padding: 20,
    paddingTop: 10,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  languageSwitch: {
    fontSize: 16,
  },
  logo: {
    width: 60,
    height: 60,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  date: {
    fontSize: 16,
    textAlign: 'right',
    marginBottom: 5,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputButton: {
    backgroundColor: '#E8E8E8',
    borderRadius: 25,
    padding: 18,
    alignItems: 'center',
  },
  inputButtonText: {
    fontSize: 16,
    color: '#666',
  },
  actionButton: {
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  blueButton: {
    backgroundColor: '#0066CC',
  },
  grayButton: {
    backgroundColor: '#9E9E9E',
  },
  greenButton: {
    backgroundColor: '#00A651',
  },
  blackButton: {
    backgroundColor: '#2C2C2C',
  },
  actionButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navItemActive: {
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
    opacity: 0.6,
  },
  navIconActive: {
    fontSize: 24,
    marginBottom: 4,
    opacity: 1,
  },
  navLabel: {
    fontSize: 12,
    color: '#666',
  },
  navLabelActive: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
  },
});