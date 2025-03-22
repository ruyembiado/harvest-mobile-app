import React, { useEffect, useState } from "react";
import { View } from "react-native";
import {
  Provider as PaperProvider,
  Text,
  RadioButton,
  Card,
  Button, ActivityIndicator,
} from "react-native-paper";
import { useRouter } from "expo-router";
import GlobalStyles from "../../assets/styles/styles";
import customTheme from "../../assets/styles/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import translateText from "../../hooks/translateText"; // Import translation hook

const Index: React.FC = () => {
  const [language, setLanguage] = useState<string>("en");
  const [isTranslating, setIsTranslating] = useState<boolean>(true);
  const [translations, setTranslations] = useState({
    appName: "H.A.R.V.E.S.T",
    selectLanguage: "Select Language",
    enterButton: "Enter",
  });

  const router = useRouter();

  // Load stored language on mount
  useEffect(() => {
    const loadLanguage = async () => {
      const storedLang = await AsyncStorage.getItem("selectedLanguage") || "en";
      setLanguage(storedLang);
    };
    loadLanguage();
  }, []);

  // Translate all text based on the selected language
  useEffect(() => {
    const translateAll = async () => {
      setIsTranslating(true);
      const keys = {
        appName: "H.A.R.V.E.S.T",
        selectLanguage: "Select Language",
        enterButton: "Enter",
      };

      const translated = {} as any;
      for (const key in keys) {
        translated[key] = await translateText(keys[key], language);
      }

      setTranslations(translated);
      setIsTranslating(false);
    };

    translateAll();
  }, [language]);

  // Save selected language
  const handleLanguageChange = async (value: string) => {
    setLanguage(value);
    await AsyncStorage.setItem("selectedLanguage", value);
  };

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
      <View style={GlobalStyles.container}>
        <Card style={GlobalStyles.card}>
          <Card.Content>
            <Text style={GlobalStyles.title}>{translations.appName}</Text>
            <Text style={GlobalStyles.textCenter}>
              {translations.selectLanguage}
            </Text>

            {/* RadioButton Group (Excluded from Translation) */}
            <RadioButton.Group
              onValueChange={handleLanguageChange}
              value={language}
            >
              <RadioButton.Item label="English" value="en" />
              <RadioButton.Item label="Tagalog" value="tl" />
              <RadioButton.Item label="Hiligaynon" value="hil" />
            </RadioButton.Group>

            <Button
              mode="contained"
              style={{ marginTop: 10 }}
              disabled={!language}
              onPress={() => router.push("/(lands)")}
            >
              {translations.enterButton}
            </Button>
          </Card.Content>
        </Card>
      </View>
    </PaperProvider>
  );
};

export default Index;