import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image, 
  Alert, ActivityIndicator, FlatList 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { lightTheme, darkTheme } from '../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

// Interface for decoded JWT token
interface DecodedToken {
  id: string;
  userId: string;
  role?: string;
}

// Interface for elder user data
interface ElderUser {
  userId?: string;
  _id?: string;
  id?: string;
  name: string;
  email: string;
  contactNumber: string;
  profileImage?: string;
  role: number;
}

interface ElderProfileProps {
  onElderSelected?: (elderId: string, elderName: string) => void;
  onBack?: () => void;
}

export default function ElderProfile({ onElderSelected, onBack }: ElderProfileProps) {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  // State for elder connection
  const [elderName, setElderName] = useState('');
  const [elderPhone, setElderPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [connectedElders, setConnectedElders] = useState<ElderUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false);

  // Get current caregiver ID from JWT token
  const getCurrentCaregiverId = async (): Promise<string> => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const decodedToken = jwtDecode<DecodedToken>(token.trim());
      const caregiverId = decodedToken.userId ?? decodedToken.id;
      
      if (!caregiverId) {
        throw new Error('Invalid token structure');
      }

      return caregiverId;
    } catch (error) {
      console.error('Error getting caregiver ID:', error);
      throw error;
    }
  };

  // Load connected elders from local storage on mount
  useEffect(() => {
    loadConnectedElders();
  }, []);

  // Load connected elders from local storage
  const loadConnectedElders = async () => {
    try {
      setLoading(true);
      const caregiverId = await getCurrentCaregiverId();
      
      // Get connected elders from local storage
      const storedConnections = await AsyncStorage.getItem(`caregiver_connections_${caregiverId}`);
      const connections = storedConnections ? JSON.parse(storedConnections) : [];
      
      setConnectedElders(connections);
    } catch (error) {
      console.error('Error loading connected elders:', error);
      setConnectedElders([]);
    } finally {
      setLoading(false);
    }
  };

  // Save connected elders to local storage
  const saveConnectedElders = async (connections: ElderUser[]) => {
    try {
      console.log('Saving connected elders:', connections);
      const caregiverId = await getCurrentCaregiverId();
      const storageKey = `caregiver_connections_${caregiverId}`;
      console.log('Storage key:', storageKey);
      await AsyncStorage.setItem(storageKey, JSON.stringify(connections));
      console.log('Connected elders saved successfully');
    } catch (error) {
      console.error('Error saving connected elders:', error);
    }
  };

    // Add elder profile (simplified - creates local profile)
  const addElderProfile = async () => {
    if (!elderPhone.trim()) {
      Alert.alert('Error', 'Please enter the elder\'s phone number');
      return;
    }

    if (!elderName.trim()) {
      Alert.alert('Error', 'Please enter the elder\'s name');
      return;
    }

    try {
      setIsVerifying(true);
      
      // Check if elder with this phone number already exists in connected list
      const existingElder = connectedElders.find(conn => 
        conn.contactNumber === elderPhone.trim()
      );
      
      if (existingElder) {
        Alert.alert('Already Connected', `${existingElder.name} with phone ${elderPhone.trim()} is already in your list.`);
        return;
      }

      // Create a new elder profile locally
      const newElder: ElderUser = {
        userId: `local_${Date.now()}`, // Generate local ID
        name: elderName.trim(),
        email: '', // Can be empty for local profiles
        contactNumber: elderPhone.trim(),
        role: 2, // Elder role
        profileImage: undefined
      };

      // Add to connected elders list
      const updatedElders = [...connectedElders, newElder];
      await saveConnectedElders(updatedElders);
      setConnectedElders(updatedElders);

      Alert.alert(
        'Success', 
        `Successfully added ${newElder.name} to your elder list.\n\nPhone: ${newElder.contactNumber}`
      );
      
      // Reset form
      setElderName('');
      setElderPhone('');
      setOtp('');
      setShowOtpField(false);
      
    } catch (error) {
      console.error('Error adding elder:', error);
      Alert.alert('Error', 'Failed to add elder. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

    // Connect to elder (simplified for testing - no OTP required)
  const connectToElder = async () => {
    // This function is now simplified since connection happens in verifyElderPhone
    // You can use this for manual connection if needed
    Alert.alert('Info', 'Connection is now automatic after verification. Use the VERIFY button to connect to an elder.');
  };

  // Cancel connection process
  const cancelConnection = () => {
    setElderName('');
    setElderPhone('');
    setOtp('');
    setShowOtpField(false);
  };

  // Remove elder from list
  const removeElder = async (elderId: string | undefined) => {
    if (!elderId) {
      Alert.alert('Error', 'Cannot remove elder: Invalid elder ID');
      return;
    }
    
    const elderInList = connectedElders.find(elder => {
      const elderUserId = elder.userId || elder._id || elder.id;
      return elderUserId === elderId;
    });
    
    if (!elderInList) {
      Alert.alert('Error', 'Elder not found in connected list');
      return;
    }
    
    Alert.alert(
      'Disconnect Elder',
      'Are you sure you want to disconnect from this elder? This will remove them from your monitoring list but will not delete their account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedElders = connectedElders.filter(elder => {
                const elderUserId = elder.userId || elder._id || elder.id;
                return elderUserId !== elderId;
              });
              
              await saveConnectedElders(updatedElders);
              setConnectedElders(updatedElders);
              
              Alert.alert('Success', 'Elder disconnected successfully');
            } catch (error) {
              console.error('Error removing elder:', error);
              Alert.alert('Error', 'Failed to remove elder');
            }
          }
        }
      ]
    );
  };

  // Display elder details
  const showElderDetails = (elder: ElderUser) => {
    const elderId = elder.userId;
    Alert.alert(
      'Elder Details',
      `Name: ${elder.name}\nEmail: ${elder.email}\nPhone: ${elder.contactNumber}\nElder ID: ${elderId || 'Not available'}`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  // Select elder to monitor
  const selectElder = async (elderId: string | undefined, elderName: string) => {
    try {
      if (!elderId) {
        Alert.alert('Error', 'Cannot select elder: Invalid elder ID');
        return;
      }
      
      await AsyncStorage.setItem('selectedElderId', elderId);
      await AsyncStorage.setItem('selectedElderName', elderName);
      
      Alert.alert('Success', `Now monitoring ${elderName}`);
      
      if (onElderSelected) {
        onElderSelected(elderId, elderName);
      }
    } catch (error) {
      console.error('Error selecting elder:', error);
      Alert.alert('Error', 'Failed to select elder');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F5F7FA' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>ELDER'S PROFILE</Text>
      </View>

      {/* Main Content Card */}
      <View style={styles.mainCard}>
        {/* Profile Picture Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={require('@/assets/images/profile.png')} 
              style={styles.profileImage} 
            />
            <TouchableOpacity style={styles.editButton}>
              <Ionicons name="pencil" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Input Fields */}
        <View style={styles.inputSection}>
          <TextInput 
            style={styles.input} 
            placeholder="Name" 
            placeholderTextColor="#999"
            value={elderName}
            onChangeText={setElderName}
          />
          
          <View style={styles.phoneRow}>
            <TextInput 
              style={[styles.input, styles.phoneInput]} 
              placeholder="Contact No." 
              placeholderTextColor="#999"
              value={elderPhone}
              onChangeText={setElderPhone}
              keyboardType="phone-pad"
            />
            <TouchableOpacity 
              style={[styles.verifyButton, { backgroundColor: isVerifying ? '#CCC' : '#4A90E2' }]}
              onPress={addElderProfile}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.verifyButtonText}>ADD</Text>
              )}
            </TouchableOpacity>
          </View>

          {showOtpField && (
            <TextInput 
              style={styles.input} 
              placeholder="OTP" 
              placeholderTextColor="#999"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              maxLength={4}
            />
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={cancelConnection}
          >
            <Text style={styles.cancelButtonText}>CANCEL</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: isConnecting ? '#CCC' : '#4A90E2' }]}
            onPress={connectToElder}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>SAVE</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Connected Elders Section */}
      <View style={styles.connectedSection}>
        <Text style={styles.connectedTitle}>
          Connected Elders ({connectedElders.length})
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Loading connections...</Text>
          </View>
        ) : connectedElders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={50} color="#999" />
            <Text style={styles.emptyText}>No connected elders yet</Text>
            <Text style={styles.emptySubtext}>
              Add an elder to your monitoring list using the form above
            </Text>
          </View>
        ) : (
          <FlatList
            data={connectedElders}
            keyExtractor={(item, index) => item.userId || `elder-${index}`}
            renderItem={({ item }) => (
              <View style={styles.elderCard}>
                <View style={styles.elderInfo}>
                  <Image 
                    source={item.profileImage ? { uri: item.profileImage } : require('@/assets/images/profile.png')} 
                    style={styles.elderImage} 
                  />
                  <View style={styles.elderDetails}>
                    <Text style={styles.elderName}>{item.name}</Text>
                    <Text style={styles.elderPhone}>{item.contactNumber}</Text>
                    <Text style={styles.elderEmail}>{item.email}</Text>
                  </View>
                </View>
                
                <View style={styles.elderActions}>
                  <View style={styles.actionRow}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => showElderDetails(item)}
                    >
                      <Ionicons name="information-circle" size={16} color="#FFF" />
                      <Text style={styles.actionText}>Details</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: '#4A90E2' }]}
                      onPress={() => {
                        const elderId = item.userId || item._id || item.id;
                        selectElder(elderId, item.name);
                      }}
                    >
                      <Ionicons name="eye" size={16} color="#FFF" />
                      <Text style={styles.actionText}>Monitor</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#FF6B6B' }]}
                    onPress={() => {
                      const elderId = item.userId || item._id || item.id;
                      removeElder(elderId);
                    }}
                  >
                    <Ionicons name="close" size={16} color="#FFF" />
                    <Text style={styles.actionText}>Disconnect</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            scrollEnabled={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#4A90E2',
  },
  mainCard: {
    backgroundColor: '#FFF',
    margin: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 15,
  },
  editButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#4A90E2',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputSection: {
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  phoneInput: {
    flex: 1,
  },
  verifyButton: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FF6B9D',
    paddingVertical: 15,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  connectedSection: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  connectedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
    color: '#999',
  },
  elderCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  elderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  elderImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  elderDetails: {
    flex: 1,
  },
  elderName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#333',
  },
  elderPhone: {
    fontSize: 14,
    marginBottom: 2,
    color: '#666',
  },
  elderEmail: {
    fontSize: 12,
    color: '#999',
  },
  elderActions: {
    flexDirection: 'column',
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 4,
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#6C757D',
  },
  actionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
