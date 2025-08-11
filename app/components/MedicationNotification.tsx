import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { lightTheme, darkTheme } from '../styles/theme';

interface MedicationNotificationProps {
  medicineName: string;
  containerId: number;
  scheduledTime: string;
  onDismiss: () => void;
}

const MedicationNotification: React.FC<MedicationNotificationProps> = ({
  medicineName,
  containerId,
  scheduledTime,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const fadeAnim = new Animated.Value(1);
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const handleDismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      onDismiss();
    });
  };

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, backgroundColor: theme.card }]}>
      <View style={styles.notificationContent}>
        <View style={[styles.iconContainer, { backgroundColor: theme.background }]}>
          <Ionicons name="notifications" size={24} color={theme.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.secondary }]}>Time to take your medicine!</Text>
          <Text style={[styles.medicineName, { color: theme.text }]}>{medicineName}</Text>
          <Text style={[styles.details, { color: theme.textSecondary }]}>Container {containerId} • {scheduledTime}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.dismissButton, { backgroundColor: theme.success }]} 
          onPress={handleDismiss}
        >
          <Text style={[styles.dismissText, { color: theme.card }]}>Done</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    elevation: 5,
  },
  notificationContent: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  medicineName: {
    fontSize: 20,
    textAlign: 'center',
  },
  details: {
    fontSize: 16,
    textAlign: 'center',
  },
  dismissButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 20,
  },
  dismissText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default MedicationNotification; 