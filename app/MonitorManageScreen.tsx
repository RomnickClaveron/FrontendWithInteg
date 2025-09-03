import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './context/ThemeContext';
import { lightTheme, darkTheme } from './styles/theme';
import monitorService from './services/monitorService';

const MonitorManageScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  // State for schedule data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [containerSchedules, setContainerSchedules] = useState<Record<number, { pill: string | null, alarms: Date[] }>>({
    1: { pill: null, alarms: [] },
    2: { pill: null, alarms: [] },
    3: { pill: null, alarms: [] }
  });

  // Load schedule data on component mount and when screen comes into focus
  useEffect(() => {
    loadScheduleData();
  }, []);

  // Refresh data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadScheduleData();
    });

    return unsubscribe;
  }, [navigation]);

  // Load schedule data using API service
  const loadScheduleData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current user ID and validate role
      const currentUserId = await monitorService.getCurrentUserId();
      
      // Get selected elder ID for caregivers (if any)
      const selectedElderId = await monitorService.getSelectedElderId(currentUserId.toString());
      
      // Load schedule data from API
      const data = await monitorService.loadScheduleData(currentUserId, selectedElderId || undefined);
      
      setSchedules(data.schedules);
      setContainerSchedules(data.containerSchedules);
      
    } catch (err) {
      console.error('Error loading schedule data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load schedule data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh function
  const handleRefresh = async () => {
    await loadScheduleData();
  };

  if (loading) {
    return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={loadScheduleData}
          >
            <Text style={[styles.retryButtonText, { color: theme.card }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.secondary }]}>
          MONITOR & MANAGE
        </Text>
        <TouchableOpacity 
          style={[styles.refreshButton, { backgroundColor: theme.primary }]}
          onPress={handleRefresh}
        >
          <Ionicons name="refresh" size={20} color={theme.card} />
        </TouchableOpacity>
      </View>

      {/* Current Scheduled Section */}
      <View style={[styles.scheduleSection, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.secondary }]}>
          Current Schedules
        </Text>
        
        {schedules.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No pending schedules found
            </Text>
          </View>
        ) : (
          <View style={styles.schedulesList}>
            {schedules.map((schedule: any, index: number) => {
              const medicationName = schedule.medicationName || 'Unknown Medication';
              
              return (
                <View key={schedule._id || index} style={[styles.scheduleItem, { borderColor: theme.border }]}>
                  <View style={styles.scheduleHeader}>
                    <Text style={[styles.scheduleTitle, { color: theme.primary }]}>
                      Container {schedule.container || 'N/A'}
                    </Text>
                    <View style={[
                      styles.statusBadge, 
                      { backgroundColor: schedule.status === 'Pending' ? theme.warning : theme.success }
                    ]}>
                      <Text style={[styles.statusText, { color: theme.card }]}>
                        {schedule.status || 'Active'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.scheduleDetails}>
                    <Text style={[styles.detailText, { color: theme.text }]}>
                      <Text style={styles.label}>Medication:</Text> {medicationName}
                    </Text>
                    <Text style={[styles.detailText, { color: theme.text }]}>
                      <Text style={styles.label}>Date:</Text> {schedule.date || 'N/A'}
                    </Text>
                    <Text style={[styles.detailText, { color: theme.text }]}>
                      <Text style={styles.label}>Time:</Text> {schedule.time || 'N/A'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Buttons Container */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.primary }]} 
          onPress={() => navigation.navigate("ModifySchedule" as never)}
        > 
          <Text style={[styles.buttonText, { color: theme.card }]}>SET/MOD MED SCHED</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.secondary }]} 
          onPress={() => navigation.navigate("Adherence" as never)}
        > 
          <Text style={[styles.buttonText, { color: theme.card }]}>VIEW ADHERENCE STATS & LOGS</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.primary }]} 
          onPress={() => navigation.navigate("Generate" as never)}
        > 
          <Text style={[styles.buttonText, { color: theme.card }]}>GENERATE REPORTS</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    elevation: 8,
  },
  backButton: {
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    marginLeft: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 16,
  },
  retryButton: {
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonsContainer: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 20,
  },
  button: {
    width: '90%',
    padding: 15,
    borderRadius: 12,
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scheduleSection: {
    marginTop: 20,
    padding: 15,
    borderRadius: 15,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee', // Default border color, will be overridden by theme.border
  },
  schedulesList: {
    // No specific styles needed here, items will be styled individually
  },
  scheduleItem: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  scheduleDetails: {
    marginTop: 5,
  },
  detailText: {
    fontSize: 15,
    marginBottom: 3,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default MonitorManageScreen;