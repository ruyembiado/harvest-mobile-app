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
import NetInfo from "@react-native-community/netinfo";
import { useTranslation } from "react-i18next";
import { changeLanguage, loadLanguage } from "../i18n";

const Index: React.FC = () => {
  const { t, i18n } = useTranslation(); // Use the translation hook
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

  // Load language on component mount
  useEffect(() => {
    loadLanguage().then(() => {
      console.log("Language loaded:", i18n.language);
    });
  }, []);

  // Debugging: Log the current language
  useEffect(() => {
    console.log("Current language:", i18n.language);
  }, [i18n.language]);

  // Request notification permissions
  useEffect(() => {
    async function requestPermissions() {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        alert(t("notifications_permission_required")); // Translate alert message
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
      alert(t("email_required")); // Translate alert message
      return;
    }
    if (!password) {
      alert(t("password_required")); // Translate alert message
      return;
    }

    setLoading(true);

    try {
      if (isOffline) {
        // Offline mode: Use stored credentials
        const storedToken = await AsyncStorage.getItem("authToken");
        if (storedToken) {
          Alert.alert(t("offline_mode"), t("offline_login_success")); // Translate alert messages
          router.replace("/(condition)");
        } else {
          Alert.alert(t("offline_mode"), t("offline_login_failed")); // Translate alert messages
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
        Alert.alert(t("login_successful")); // Translate alert message
      }
    } catch (error) {
      // console.error("Login error:", error);
      Alert.alert(t("invalid_credentials"), t("try_again")); // Translate alert messages
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
              label={t("email")} // Translate label
              value={email}
              onChangeText={(email) => setEmail(email)}
              mode="outlined"
              style={GlobalStyles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              label={t("password")} // Translate label
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
              {t("login")} {/* Translate button text */}
            </Button>

            <Text>
              {t("dont_have_an_account")}{" "} {/* Translate text */}
              <Link href="/register" style={GlobalStyles.registerLink}>
                {t("register_here")} {/* Translate link text */}
              </Link>
            </Text>
          </Card.Content>
        </Card>
      </View>
    </PaperProvider>
  );
};

export default Index;