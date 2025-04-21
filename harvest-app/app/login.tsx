import React, { useEffect, useState } from "react";
import { View, Alert, ActivityIndicator } from "react-native";
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
import translateText from "../hooks/translateText"; // Import translation function

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [targetLang, setTargetLang] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState<boolean>(true);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [translations, setTranslations] = useState({
    email: "",
    password: "",
    login: "",
    register: "",
    noAccount: "",
    notificationsRequired: "",
    emailRequired: "",
    passwordRequired: "",
    loginSuccess: "",
    invalidCredentials: "",
    tryAgain: "",
    offlineMode: "",
    offlineLoginSuccess: "",
    offlineNoCache: "",
  });

  const router = useRouter();

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

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        const storedLang =
          (await AsyncStorage.getItem("selectedLanguage")) || "en";
        setTargetLang(storedLang);

        const keys = {
          email: "Email",
          password: "Password",
          login: "Login",
          register: "Register here",
          noAccount: "Don't have an account?",
          notificationsRequired:
            "You need to enable notifications to use this feature.",
          emailRequired: "Email is required.",
          passwordRequired: "Password is required.",
          loginSuccess: "Login Successful",
          invalidCredentials: "Invalid Credentials",
          tryAgain: "Please try again.",
          offlineMode: "Offline Mode",
          offlineLoginSuccess: "You are logged in using cached credentials.",
          offlineNoCache:
            "No cached credentials found. Please go online to log in.",
        };

        const translated = {} as any;
        for (const key in keys) {
          translated[key] = await translateText(keys[key], storedLang);
        }

        setTranslations(translated);
        setIsTranslating(false); // Mark translation as complete
      } catch (error) {
        console.error("Translation error:", error);
      }
    };

    initializeLanguage();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function requestPermissions() {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        alert(translations.notificationsRequired);
      }
    }
    if (!isTranslating) {
      requestPermissions();
    }
  }, [isTranslating]);

  const handleLogin = async () => {
    if (!email) {
      alert(translations.emailRequired);
      return;
    }
    if (!password) {
      alert(translations.passwordRequired);
      return;
    }

    setLoading(true);

    try {
      if (isOffline) {
        const storedToken = await AsyncStorage.getItem("authToken");
        if (storedToken) {
          Alert.alert(
            translations.offlineMode,
            translations.offlineLoginSuccess
          );
          router.replace("/(condition)");
        } else {
          Alert.alert(translations.offlineMode, translations.offlineNoCache);
        }
      } else {
        const response = await api.post("/login", { email, password });

        const token = response.data.token;
        const user_id = response.data.user_id;

        await AsyncStorage.setItem("authToken", token);
        await AsyncStorage.setItem("user_id", String(user_id));

        console.log("User ID:", user_id);

        router.replace("/(condition)");
        Alert.alert(translations.loginSuccess);
      }
    } catch (error) {
      Alert.alert(translations.invalidCredentials, translations.tryAgain);
    } finally {
      setLoading(false);
    }
  };

  if (isTranslating) {
    return (
      <PaperProvider theme={customTheme}>
        <View style={GlobalStyles.container}>
          <ActivityIndicator
            size="large"
            color={GlobalStyles.activityIndicator.color}
          />
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={customTheme}>
      <View style={GlobalStyles.container}>
        <Card style={GlobalStyles.card}>
          <Card.Content>
            <Text variant="headlineLarge" style={GlobalStyles.title}>
              H.A.R.V.E.S.T
            </Text>
            <TextInput
              label={translations.email}
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={GlobalStyles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              label={translations.password}
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              style={GlobalStyles.input}
              secureTextEntry={!isPasswordVisible}
              autoCapitalize="none"
              right={
                <TextInput.Icon
                  icon={isPasswordVisible ? "eye-off" : "eye"}
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                />
              }
            />
            <Button
              icon="login"
              mode="contained"
              onPress={handleLogin}
              style={GlobalStyles.button}
              loading={loading}
              disabled={loading}
            >
              {translations.login}
            </Button>

            <Text>
              {translations.noAccount}{" "}
              <Link href="/register" style={GlobalStyles.registerLink}>
                {translations.register}
              </Link>
            </Text>
          </Card.Content>
        </Card>
      </View>
    </PaperProvider>
  );
};

export default Login;