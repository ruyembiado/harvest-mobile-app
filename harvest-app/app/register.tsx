import React, { useEffect, useState } from "react";
import { View, Alert, ActivityIndicator } from "react-native";
import {
  Provider as PaperProvider,
  Text,
  TextInput,
  Card,
  Button,
} from "react-native-paper";
import { Link } from "expo-router";
import GlobalStyles from "../assets/styles/styles";
import customTheme from "../assets/styles/theme";
import api from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import translateText from "../hooks/translateText"; // Import translation function

const Register: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [phone, setPhoneNumber] = useState<string>("");
  const [confirm_pass, setConfirmPass] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(true);
  const [targetLang, setTargetLang] = useState<string>("en"); // Default language
  const [translations, setTranslations] = useState({
    fullName: "Full Name",
    email: "Email",
    phoneNumber: "Phone Number",
    password: "Password",
    confirmPassword: "Confirm Password",
    register: "Register",
    alreadyHaveAccount: "Already have an account?",
    loginHere: "Login here",
    passwordMismatch: "Passwords do not match.",
    emailRequired: "Email is required.",
    passwordRequired: "Password is required.",
    nameRequired: "Full Name is required.",
    phoneRequired: "Phone Number is required.",
    registrationSuccessful: "Registration Successful",
    registrationFailed: "Registration Failed",
    tryAgain: "Please try again.",
  });

  // Load selected language from AsyncStorage
  useEffect(() => {
    const loadLanguage = async () => {
      const storedLang = await AsyncStorage.getItem("selectedLanguage");
      if (storedLang) {
        setTargetLang(storedLang);
      }
      setIsTranslating(true);
    };
    loadLanguage();
  }, []);

  // Translate all text based on the selected language
  useEffect(() => {
    const translateAll = async () => {
      setIsTranslating(true); // Start translation loading state
      const keys = {
        fullName: "Full Name",
        email: "Email",
        phoneNumber: "Phone Number",
        password: "Password",
        confirmPassword: "Confirm Password",
        register: "Register",
        alreadyHaveAccount: "Already have an account?",
        loginHere: "Login here",
        passwordMismatch: "Passwords do not match.",
        emailRequired: "Email is required.",
        passwordRequired: "Password is required.",
        nameRequired: "Full Name is required.",
        phoneRequired: "Phone Number is required.",
        registrationSuccessful: "Registration Successful",
        registrationFailed: "Registration Failed",
        tryAgain: "Please try again.",
      };

      const translated = {} as any;
      for (const key in keys) {
        translated[key] = await translateText(keys[key], targetLang);
      }

      setTranslations(translated);
      await new Promise((resolve) => setTimeout(resolve, 1500)); // 1-second delay
      setIsTranslating(false); // End translation loading state
    };

    translateAll();
  }, [targetLang]);

  const handleRegister = async () => {
    if (password !== confirm_pass) {
      alert(translations.passwordMismatch);
      return;
    }
    if (!email) {
      alert(translations.emailRequired);
      return;
    }
    if (!password) {
      alert(translations.passwordRequired);
      return;
    }
    if (!name) {
      alert(translations.nameRequired);
      return;
    }
    if (!phone) {
      alert(translations.phoneRequired);
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/register", {
        name,
        email,
        phone,
        password,
      });

      console.log("User:", response.data.user);
      setName("");
      setEmail("");
      setPhoneNumber("");
      setPassword("");
      setConfirmPass("");
      alert(translations.registrationSuccessful);
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert(translations.registrationFailed, translations.tryAgain);
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
              label={translations.fullName}
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={GlobalStyles.input}
              autoCapitalize="none"
            />
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
              label={translations.phoneNumber}
              value={phone}
              onChangeText={setPhoneNumber}
              mode="outlined"
              style={GlobalStyles.input}
              keyboardType="number-pad"
              autoCapitalize="none"
            />
            <TextInput
              label={translations.password}
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              style={GlobalStyles.input}
              secureTextEntry
              autoCapitalize="none"
            />
            <TextInput
              label={translations.confirmPassword}
              value={confirm_pass}
              onChangeText={setConfirmPass}
              mode="outlined"
              style={GlobalStyles.input}
              secureTextEntry
              autoCapitalize="none"
            />
            <Button
              icon="login"
              mode="contained"
              onPress={handleRegister}
              style={GlobalStyles.button}
              loading={loading}
              disabled={loading}
            >
              {translations.register}
            </Button>

            <Text>
              {translations.alreadyHaveAccount}{" "}
              <Link href="/" style={GlobalStyles.registerLink}>
                {translations.loginHere}
              </Link>
            </Text>
          </Card.Content>
        </Card>
      </View>
    </PaperProvider>
  );
};

export default Register;
