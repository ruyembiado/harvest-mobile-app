import React, { useEffect, useState } from "react";
import { View, Alert } from "react-native";
import {
  Provider as PaperProvider,
  Text,
  TextInput,
  Card,
  Button,
} from "react-native-paper";
import { Link, useRouter } from "expo-router";
import GlobalStyles from "../assets/styles/styles";
import customTheme from "../assets/styles/theme";
import api from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { registerBackgroundTask } from "../services/notification";
import NetInfo from "@react-native-community/netinfo"; // Updated import

const Index: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const router = useRouter();

  // Check network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Request notification permissions
  useEffect(() => {
    async function requestPermissions() {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        alert("You need to enable notifications to use this feature.");
      }
    }
    requestPermissions();
  }, []);

  // Setup notifications and background task
  useEffect(() => {
    async function setup() {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.log("[NOTIF] Permission not granted!");
        return;
      }
      console.log("[NOTIF] Notifications permission granted!");
      await registerBackgroundTask();
    }

    setup();
  }, []);

  // Check for stored credentials and auto-login
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("authToken");
        const storedLang = await AsyncStorage.getItem("selectedLanguage");

        if (storedToken) {
          // Auto-login if token exists
          router.replace(storedLang ? "/(lands)" : "/(languages)");
        }
      } catch (error) {
        console.error("Error loading auth:", error);
      }
    };
    loadAuth();
  }, []);

  const handleLogin = async () => {
    if (!email) {
      alert("Email is required.");
      return;
    }
    if (!password) {
      alert("Password is required.");
      return;
    }

    setLoading(true);

    try {
      if (isOffline) {
        // Offline mode: Use stored credentials
        const storedToken = await AsyncStorage.getItem("authToken");
        if (storedToken) {
          Alert.alert(
            "Offline Mode",
            "You are logged in using cached credentials."
          );
          router.replace("/(condition)");
        } else {
          Alert.alert(
            "Offline Mode",
            "No cached credentials found. Please go online to log in."
          );
        }
      } else {
        // Online mode: Make API request
        const response = await api.post("/login", {
          email: email,
          password: password,
        });

        const token = response.data.token;
        const user_id = response.data.user_id;

        // Store credentials and token
        await AsyncStorage.setItem("authToken", token);
        await AsyncStorage.setItem("user_id", String(user_id));

        console.log("User ID:", user_id);

        router.replace("/(condition)");
        Alert.alert("Login Successful.");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Invalid Credentials", "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PaperProvider theme={customTheme}>
      <View style={GlobalStyles.container}>
        <Card style={GlobalStyles.card}>
          <Card.Content>
            <Text variant="headlineLarge" style={GlobalStyles.title}>
              H.A.R.V.E.S.T
            </Text>
            <TextInput
              label="Email"
              value={email}
              onChangeText={(email) => setEmail(email)}
              mode="outlined"
              style={GlobalStyles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={(password) => setPassword(password)}
              mode="outlined"
              style={GlobalStyles.input}
              secureTextEntry
              autoCapitalize="none"
            />
            <Button
              icon="login"
              mode="contained"
              onPress={() => handleLogin()}
              style={GlobalStyles.button}
              loading={loading}
              disabled={loading}
            >
              Login
            </Button>

            <Text>
              Don't have an account?
              <Link href="/register" style={GlobalStyles.registerLink}>
                Register here
              </Link>
            </Text>
          </Card.Content>
        </Card>
      </View>
    </PaperProvider>
  );
};

export default Index;
