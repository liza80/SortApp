import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
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
            <Text style={styles.logoText}>🐆</Text>
          </View>
        </View>
        <Text style={styles.date}>{todayDate}</Text>
        <Text style={styles.greeting}>שלום ליזה</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* HUB Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>מרכז מיון HUB</Text>
          <TouchableOpacity style={styles.inputButton}>
            <Text style={styles.inputButtonText}>מה תרצה לעשות היום?</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity 
          style={[styles.actionButton, styles.yellowButton]}
          onPress={() => navigation.navigate('PackagesMenu')}
        >
          <Text style={styles.actionButtonText}>מארזים</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
          <Text style={styles.actionButtonText}>ברקוד</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.blueButton]}
          onPress={() => navigation.navigate('ShipmentSearch')}
        >
          <Text style={styles.actionButtonText}>איתור משלוח</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.grayButton]}>
          <Text style={styles.actionButtonText}>שאטלים</Text>
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
        
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
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
    backgroundColor: '#000',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 35,
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
  yellowButton: {
    backgroundColor: '#FFD700',
  },
  orangeButton: {
    backgroundColor: '#FF8C42',
  },
  blueButton: {
    backgroundColor: '#0088CC',
  },
  grayButton: {
    backgroundColor: '#5A5A5A',
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
