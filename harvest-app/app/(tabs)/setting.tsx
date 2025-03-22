import React, { useState, useCallback, useEffect } from "react";
import { View, Alert, ScrollView } from "react-native";
import {
  Button,
  PaperProvider,
  Text,
  RadioButton,
  TextInput,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import api from "@/services/api";
import GlobalStyles from "@/assets/styles/styles";
import customTheme from "@/assets/styles/theme";
import translateText from "../../hooks/translateText"; // Import translation hook

const SettingScreen: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [phone, setPhoneNumber] = useState<string>("");
  const [confirm_pass, setConfirmPass] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>("en");
  const [translations, setTranslations] = useState({
    profile: "Profile",
    fullName: "Full Name",
    email: "Email",
    phoneNumber: "Phone Number",
    password: "Password",
    confirmPassword: "Confirm Password",
    update: "Update",
    language: "Language",
    english: "English",
    tagalog: "Tagalog",
    hiligaynon: "Hiligaynon",
    logout: "Logout",
    error: "Error",
    confirmPasswordError: "Please confirm your password",
    passwordMismatch: "Passwords do not match",
    success: "Success",
    profileUpdated: "Profile updated successfully",
    updateFailed: "Failed to update profile. Please try again.",
    loggedOut: "Logged out",
    logoutMessage: "You have been logged out",
  });
  const router = useRouter();

  // Load stored language on mount
  useEffect(() => {
    const loadLanguage = async () => {
      const storedLang = await AsyncStorage.getItem("selectedLanguage");
      if (storedLang) {
        setLanguage(storedLang);
      }
    };
    loadLanguage();
  }, []);

  // Translate all text based on the selected language
  useEffect(() => {
    const translateAll = async () => {
      const keys = {
        profile: "Profile",
        fullName: "Full Name",
        email: "Email",
        phoneNumber: "Phone Number",
        password: "Password",
        confirmPassword: "Confirm Password",
        update: "Update",
        language: "Language",
        english: "English",
        tagalog: "Tagalog",
        hiligaynon: "Hiligaynon",
        logout: "Logout",
        error: "Error",
        confirmPasswordError: "Please confirm your password",
        passwordMismatch: "Passwords do not match",
        success: "Success",
        profileUpdated: "Profile updated successfully",
        updateFailed: "Failed to update profile. Please try again.",
        loggedOut: "Logged out",
        logoutMessage: "You have been logged out",
      };

      const translated = {} as any;
      for (const key in keys) {
        translated[key] = await translateText(keys[key], language);
      }

      setTranslations(translated);
    };

    translateAll();
  }, [language]); // Re-translate when language changes

  // Save selected language
  const handleLanguageChange = async (value: string) => {
    setLanguage(value); // Update the language state
    await AsyncStorage.setItem("selectedLanguage", value); // Save the new language to AsyncStorage
  };

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem("user_id");
      if (!userId) return;
      const response = await api.get(`/get_profile/${userId}`);
      setEmail(response.data.user.email);
      setName(response.data.user.name);
      setPhoneNumber(response.data.user.phone);
      console.log("User Profile:", response.data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 1500)); // 1-second delay
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (password && !confirm_pass) {
      Alert.alert(translations.error, translations.confirmPasswordError);
      return;
    }

    if (password && password !== confirm_pass) {
      Alert.alert(translations.error, translations.passwordMismatch);
      return;
    }

    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem("user_id");
      if (!userId) {
        Alert.alert(translations.error, "User ID not found");
        return;
      }

      // Prepare the payload
      const payload = {
        name,
        email,
        phone,
        ...(password && { password }),
      };

      // Send the update request
      const response = await api.post(`/update_profile/${userId}`, payload);
      console.log("Update Response:", response.data);

      // Update local state with the new data
      setName(response.data.user.name);
      setEmail(response.data.user.email);
      setPhoneNumber(response.data.user.phone);
      setConfirmPass("");
      setPassword("");

      Alert.alert(translations.success, translations.profileUpdated);
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert(translations.error, translations.updateFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // List of keys to delete
      const keysToDelete = ["user_id", "authToken"];
      // Remove each key from AsyncStorage
      await Promise.all(
        keysToDelete.map((key) => AsyncStorage.removeItem(key))
      );
      Alert.alert(translations.loggedOut, translations.logoutMessage);
      router.replace("../../login");
    } catch (error) {
      console.error("Error during logout:", error);
      Alert.alert(translations.error, "Logout failed");
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [])
  );

  return (
    <PaperProvider theme={customTheme}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 0,
          marginBottom: 0,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            GlobalStyles.container,
            { paddingHorizontal: 0, justifyContent: "flex-start" },
          ]}
        >
          <View
            style={[GlobalStyles.Weathercard, { width: 330, marginBottom: 0 }]}
          >
            <Text style={GlobalStyles.label}>{translations.profile}</Text>
            <TextInput
              label={translations.fullName}
              value={name}
              onChangeText={(name) => setName(name)}
              mode="outlined"
              style={GlobalStyles.input}
              autoCapitalize="none"
            />
            <TextInput
              label={translations.email}
              value={email}
              onChangeText={(email) => setEmail(email)}
              mode="outlined"
              style={GlobalStyles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              label={translations.phoneNumber}
              value={phone}
              onChangeText={(phone) => setPhoneNumber(phone)}
              mode="outlined"
              style={GlobalStyles.input}
              keyboardType="number-pad"
              autoCapitalize="none"
            />
            <TextInput
              label={translations.password}
              value={password}
              onChangeText={(password) => setPassword(password)}
              mode="outlined"
              style={GlobalStyles.input}
              secureTextEntry
              autoCapitalize="none"
            />
            <TextInput
              label={translations.confirmPassword}
              value={confirm_pass}
              onChangeText={(confirm_pass) => setConfirmPass(confirm_pass)}
              mode="outlined"
              style={GlobalStyles.input}
              secureTextEntry
              autoCapitalize="none"
            />
            <Button
              icon="update"
              mode="contained"
              onPress={handleUpdate}
              style={GlobalStyles.button}
              loading={loading}
              disabled={loading}
            >
              {translations.update}
            </Button>
          </View>
          <View
            style={[
              GlobalStyles.Weathercard,
              { width: 330, marginTop: 10, marginBottom: 10 },
            ]}
          >
            <Text style={GlobalStyles.label}>{translations.language}</Text>
            <RadioButton.Group
              onValueChange={handleLanguageChange}
              value={language}
            >
              <RadioButton.Item label={translations.english} value="en" />
              <RadioButton.Item label={translations.tagalog} value="tl" />
              <RadioButton.Item label={translations.hiligaynon} value="hil" />
            </RadioButton.Group>
          </View>
          <View
            style={[
              GlobalStyles.Weathercard,
              { width: 330, marginTop: 0, marginBottom: 0 },
            ]}
          >
            <Button
              mode="contained"
              onPress={handleLogout}
              style={{ marginTop: 0, backgroundColor: "#F44336" }}
            >
              {translations.logout}
            </Button>
          </View>
        </View>
      </ScrollView>
    </PaperProvider>
  );
};

export default SettingScreen;