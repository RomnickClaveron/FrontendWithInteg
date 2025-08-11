import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView, ActivityIndicator 
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "./context/ThemeContext";
import themeColors from "./styles/theme";

const CreateScreen = () => {
  const navigation = useNavigation(); // Ensure navigation is available
  const { theme: themeMode } = useTheme();
  const currentTheme = themeColors[themeMode];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState(2); // Default role to 2 (Elder)
  const [loading, setLoading] = useState(false); // Added loading state

  const roleLabel = (role: number) => {
    if (role === 1) return "Admin";
    if (role === 2) return "Elder";
    if (role === 3) return "Caregiver";
    return String(role);
  };

  const handleCreate = async () => {
    if (!name || !email || !contactNumber || !password) {
      Alert.alert("Error", "All fields are required!");
      return;
    }

    try {
      setLoading(true);
      await AsyncStorage.removeItem("token"); // Clear old token before registration

      const response = await axios.post("https://pillnow-database.onrender.com/api/users/register", {
        name,
        email,
        contactNumber,
        password,
        role: selectedRole
      });

      Alert.alert("Success", "Account created successfully!");
      // Navigate to login screen after successful registration
      navigation.navigate("LoginScreen" as never);
    } catch (error: any) {
      Alert.alert("Registration Failed", error.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: number) => {
    setSelectedRole(role);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
        </TouchableOpacity>
        
        <Text style={styles.title}>Create an Account</Text>

        <TextInput 
          placeholder="Full Name" 
          style={styles.input} 
          value={name} 
          onChangeText={setName} 
          placeholderTextColor="#888"
        />

        <TextInput 
          placeholder="Email" 
          style={styles.input} 
          value={email} 
          onChangeText={setEmail} 
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#888"
        />

        <TextInput 
          placeholder="Contact Number" 
          style={styles.input} 
          value={contactNumber} 
          onChangeText={setContactNumber} 
          keyboardType="phone-pad"
          placeholderTextColor="#888"
        />

        <TextInput 
          placeholder="Password" 
          style={styles.input} 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry 
          placeholderTextColor="#888"
        />

        <Text style={styles.roleLabel}>Select Role:</Text>
        <View style={styles.roleContainer}>
          <TouchableOpacity 
            style={[
              styles.roleButton, 
              selectedRole === 2 && styles.selectedRoleButton
            ]} 
            onPress={() => handleRoleSelect(2)}
          >
            <Text style={[
              styles.roleButtonText, 
              selectedRole === 2 && styles.selectedRoleButtonText
            ]}>
              Elder
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.roleButton, 
              selectedRole === 3 && styles.selectedRoleButton
            ]} 
            onPress={() => handleRoleSelect(3)}
          >
            <Text style={[
              styles.roleButtonText, 
              selectedRole === 3 && styles.selectedRoleButtonText
            ]}>
              Caregiver
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Register</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#F3F4F6" },
  card: { backgroundColor: "white", borderRadius: 30, padding: 40, elevation: 8, alignItems: "center", width: "100%" },
  title: { fontSize: 26, fontWeight: "bold", color: "#D14A99", marginBottom: 25, textAlign: "center" }, // Pink color for title
  input: { 
    width: "100%", 
    height: 55, 
    borderColor: "#E4E7EB", 
    borderWidth: 1.5, 
    borderRadius: 12, 
    paddingLeft: 18, 
    marginBottom: 18, 
    fontSize: 16, 
    backgroundColor: "#FAFAFA",
    color: "#0000FF" // Ensures user-typed text appears in blue
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
    alignSelf: "flex-start"
  },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 18
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: "#E4E7EB",
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
    backgroundColor: "#FAFAFA"
  },
  selectedRoleButton: {
    backgroundColor: "#4A90E2",
    borderColor: "#4A90E2"
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151"
  },
  selectedRoleButtonText: {
    color: "white"
  },
  button: { 
    backgroundColor: "#4A90E2", 
    paddingVertical: 15, 
    borderRadius: 12, 
    width: "100%", 
    alignItems: "center", 
    marginTop: 15 
  },
  buttonText: { fontSize: 18, color: "white", fontWeight: "bold" },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: "#4A90E2",
    fontWeight: "600",
  },
});

export default CreateScreen;
