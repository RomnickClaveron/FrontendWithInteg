import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from './context/ThemeContext';
import { lightTheme, darkTheme } from './styles/theme';

type RootStackParamList = {
  CaregiverDashboard: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function EldersProf() {
  const navigation = useNavigation<NavigationProp>();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Function to pick an image from the gallery
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access the gallery is required!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Section */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.navigate('CaregiverDashboard')}
        >
          <Ionicons name="arrow-back" size={30} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.secondary }]}>
          ELDER'S <Text style={[styles.highlight, { color: theme.primary }]}>PROFILE</Text>
        </Text>
      </View>

      {/* Profile Image with Edit Icon */}
      <View style={[styles.profileContainer, { backgroundColor: theme.card }]}>
        <Image source={profileImage ? { uri: profileImage } : require('@/assets/images/profile.png')} style={styles.profileImage} />
        <TouchableOpacity style={[styles.editIcon, { backgroundColor: theme.primary }]} onPress={pickImage}>
          <Ionicons name="pencil" size={20} color={theme.card} />
        </TouchableOpacity>
      </View>

      {/* Input Fields */}
      <TextInput 
        style={[styles.input, { 
          backgroundColor: theme.card,
          borderColor: theme.border,
          color: theme.text,
        }]} 
        placeholder="Name" 
        placeholderTextColor={theme.textSecondary} 
      />
      
      {/* Contact Number with Verify Button */}
      <View style={styles.row}>
        <TextInput 
          style={[styles.input, styles.contactInput, { 
            backgroundColor: theme.card,
            borderColor: theme.border,
            color: theme.text,
          }]} 
          placeholder="Contact No." 
          placeholderTextColor={theme.textSecondary} 
        />
        <TouchableOpacity style={[styles.verifyButton, { backgroundColor: theme.primary }]}>
          <Text style={[styles.buttonText, { color: theme.card }]}>VERIFY</Text>
        </TouchableOpacity>
      </View>

      {/* OTP Input */}
      <TextInput 
        style={[styles.input, { 
          backgroundColor: theme.card,
          borderColor: theme.border,
          color: theme.text,
        }]} 
        placeholder="OTP" 
        placeholderTextColor={theme.textSecondary}
      />

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.cancelButton, { backgroundColor: theme.secondary }]} 
          onPress={() => navigation.navigate('CaregiverDashboard')}
        >
          <Text style={[styles.buttonText, { color: theme.card }]}>CANCEL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]}>
          <Text style={[styles.buttonText, { color: theme.card }]}>SAVE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
  profileContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
    position: 'relative',
    padding: 20,
    borderRadius: 15,
    elevation: 3,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editIcon: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    padding: 8,
    borderRadius: 20,
  },
  input: {
    width: '90%',
    height: 55,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginVertical: 8,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
  },
  contactInput: {
    flex: 1,
  },
  verifyButton: {
    padding: 15,
    borderRadius: 12,
    marginLeft: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginTop: 20,
  },
  cancelButton: {
    padding: 15,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    marginRight: 10,
    elevation: 3,
  },
  saveButton: {
    padding: 15,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    marginLeft: 10,
    elevation: 3,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
  }
});
