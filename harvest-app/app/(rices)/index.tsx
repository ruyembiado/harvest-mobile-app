import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, Alert } from "react-native";
import {
  Text,
  Button,
  ActivityIndicator,
  PaperProvider,
  Card,
} from "react-native-paper";
import GlobalStyles from "../../assets/styles/styles";
import api from "../../services/api";
import customTheme from "../../assets/styles/theme";
import {
  Link,
  useRouter,
  useLocalSearchParams,
  useFocusEffect,
} from "expo-router";
import getUserIdOrLogout from "@/hooks/getUserIdOrLogout";
import CropDetails from "../../crop_types/CropDetails";
import NetInfo from "@react-native-community/netinfo"; // Import NetInfo
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage
import translateText from "../../hooks/translateText"; // Import translation function

const Index: React.FC = () => {
  const [riceVariety, setRiceVariety] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(false); // Track offline state
  const [riceLandId, setRiceLandId] = useState<number | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(true);
  const [targetLang, setTargetLang] = useState<string>("en");
  const [translations, setTranslations] = useState({
    riceVarietyTitle: "Rice Variety",
    addButton: "Add",
    noRiceVariety: "No rice variety.",
    backButton: "Back",
    offlineMode: "Offline Mode",
    displayingCachedData: "Displaying cached data.",
    noCachedData: "No cached data found. Please go online to fetch data.",
    cropNotFound: "Crop type not found.",
    averageYield: "Average Yield",
    maximumYield: "Maximum Yield",
    maturity: "Maturity",
    height: "Height",
    reactionToPestsAndDiseases: "Reaction to Pests & Diseases",
    grainSize: "Grain Size",
    millingRecovery: "Milling Recovery",
    eatingQuality: "Eating Quality",
  });

  const router = useRouter();
  const { rice_land_id } = useLocalSearchParams();

  // Load the language from AsyncStorage when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadLanguage = async () => {
        const storedLang = await AsyncStorage.getItem("selectedLanguage");
        if (storedLang && storedLang !== targetLang) {
          setTargetLang(storedLang); // Update targetLang if it has changed
        }
      };
      loadLanguage();
    }, [targetLang]) // Re-run when targetLang changes
  );

  // Translate all text when targetLang changes
  useEffect(() => {
    const translateAll = async () => {
      setIsTranslating(true);
      const keys = {
        riceVarietyTitle: "Rice Variety",
        addButton: "Add",
        noRiceVariety: "No rice variety.",
        backButton: "Back",
        offlineMode: "Offline Mode",
        displayingCachedData: "Displaying cached data.",
        noCachedData: "No cached data found. Please go online to fetch data.",
        cropNotFound: "Crop type not found.",
        averageYield: "Average Yield",
        maximumYield: "Maximum Yield",
        maturity: "Maturity",
        height: "Height",
        reactionToPestsAndDiseases: "Reaction to Pests & Diseases",
        grainSize: "Grain Size",
        millingRecovery: "Milling Recovery",
        eatingQuality: "Eating Quality",
      };

      const translated = {} as any;
      for (const key in keys) {
        translated[key] = await translateText(keys[key], targetLang);
      }

      setTranslations(translated);
      setIsTranslating(false);
    };

    translateAll();
  }, [targetLang]); // Re-translate when targetLang changes

  // Load riceLandId from AsyncStorage
  useEffect(() => {
    const loadRiceLandId = async () => {
      try {
        const savedRiceLandId = await AsyncStorage.getItem("riceLandId");
        if (savedRiceLandId) {
          const id = parseInt(savedRiceLandId, 10); // Convert string to number
          if (!isNaN(id)) {
            setRiceLandId(id); // Update the state
            console.log("Rice Land ID loaded from AsyncStorage:", id);
          }
        }
      } catch (error) {
        console.error("Failed to load riceLandId from AsyncStorage:", error);
      }
    };

    loadRiceLandId();
  }, []);

  // Check network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Fetch rice variety data
  const fetchRiceVariety = async () => {
    try {
      if (isOffline) {
        // Offline mode: Retrieve cached data
        const savedRiceVariety = await AsyncStorage.getItem(
          `cachedRiceVariety_${riceLandId}`
        );

        console.log("Cached Rice Variety (Offline):", savedRiceVariety);

        if (savedRiceVariety) {
          const parsedData = JSON.parse(savedRiceVariety);
          console.log("Parsed Rice Variety (Offline):", parsedData);

          if (parsedData && parsedData.id && parsedData.rice_variety_name) {
            setRiceVariety(parsedData);
            Alert.alert(
              translations.offlineMode,
              translations.displayingCachedData
            );
          } else {
            console.error("Invalid cached rice variety data:", parsedData);
            setRiceVariety(null);
          }
        } else {
          console.log("No cached rice variety found.");
          Alert.alert(translations.offlineMode, translations.noCachedData);
          setRiceVariety(null);
        }
      } else {
        // Online mode: Fetch fresh data
        const user_id = await getUserIdOrLogout(router);
        if (!user_id) return;
        if (!rice_land_id) return;

        console.log("Fetching rice variety for rice_land_id:", rice_land_id);

        const response = await api.get(`/get_rice_variety/${rice_land_id}`);
        if (response.status === 200) {
          console.log("Rice Variety (Online):", response.data.variety);
          setRiceVariety(response.data.variety);

          // Save rice variety to AsyncStorage
          await AsyncStorage.setItem(
            `cachedRiceVariety_${rice_land_id}`,
            JSON.stringify(response.data.variety)
          );

          // Log the saved rice variety
          const savedRiceVariety = await AsyncStorage.getItem(
            `cachedRiceVariety_${rice_land_id}`
          );
          console.log("Saved Rice Variety (Online):", savedRiceVariety);
        } else {
          console.error("Error fetching rice variety:", response.data.error);
          setRiceVariety(null);
        }
      }
    } catch (error) {
      console.error("Network error:", error);
      setRiceVariety(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (riceLandId) {
      fetchRiceVariety();
    }
  }, [riceLandId, isOffline]);

  // Show loading indicator while translating or fetching data
  if (loading || isTranslating) {
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
      <View style={[GlobalStyles.TitleContainer]}>
        <Text variant="headlineLarge" style={[GlobalStyles.title]}>
          {translations.riceVarietyTitle}
        </Text>
      </View>
      <Card style={GlobalStyles.RiceLandCard}>
        <Card.Content>
          <View style={[GlobalStyles.RiceLandContainer]}>
            <View>
              {!riceVariety && (
                <Button
                  mode="contained"
                  style={[GlobalStyles.addButton, { marginBottom: 20 }]}
                >
                  <Link href={`/(rices)/add_rice?rice_land_id=${rice_land_id}`}>
                    {translations.addButton}
                  </Link>
                </Button>
              )}
              <ScrollView
                contentContainerStyle={GlobalStyles.RiceLandScrollContainer}
                showsVerticalScrollIndicator={false}
              >
                {riceVariety ? (
                  <View key={riceVariety.id}>
                    <CropDetails
                      cropType={riceVariety.rice_variety_name}
                      translations={translations} // Pass translations for static text
                      targetLang={targetLang} // Pass the selected language
                      translateText={translateText} // Pass the translation function
                    />
                  </View>
                ) : (
                  <View style={[GlobalStyles.noDataTextContainer]}>
                    <Text style={[GlobalStyles.dataText]}>
                      {translations.noRiceVariety}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
            <Button
              icon="arrow-left"
              mode="contained"
              style={GlobalStyles.button}
            >
              <Link href={`/(tabs)/?id=${rice_land_id}`}>
                {translations.backButton}
              </Link>
            </Button>
          </View>
        </Card.Content>
      </Card>
    </PaperProvider>
  );
};

export default Index;
