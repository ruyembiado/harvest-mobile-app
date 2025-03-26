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
import NetInfo from "@react-native-community/netinfo";
import api from "@/services/api";
import GlobalStyles from "@/assets/styles/styles";
import customTheme from "@/assets/styles/theme";
import translateText from "../../hooks/translateText";

const SettingScreen: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [phone, setPhoneNumber] = useState<string>("");
  const [confirm_pass, setConfirmPass] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>("en");
  const [isOffline, setIsOffline] = useState<boolean>(false);
  
  // Default translations for offline mode
  const defaultTranslations = {
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
    offlineMode: "Offline Mode - Changes will sync when online",
    offlineProfile: "Showing cached profile data",
    offlineUpdate: "Profile changes saved locally",
  };

  const [translations, setTranslations] = useState(defaultTranslations);
  const router = useRouter();

  // Check network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Load stored language and profile on mount
  useEffect(() => {
    const loadInitialData = async () => {
      const storedLang = await AsyncStorage.getItem("selectedLanguage");
      if (storedLang) {
        setLanguage(storedLang);
      }
      
      // Try to load cached profile
      const cachedProfile = await AsyncStorage.getItem("cachedProfile");
      if (cachedProfile) {
        const profileData = JSON.parse(cachedProfile);
        setEmail(profileData.email || "");
        setName(profileData.name || "");
        setPhoneNumber(profileData.phone || "");
      }
      
      // If online, fetch fresh data
      if (!isOffline) {
        fetchUserProfile();
      }
    };
    
    loadInitialData();
  }, [isOffline]);

  // Translate all text based on the selected language (only when online)
  useEffect(() => {
    if (isOffline) {
      // Use default translations when offline
      setTranslations(defaultTranslations);
      return;
    }

    const translateAll = async () => {
      const keys = defaultTranslations;
      const translated = {} as any;
      
      try {
        for (const key in keys) {
          translated[key] = await translateText(keys[key], language);
        }
        setTranslations(translated);
      } catch (error) {
        console.error("Translation error:", error);
        // Fall back to default translations if translation fails
        setTranslations(defaultTranslations);
      }
    };

    translateAll();
  }, [language, isOffline]);

  // Save selected language
  const handleLanguageChange = async (value: string) => {
    setLanguage(value);
    await AsyncStorage.setItem("selectedLanguage", value);
  };

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem("user_id");
      if (!userId) return;
      
      const response = await api.get(`/get_profile/${userId}`);
      const profileData = {
        email: response.data.user.email,
        name: response.data.user.name,
        phone: response.data.user.phone,
      };
      
      // Update state
      setEmail(profileData.email);
      setName(profileData.name);
      setPhoneNumber(profileData.phone);
      
      // Cache the profile data
      await AsyncStorage.setItem("cachedProfile", JSON.stringify(profileData));
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
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

      // Cache the updated profile locally
      await AsyncStorage.setItem("cachedProfile", JSON.stringify({
        email,
        name,
        phone,
      }));

      if (isOffline) {
        // Store pending updates for sync when online
        const pendingUpdates = JSON.parse(
          await AsyncStorage.getItem("pendingProfileUpdates") || "[]"
        );
        pendingUpdates.push({
          userId,
          payload,
          timestamp: new Date().toISOString(),
        });
        await AsyncStorage.setItem(
          "pendingProfileUpdates",
          JSON.stringify(pendingUpdates)
        );
        
        Alert.alert(translations.success, translations.offlineUpdate);
      } else {
        // Online - send the update request immediately
        const response = await api.post(`/update_profile/${userId}`, payload);
        
        // Update local state with the new data
        setName(response.data.user.name);
        setEmail(response.data.user.email);
        setPhoneNumber(response.data.user.phone);
        setConfirmPass("");
        setPassword("");

        Alert.alert(translations.success, translations.profileUpdated);
      }
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
      const keysToDelete = [
        "user_id",
        "authToken",
        "cachedProfile",
        "pendingProfileUpdates"
      ];
      
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

  // Sync pending updates when coming online
  useEffect(() => {
    if (!isOffline) {
      const syncPendingUpdates = async () => {
        try {
          const pendingUpdates = JSON.parse(
            await AsyncStorage.getItem("pendingProfileUpdates") || "[]"
          );
          
          if (pendingUpdates.length > 0) {
            const userId = await AsyncStorage.getItem("user_id");
            if (!userId) return;
            
            // Process each pending update
            for (const update of pendingUpdates) {
              try {
                await api.post(`/update_profile/${userId}`, update.payload);
              } catch (error) {
                console.error("Error syncing update:", error);
                // Continue with next update even if one fails
              }
            }
            
            // Clear pending updates after successful sync
            await AsyncStorage.removeItem("pendingProfileUpdates");
            fetchUserProfile(); // Refresh profile data
          }
        } catch (error) {
          console.error("Error syncing pending updates:", error);
        }
      };
      
      syncPendingUpdates();
    }
  }, [isOffline]);

  useFocusEffect(
    useCallback(() => {
      if (!isOffline) {
        fetchUserProfile();
      }
    }, [isOffline])
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