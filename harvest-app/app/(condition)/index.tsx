import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  Provider as PaperProvider,
  Text,
  TextInput,
  Checkbox,
  Card,
  Button,
  ActivityIndicator,
} from "react-native-paper";
import { Link } from "expo-router";
import GlobalStyles from "../../assets/styles/styles";
import customTheme from "../../assets/styles/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import translateText from "../../hooks/translateText"; // Import translation hook

const Index: React.FC = () => {
  const [checkbox, setChecked] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(true);
  const [targetLang, setTargetLang] = useState<string>("en");
  const [translations, setTranslations] = useState({
    appName: "H.A.R.V.E.S.T",
    welcomeMessage:
      "Welcome to H.A.R.V.E.S.T, an app that can provide real-time weather updates. This requires your location and some of your information, including your mobile number, for accurate data.",
    termsAndConditions: "I agree to the Terms and Conditions",
    continueButton: "Continue",
  });

  // Load the language from AsyncStorage
  useEffect(() => {
    const loadLanguage = async () => {
      const storedLang =
        (await AsyncStorage.getItem("selectedLanguage")) || "en";
      setTargetLang(storedLang);
    };
    loadLanguage();
  }, []);

  // Translate all text based on the selected language
  useEffect(() => {
    const translateAll = async () => {
      setIsTranslating(true);
      const keys = {
        appName: "H.A.R.V.E.S.T",
        welcomeMessage:
          "Welcome to H.A.R.V.E.S.T, an app that can provide real-time weather updates. This requires your location and some of your information, including your mobile number, for accurate data.",
        termsAndConditions: "I agree to the Terms and Conditions",
        continueButton: "Continue",
      };

      const translated = {} as any;
      for (const key in keys) {
        translated[key] = await translateText(keys[key], targetLang);
      }

      setTranslations(translated);
      setIsTranslating(false);
    };

    translateAll();
  }, [targetLang]);

  // Load the saved terms and conditions agreement
  useEffect(() => {
    const loadTermsCondition = async () => {
      const storedCondition = await AsyncStorage.getItem("TermsCondition");
      if (storedCondition) {
        setChecked(JSON.parse(storedCondition));
      }
    };
    loadTermsCondition();
  }, []);

  // Save the terms and conditions agreement
  useEffect(() => {
    const saveTermsCondition = async () => {
      await AsyncStorage.setItem("TermsCondition", JSON.stringify(checkbox));
    };
    saveTermsCondition();
  }, [checkbox]);

  if (isTranslating) {
    return (
      <View style={GlobalStyles.loadingContainer}>
        <ActivityIndicator
          animating={true}
          size="large"
          color={GlobalStyles.activityIndicator.color}
        />
      </View>
    );
  }

  return (
    <PaperProvider theme={customTheme}>
      <View style={[GlobalStyles.container, { padding: 10 }]}>
        <Card style={[GlobalStyles.card, { padding: 0 }]}>
          <Card.Content>
            <Text variant="headlineLarge" style={GlobalStyles.title}>
              {translations.appName}
            </Text>
            <Text variant="bodyLarge" style={GlobalStyles.textCenter}>
              {translations.welcomeMessage}
            </Text>
            <View style={[GlobalStyles.TermsButtonContainer]}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Checkbox.Android
                  status={checkbox ? "checked" : "unchecked"}
                  onPress={() => setChecked(!checkbox)}
                />
                <Text variant="bodySmall" style={GlobalStyles.textCenter}>
                  {translations.termsAndConditions}
                </Text>
              </View>
              <Button disabled={!checkbox} mode="contained">
                <Link href="/(languages)" style={{ color: "white" }}>
                  {translations.continueButton}
                </Link>
              </Button>
            </View>
          </Card.Content>
        </Card>
      </View>
    </PaperProvider>
  );
};

export default Index;
