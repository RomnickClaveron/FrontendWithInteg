import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  id: string;
}

interface UserData {
  fullname: string;
  username: string;
}

const UserProfile: React.FC = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.warn("Session expired. Redirecting to login.");
        navigation.reset({ index: 0, routes: [{ name: "LoginScreen" }] });
        return;
      }
      
      const decodedToken = jwtDecode<DecodedToken>(token.trim());
      const userId = decodedToken.id;
      
      const response = await fetch(`https://devapi-618v.onrender.com/api/user/${userId}`, {
        method: "GET",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      
      const data = await response.json();
      if (response.ok) {
        setUserData(data);
      } else {
        console.error("Failed to fetch user data:", data);
        if (data.error === "Invalid token") {
          await AsyncStorage.removeItem("token");
          navigation.reset({ index: 0, routes: [{ name: "LoginScreen" }] });
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchAllUsers = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.warn("Session expired. Redirecting to login.");
        navigation.reset({ index: 0, routes: [{ name: "LoginScreen" }] });
        return;
      }

      const response = await fetch("https://devapi-618v.onrender.com/api/user", {
        method: "GET",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const data = await response.json();
      if (response.ok) {
        setUsers(data);
      } else {
        console.error("Failed to fetch user data:", data);
        if (data.error === "Invalid token") {
          await AsyncStorage.removeItem("token");
          navigation.reset({ index: 0, routes: [{ name: "LoginScreen" }] });
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" />
      ) : userData ? (
        <View style={styles.profileCard}>
          <Text style={styles.greeting}>👋 Hello, {userData.fullname}!</Text>
          <Text style={styles.info}>Username: {userData.username}</Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>⬅ Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.errorText}>⚠️ Oops! We couldn't load your profile.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    alignItems: "center",
  },
  greeting: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#007BFF",
    marginBottom: 10,
  },
  info: {
    fontSize: 16,
    color: "#333",
  },
  button: {
    marginTop: 15,
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 16,
    color: "red",
  },
});

export default UserProfile;
