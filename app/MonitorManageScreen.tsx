import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './context/ThemeContext';
import { lightTheme, darkTheme } from './styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

// Interface for decoded JWT token
interface DecodedToken {
  id: string;
  userId: string;
  role?: string;
}

const MonitorManageScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  // State for schedule data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [medications, setMedications] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);

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

  // Get current user ID and role from JWT token
  const getCurrentUserId = async (): Promise<number> => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        console.warn('No token found, using default user ID 1');
        return 1;
      }

      const decodedToken = jwtDecode<DecodedToken>(token.trim());
      const rawId = decodedToken.userId ?? decodedToken.id;
      const userId = parseInt(rawId);
      
      if (isNaN(userId)) {
        console.warn('Invalid user ID in token, using default user ID 1');
        return 1;
      }

      // Get user role from AsyncStorage (stored during login)
      const storedUserRole = await AsyncStorage.getItem('userRole');
      
      // Check if user role allows Elder access (role 2 for Elder based on login screen)
      const userRole = decodedToken.role?.toString() || storedUserRole;
      
      // Allow access if role is 2 (Elder) or if no role restriction is set
      if (userRole && userRole !== "2") {
        console.warn('User role is not Elder (role != 2):', userRole);
        Alert.alert('Access Denied', 'Only Elders can set up medication schedules.');
        throw new Error('Only Elders can set up medication schedules');
      }

      return userId;
    } catch (error) {
      console.error('Error getting user ID from token:', error);
      if (error instanceof Error && error.message.includes('Only Elders')) {
        throw error; // Re-throw role-based errors
      }
      return 1; // Default fallback for other errors
    }
  };

  // Get selected elder ID for caregivers
  const getSelectedElderId = async (): Promise<string | null> => {
    try {
      const selectedElderId = await AsyncStorage.getItem('selectedElderId');
      return selectedElderId;
    } catch (error) {
      console.error('Error getting selected elder ID:', error);
      return null;
    }
  };

  // Get latest schedule ID
  const getLatestScheduleId = async (): Promise<number> => {
    try {
      const response = await fetch('https://pillnow-database.onrender.com/api/medication_schedules');
      const data = await response.json();
      const allSchedules = data.data || [];
      
      if (allSchedules.length === 0) {
        return 0; // No schedules exist
      }
      
      // Find the highest schedule ID
      const highestScheduleId = Math.max(...allSchedules.map((schedule: any) => schedule.scheduleId));
      return highestScheduleId;
    } catch (error) {
      console.error('Error getting latest schedule ID:', error);
      return 0;
    }
  };

  // Load schedule data
  const loadScheduleData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current user ID
      const currentUserId = await getCurrentUserId();
      
      // Fetch medications and schedules with cache-busting to ensure fresh data
      const medicationsResponse = await fetch('https://pillnow-database.onrender.com/api/medications', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'If-Modified-Since': '0'
        }
      });
      const medicationsData = await medicationsResponse.json();
      
      // Normalize medications to an array regardless of API wrapper shape
      const medsArray = Array.isArray(medicationsData) ? medicationsData : (medicationsData?.data || []);
      
      const schedulesResponse = await fetch('https://pillnow-database.onrender.com/api/medication_schedules', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'If-Modified-Since': '0'
        }
      });
      const schedulesData = await schedulesResponse.json();
      
      // Get all schedules and filter by current user ID or selected elder ID
      const allSchedules = schedulesData.data || [];
      
      // Check if there's a selected elder (for caregivers)
      const selectedElderId = await getSelectedElderId();
      
      // Filter schedules based on user role and selected elder
      let userSchedules;
      if (selectedElderId) {
        // If caregiver has selected an elder, show that elder's schedules
        userSchedules = allSchedules.filter((schedule: any) => {
          const scheduleUserId = parseInt(schedule.user);
          return scheduleUserId === parseInt(selectedElderId);
        });
      } else {
        // Otherwise, show current user's schedules
        userSchedules = allSchedules.filter((schedule: any) => {
          const scheduleUserId = parseInt(schedule.user);
          return scheduleUserId === currentUserId;
        });
      }
      
      // Sort by schedule ID (highest first) and take top 3, then arrange by container number
      const sortedSchedules = userSchedules
        .sort((a: any, b: any) => b.scheduleId - a.scheduleId) // Sort by highest schedule ID first
        .slice(0, 3) // Take top 3 highest schedule IDs
        .sort((a: any, b: any) => {
          // Then arrange by container number (1, 2, 3)
          const containerA = parseInt(a.container);
          const containerB = parseInt(b.container);
          return containerA - containerB;
        });
      
      setMedications(medsArray);
      setSchedules(sortedSchedules);
      
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

  // Get container schedules
  const getContainerSchedules = (): Record<number, { pill: string | null, alarms: Date[] }> => {
    const containerSchedules: Record<number, { pill: string | null, alarms: Date[] }> = {
      1: { pill: null, alarms: [] },
      2: { pill: null, alarms: [] },
      3: { pill: null, alarms: [] }
    };
    
    if (!schedules.length || !medications.length) {
      return containerSchedules;
    }
    
    // Group schedules by container
    const schedulesByContainer: Record<number, any[]> = {};
    schedules.forEach((schedule: any) => {
      const containerNum = parseInt(schedule.container) || 1;
      if (!schedulesByContainer[containerNum]) {
        schedulesByContainer[containerNum] = [];
      }
      schedulesByContainer[containerNum].push(schedule);
    });
    
    // Process each container
    for (let containerNum = 1; containerNum <= 3; containerNum++) {
      const containerSchedulesList = schedulesByContainer[containerNum] || [];
      
      if (containerSchedulesList.length > 0) {
        const firstSchedule = containerSchedulesList[0];
        const medicationId = firstSchedule.medication;
        
        // Find medication name from ID
        const medication = medications.find(med => med.medId === medicationId);
        const medicationName = medication ? medication.name : `ID: ${medicationId}`;
        
        containerSchedules[containerNum] = {
          pill: medicationName,
          alarms: containerSchedulesList.map((schedule: any) => {
            const dateStr = schedule.date;
            const timeStr = schedule.time;
            const combinedDateTime = `${dateStr}T${timeStr}`;
            return new Date(combinedDateTime);
          })
        };
      }
    }
    
    return containerSchedules;
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

  const containerSchedules = getContainerSchedules();

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
              // Find medication name from ID
              const medication = medications.find(med => med.medId === schedule.medication);
              const medicationName = medication ? medication.name : `ID: ${schedule.medication}`;
              
              return (
                <View key={schedule._id || index} style={[styles.scheduleItem, { borderColor: theme.border }]}>
                  <View style={styles.scheduleHeader}>
                    <Text style={[styles.scheduleTitle, { color: theme.primary }]}>
                      Container {schedule.container}
                    </Text>
                    <View style={[
                      styles.statusBadge, 
                      { backgroundColor: schedule.status === 'Pending' ? theme.warning : theme.success }
                    ]}>
                      <Text style={[styles.statusText, { color: theme.card }]}>
                        {schedule.status}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.scheduleDetails}>
                    <Text style={[styles.detailText, { color: theme.text }]}>
                      <Text style={styles.label}>Medication:</Text> {medicationName || 'Unknown Medication'}
                    </Text>
                    <Text style={[styles.detailText, { color: theme.text }]}>
                      <Text style={styles.label}>Date:</Text> {schedule.date}
                    </Text>
                    <Text style={[styles.detailText, { color: theme.text }]}>
                      <Text style={styles.label}>Time:</Text> {schedule.time}
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