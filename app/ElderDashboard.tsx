import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Modal } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MedicationNotification from './components/MedicationNotification';
import { useTheme } from './context/ThemeContext';
import { lightTheme, darkTheme } from './styles/theme';

const ElderDashboard = () => {
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(false);
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const handleShowNotification = () => {
    setShowNotification(true);
  };

  const handleDismissNotification = () => {
    setShowNotification(false);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      router.push('/LoginScreen');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Modal
        visible={showNotification}
        transparent={true}
        animationType="slide"
        onRequestClose={handleDismissNotification}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <MedicationNotification
              medicineName="Metformin"
              containerId={2}
              scheduledTime="08:00 AM"
              onDismiss={handleDismissNotification}
            />
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.push('/LoginScreen')}
        >
          
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.secondary }]}>
          WELCOME TO, <Text style={[styles.highlight, { color: theme.primary }]}>PILLNOW</Text>
        </Text>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={30} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Logo */}
      <Image
        source={require("../assets/images/pill.png")}
        style={styles.pillImage}
      />

      {/* Elder's Dashboard */}
      <Text style={[styles.dashboardTitle, { color: theme.secondary }]}>ELDER'S DASHBOARD</Text>

      <View style={[styles.iconRow, { backgroundColor: theme.card }]}>
        <View style={styles.iconGrid}>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: theme.background }]} 
            onPress={() => router.push('/BluetoothScreen')}
          >
            <Ionicons name="bluetooth" size={30} color={theme.text} />
            <Text style={[styles.iconLabel, { color: theme.text }]}>Bluetooth</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: theme.background }]} 
            onPress={() => router.push('/NotificationScreen')}
          >
            <Ionicons name="notifications" size={30} color={theme.text} />
            <Text style={[styles.iconLabel, { color: theme.text }]}>Notifications</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.iconGrid}>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: theme.background }]} 
            onPress={handleShowNotification}
          >
            <Ionicons name="alarm" size={30} color={theme.text} />
            <Text style={[styles.iconLabel, { color: theme.text }]}>Test Alarm</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: theme.background }]} 
            onPress={() => router.push('/LocationScreen')}
          >
            <Ionicons name="location" size={30} color={theme.text} />
            <Text style={[styles.iconLabel, { color: theme.text }]}>Locate Box</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Monitor & Manage Button */}
      <TouchableOpacity 
        style={[styles.dashboardButton, styles.monitorButton, { backgroundColor: theme.secondary }]}
        onPress={() => router.push('/MonitorManageScreen')}
      >
        <Ionicons name="desktop" size={24} color={theme.card} />
        <Text style={[styles.buttonText, { color: theme.card }]}>MONITOR & MANAGE</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 40,
    padding: 15,
    borderRadius: 15,
    elevation: 8,
  },
  backButton: {
    padding: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  highlight: {
    color: '#4A90E2',
  },
  pillImage: {
    width: 90,
    height: 90,
    marginVertical: 20,
  },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 15,
  },
  iconRow: {
    width: '90%',
    marginVertical: 20,
    padding: 15,
    borderRadius: 15,
    elevation: 5,
  },
  iconGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 5,
  },
  iconButton: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: '45%',
    elevation: 3,
  },
  iconLabel: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  dashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginVertical: 10,
    elevation: 3,
  },
  monitorButton: {
    backgroundColor: '#D14A99',
  },
  buttonText: {
    textAlign: 'center',
    marginLeft: 10,
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    aspectRatio: 1,
    borderRadius: 25,
    padding: 30,
    elevation: 5,
  },
  logoutButton: {
    padding: 10,
  },
});

export default ElderDashboard;