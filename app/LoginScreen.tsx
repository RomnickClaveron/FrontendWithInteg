import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView, Modal, ActivityIndicator
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { useTheme } from "./context/ThemeContext";
import { lightTheme, darkTheme } from "./styles/theme";
import * as SMS from "expo-sms";

const LoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await AsyncStorage.removeItem("token"); // Clear previous token

      const response = await axios.post("https://pillnow-database.onrender.com/api/users/login", {
        email,
        password,
      });

      if (response.data?.token) {
        await AsyncStorage.setItem("token", response.data.token);
        console.log("Login successful. Token saved:", response.data.token);
        console.log("Full response data:", JSON.stringify(response.data, null, 2));
        
        // Check user role and navigate accordingly
        const userRole = response.data.user?.role || response.data.role;
        console.log("User role:", userRole);
        console.log("Response data.user:", response.data.user);
        console.log("Response data.role:", response.data.role);
        
        // Handle numeric role IDs: 1=Admin, 2=Elder, 3=Caregiver
        const roleId = parseInt(userRole);
        console.log("Role ID:", roleId);
        
        if (roleId === 3) {
          console.log("Navigating to CaregiverDashboard (Role ID: 3)");
          router.push("/CaregiverDashboard");
        } else if (roleId === 2) {
          console.log("Navigating to ElderDashboard (Role ID: 2)");
          router.push("/ElderDashboard");
        } else if (roleId === 1) {
          console.log("Admin role detected (Role ID: 1) - showing alert");
          Alert.alert("Login Failed", "Admin access not supported in this app.");
        } else {
          console.log("Unknown role, showing alert");
          // If role is not recognized, show an alert
          Alert.alert("Login Failed", "Invalid user role. Please contact support.");
        }
      } else {
        Alert.alert("Login Failed", "Invalid username or password");
      }
    } catch (error: any) {
      Alert.alert("Login Failed", error.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const generateSixDigitCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSendResetCode = async () => {
    const trimmed = phoneNumber.trim();
    if (!trimmed) {
      Alert.alert("Missing Number", "Please enter your contact number.");
      return;
    }

    setIsSendingCode(true);
    try {
      const isAvailable = await SMS.isAvailableAsync();
      const code = generateSixDigitCode();
      const message = `PILLNOW reset code: ${code}`;

      if (!isAvailable) {
        Alert.alert(
          "SMS Unavailable",
          "SMS is not available on this device. Please contact support or try another method."
        );
        return;
      }

      const result = await SMS.sendSMSAsync([trimmed], message);
      if (result.result === "sent") {
        Alert.alert("Code Sent", "A reset code has been sent to your number.");
        setIsForgotOpen(false);
        setPhoneNumber("");
      } else {
        Alert.alert("Not Sent", "The SMS was not sent. Please try again.");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to send SMS. Please try again.");
    } finally {
      setIsSendingCode(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: theme.card, ...theme.elevation }]}>
          <Text style={[styles.title, { color: theme.secondary }]}>Welcome to PILLNOW</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.background,
              borderColor: theme.border,
              color: theme.text
            }]}
            placeholder="Email"
            placeholderTextColor={theme.textSecondary}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.background,
              borderColor: theme.border,
              color: theme.text
            }]}
            placeholder="Password"
            placeholderTextColor={theme.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity 
            style={styles.forgotButton}
            onPress={() => setIsForgotOpen(true)}
          >
            <Text style={[styles.forgotText, { color: theme.primary }]}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Logging in..." : "Login"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.registerButton}
            onPress={() => router.push("/Create")}
          >
            <Text style={[styles.registerText, { color: theme.primary }]}>
              Don't have an account? Register
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={isForgotOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsForgotOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Reset your password</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Enter your contact number to receive a reset code via SMS.</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.background,
                borderColor: theme.border,
                color: theme.text
              }]}
              placeholder="Contact Number"
              placeholderTextColor={theme.textSecondary}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: theme.border }]}
                onPress={() => setIsForgotOpen(false)}
                disabled={isSendingCode}
              >
                <Text style={[styles.modalButtonText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalPrimaryButton, { backgroundColor: theme.primary }]}
                onPress={handleSendResetCode}
                disabled={isSendingCode}
              >
                {isSendingCode ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalPrimaryButtonText}>Send Code</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    borderRadius: 30,
    padding: 40,
    elevation: 8,
    alignItems: "center",
    width: "100%",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 25,
    textAlign: "center",
  },
  input: { 
    width: "100%",
    height: 55,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingLeft: 18,
    marginBottom: 18,
    fontSize: 16,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginTop: 15,
  },
  buttonText: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
  },
  forgotButton: {
    alignSelf: "flex-end",
    marginTop: -8,
    marginBottom: 10,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: "600",
  },
  registerButton: {
    marginTop: 20,
  },
  registerText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "transparent",
    marginRight: 8,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalPrimaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  modalPrimaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});

export default LoginScreen;
