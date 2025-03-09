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

const SettingScreen: React.FC = () => {
  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const [name, setName] = React.useState<string>("");
  const [phone, setPhoneNumber] = React.useState<string>("");
  const [confirm_pass, setConfirmPass] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [language, setLanguage] = useState<string>("en");
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [])
  );

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

  // Save selected language
  const handleLanguageChange = async (value: string) => {
    setLanguage(value);
    console.log("Selected Language:", value);
    await AsyncStorage.setItem("selectedLanguage", value);
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
      setLoading(false);
    }
  };

  const handleUpdate = async () => {

    if (password && !confirm_pass) {
      Alert.alert("Error", "Please confirm your password");
      return;
    }

    if (password && password !== confirm_pass) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem("user_id");
      if (!userId) {
        Alert.alert("Error", "User ID not found");
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

      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    Alert.alert("Logged out", "You have been logged out");
    router.replace("../../login");
  };

  return (
    <PaperProvider theme={customTheme}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 0, marginBottom: 0 }}
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
            <Text style={GlobalStyles.label}>Profile</Text>
            <TextInput
              label="Full Name"
              value={name}
              onChangeText={(name) => setName(name)}
              mode="outlined"
              style={GlobalStyles.input}
              autoCapitalize="none"
            />
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
              label="Phone Number"
              value={phone}
              onChangeText={(phone) => setPhoneNumber(phone)}
              mode="outlined"
              style={GlobalStyles.input}
              keyboardType="number-pad"
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
            <TextInput
              label="Confirm Password"
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
              Update
            </Button>
          </View>
          <View
            style={[
              GlobalStyles.Weathercard,
              { width: 330, marginTop: 10, marginBottom: 10 },
            ]}
          >
            <Text style={GlobalStyles.label}>Language</Text>
            <RadioButton.Group
              onValueChange={handleLanguageChange}
              value={language}
            >
              <RadioButton.Item label="English" value="en" />
              <RadioButton.Item label="Tagalog" value="tl" />
              <RadioButton.Item label="Hiligaynon" value="hil" />
            </RadioButton.Group>
          </View>
          <View
            style={[GlobalStyles.Weathercard, { width: 330, marginTop: 0, marginBottom: 0 }]}
          >
            <Button
              mode="contained"
              onPress={handleLogout}
              style={{ marginTop: 0, backgroundColor: "#F44336" }}
            >
              Logout
            </Button>
          </View>
        </View>
      </ScrollView>
    </PaperProvider>
  );
};

export default SettingScreen;