import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from './context/ThemeContext';
import { lightTheme, darkTheme } from './styles/theme';

interface Notification {
  id: string;
  title: string;
  message: string;
}

const initialNotifications: Notification[] = [
  { id: '1', title: 'MEDICINE RUNOUT', message: 'Please refill your medication supply soon.' },
  { id: '3', title: 'MEDICINE IDENTIFIED', message: 'Your medicine has been successfully identified.' },
];

export default function NotificationScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [notifications, setNotifications] = useState(initialNotifications);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

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
          ALERTS AND <Text style={[styles.highlight, { color: theme.primary }]}>NOTIFICATIONS</Text>
        </Text>
      </View>

      {/* Bell Icon */}
      <View style={[styles.bellContainer, { backgroundColor: theme.card }]}>
        <Image source={require('@/assets/images/bell.png')} style={styles.bellIcon} />
      </View>

      {/* Notification List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.notificationCard, { backgroundColor: theme.card }]}>
            <View style={styles.textContainer}>
              <Text style={[styles.notificationTitle, { color: theme.text }]}>{item.title}</Text>
              <Text style={[styles.notificationMessage, { color: theme.textSecondary }]}>{item.message}</Text>
            </View>
            <TouchableOpacity onPress={() => removeNotification(item.id)}>
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={[styles.emptyMessage, { color: theme.textSecondary }]}>
            No notifications available
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
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
    flex: 1,
  },
  highlight: {
    color: '#4A90E2',
  },
  bellContainer: {
    alignItems: 'center',
    marginTop: 120,
    marginBottom: 20,
    padding: 20,
    borderRadius: 15,
    elevation: 5,
  },
  bellIcon: {
    width: 80,
    height: 80,
  },
  listContainer: {
    paddingBottom: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  notificationMessage: {
    fontSize: 12,
    marginTop: 5,
  },
  emptyMessage: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 20,
  },
});