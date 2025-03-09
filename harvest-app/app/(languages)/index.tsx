import React, { useEffect, useState } from "react";
import { View } from "react-native";
import {
  Provider as PaperProvider,
  Text,
  RadioButton,
  Card,
  Button,
} from "react-native-paper";
import { useRouter } from "expo-router";
import GlobalStyles from "../../assets/styles/styles";
import customTheme from "../../assets/styles/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Index: React.FC = () => {
  const [language, setLanguage] = useState<string>("en");
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

  // Save selected language
  const handleLanguageChange = async (value: string) => {
    setLanguage(value);
    console.log("Selected Language:", value);
    await AsyncStorage.setItem("selectedLanguage", value);
  };

  return (
    <PaperProvider theme={customTheme}>
      <View style={GlobalStyles.container}>
        <Card style={GlobalStyles.card}>
          <Card.Content>
            <Text style={GlobalStyles.title}>H.A.R.V.E.S.T</Text>
            <Text style={GlobalStyles.textCenter}>Select Language</Text>

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
              Enter
            </Button>
          </Card.Content>
        </Card>
      </View>
    </PaperProvider>
  );
};

export default Index;