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
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import translateText from "../../hooks/translateText";

const Index: React.FC = () => {
  const [riceVariety, setRiceVariety] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(false);
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

  useFocusEffect(
    useCallback(() => {
      const loadLanguage = async () => {
        try {
          const storedLang = await AsyncStorage.getItem("selectedLanguage");
          if (storedLang && storedLang !== targetLang) {
            setTargetLang(storedLang);
          }
        } catch (error) {
          console.error("Failed to load language:", error);
        }
      };
      loadLanguage();
    }, [targetLang])
  );

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

      try {
        const translated = await Promise.all(
          Object.entries(keys).map(async ([key, value]) => ({
            [key]: await translateText(value, targetLang),
          }))
        );

        const translatedObj = translated.reduce(
          (acc, curr) => ({ ...acc, ...curr }),
          {}
        );

        setTranslations(translatedObj);
      } catch (error) {
        console.error("Translation failed:", error);
      } finally {
        setIsTranslating(false);
      }
    };

    translateAll();
  }, [targetLang]);

  useEffect(() => {
    const loadRiceLandId = async () => {
      try {
        const savedRiceLandId = await AsyncStorage.getItem("riceLandId");
        if (savedRiceLandId) {
          const id = parseInt(savedRiceLandId, 10);
          if (!isNaN(id)) {
            setRiceLandId(id);
          }
        }
      } catch (error) {
        console.error("Failed to load riceLandId:", error);
      }
    };
    loadRiceLandId();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const fetchRiceVariety = async () => {
    try {
      setLoading(true);

      if (isOffline) {
        const cachedData = await AsyncStorage.getItem(
          `cachedRiceVariety_${riceLandId}`
        );

        if (cachedData) {
          setRiceVariety(JSON.parse(cachedData));
        } else {
          Alert.alert(translations.offlineMode, translations.noCachedData);
          setRiceVariety(null);
        }
      } else {
        const user_id = await getUserIdOrLogout(router);
        if (!user_id || !rice_land_id) return;

        const response = await api.get(`/get_rice_variety/${rice_land_id}`);
        if (response.status === 200) {
          const variety = response.data.variety;

          await AsyncStorage.setItem(
            `cachedRiceVariety_${rice_land_id}`,
            JSON.stringify(variety)
          );

          setRiceVariety(variety);
        } else {
          setRiceVariety(null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch rice variety:", error);
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
      <View style={GlobalStyles.TitleContainer}>
        <Text variant="headlineLarge" style={GlobalStyles.title}>
          {translations.riceVarietyTitle}
        </Text>
      </View>
      <Card style={GlobalStyles.RiceLandCard}>
        <Card.Content>
          <View style={(GlobalStyles.RiceLandContainer, { height: "95%" })}>
            <ScrollView
              contentContainerStyle={GlobalStyles.RiceLandScrollContainer}
              showsVerticalScrollIndicator={false}
            >
              {riceVariety ? (
                <CropDetails
                  cropType={riceVariety.rice_variety_name}
                  translations={translations}
                  targetLang={targetLang}
                  translateText={translateText}
                  isOffline={isOffline}
                />
              ) : (
                <>
                  <Button
                    mode="contained"
                    style={[
                      GlobalStyles.addButton,
                      { marginBottom: 20, width: "100%" },
                    ]}
                  >
                    <Link
                      href={`/(rices)/add_rice/?rice_land_id=${rice_land_id}`}
                    >
                      Add Rice Variety
                    </Link>
                  </Button>
                  <Text
                    style={(GlobalStyles.dataText, { textAlign: "center" })}
                  >
                    {translations.noRiceVariety}
                  </Text>
                </>
              )}
            </ScrollView>

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
