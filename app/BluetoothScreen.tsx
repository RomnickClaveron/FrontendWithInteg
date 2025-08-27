import React, { useState } from 'react';

import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from './context/ThemeContext';
import { lightTheme, darkTheme } from './styles/theme';

const BluetoothScreen = () => {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    setIsConnected(!isConnected);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={30} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.secondary }]}>
          BLUETOOTH <Text style={[styles.highlight, { color: theme.primary }]}>CONNECTION</Text>
        </Text>
      </View>

      {/* Bluetooth Icon */}
      <View style={[styles.iconContainer, { backgroundColor: theme.card }]}>
        <Ionicons 
          name="bluetooth" 
          size={100} 
          color={isConnected ? theme.success : theme.textSecondary} 
        />
        <Text style={[styles.statusText, { color: theme.text }]}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Text>
      </View>

      {/* Connect Button */}
      <TouchableOpacity 
        style={[
          styles.connectButton, 
          { backgroundColor: isConnected ? theme.warning : theme.primary }
        ]}
        onPress={handleConnect}
      >
        <Text style={[styles.buttonText, { color: theme.card }]}>
          {isConnected ? 'DISCONNECT' : 'CONNECT'}
        </Text>
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
    justifyContent: 'flex-start',
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
  iconContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 40,
    elevation: 5,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  connectButton: {
    padding: 15,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BluetoothScreen;