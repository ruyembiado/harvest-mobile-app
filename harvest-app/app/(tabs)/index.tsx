import { View, Alert, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams, Link, useFocusEffect } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import api from "@/services/api";
import GlobalStyles from "@/assets/styles/styles";
import customTheme from "@/assets/styles/theme";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { Text, Button, ActivityIndicator, PaperProvider } from "react-native-paper";
import * as Location from "expo-location";
import { useRiceLand } from "../../context/RiceLandContext";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import translateText from "../../hooks/translateText";

export default function Index() {
  const { riceLandId, setRiceLandId } = useRiceLand();
  const [placeName, setPlaceName] = useState<string>("Fetching place...");
  const [rice_land_name, setRiceLandName] = useState<string>("");
  const [rice_variety_name, setRiceVarietyName] = useState<string>("");
  const [rice_land_lat, setRiceLandLat] = useState<string>("");
  const [rice_land_long, setRiceLandLong] = useState<string>("");
  const [rice_land_size, setRiceLandSize] = useState<string>("");
  const [rice_land_size_sqm, setRiceLandSizeSQM] = useState<string>("");
  const [rice_land_condition, setRiceLandCondition] = useState<string>("");
  const [rice_land_current_stage, setRiceLandStage] = useState<string>("");
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [targetLang, setTargetLang] = useState<string>("en");
  
  // Default English translations
  const [translations, setTranslations] = useState({
    fetchingPlace: "Fetching place...",
    offlineMode: "Offline Mode",
    displayingCachedData: "Displaying cached data.",
    noCachedData: "No cached data found. Please go online to fetch data.",
    location: "LOCATION:",
    landSizeHectares: "LAND SIZE (hectares):",
    landSizeSQM: "LAND SIZE (sqm):",
    landCondition: "LAND CONDITION:",
    riceGrowth: "RICE GROWTH:",
    riceVariety: "Rice Variety",
    advisories: "Advisories",
    noDataAvailable: "No data available",
    selectCondition: "-- Select Condition --",
    irrigatedLowlandRice: "Irrigated Lowland Rice",
    rainfedLowlandRice: "Rainfed Lowland Rice",
    uplandRice: "Upland Rice",
    notYetStarted: "Not Yet Started",
    germination: "Germination",
    seedingEstablishment: "Seeding Establishment",
    tillering: "Tillering",
    panicleInitiation: "Panicle Initiation",
    booting: "Booting",
    heading: "Heading",
    flowering: "Flowering",
    grainFilling: "Grain Filling",
    maturity: "Maturity",
  });

  const [riceLandConditions, setRiceLandConditions] = useState([
    { label: translations.selectCondition, value: "" },
    { label: translations.irrigatedLowlandRice, value: "Irrigated Lowland Rice" },
    { label: translations.rainfedLowlandRice, value: "Rainfed Lowland Rice" },
    { label: translations.uplandRice, value: "Upland Rice" },
  ]);

  const [riceLandStages, setRiceLandStages] = useState([
    { label: translations.notYetStarted, value: "Not Yet Started" },
    { label: translations.germination, value: "Germination" },
    { label: translations.seedingEstablishment, value: "Seeding Establishment" },
    { label: translations.tillering, value: "Tillering" },
    { label: translations.panicleInitiation, value: "Panicle Initiation" },
    { label: translations.booting, value: "Booting" },
    { label: translations.heading, value: "Heading" },
    { label: translations.flowering, value: "Flowering" },
    { label: translations.grainFilling, value: "Grain Filling" },
    { label: translations.maturity, value: "Maturity" },
  ]);

  const router = useRouter();
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();

  // Cache translations when they're updated
  const cacheTranslations = async (translations: any, lang: string) => {
    try {
      await AsyncStorage.setItem(`translations_${lang}`, JSON.stringify(translations));
    } catch (error) {
      console.error("Error caching translations:", error);
    }
  };

  // Load cached translations
  const loadCachedTranslations = async (lang: string) => {
    try {
      const cachedTranslations = await AsyncStorage.getItem(`translations_${lang}`);
      if (cachedTranslations) {
        return JSON.parse(cachedTranslations);
      }
      return null;
    } catch (error) {
      console.error("Error loading cached translations:", error);
      return null;
    }
  };

  // Update condition and stage labels based on translations
  const updateConditionAndStageLabels = (translated: any) => {
    setRiceLandConditions([
      { label: translated.selectCondition, value: "" },
      { label: translated.irrigatedLowlandRice, value: "Irrigated Lowland Rice" },
      { label: translated.rainfedLowlandRice, value: "Rainfed Lowland Rice" },
      { label: translated.uplandRice, value: "Upland Rice" },
    ]);

    setRiceLandStages([
      { label: translated.notYetStarted, value: "Not Yet Started" },
      { label: translated.germination, value: "Germination" },
      { label: translated.seedingEstablishment, value: "Seeding Establishment" },
      { label: translated.tillering, value: "Tillering" },
      { label: translated.panicleInitiation, value: "Panicle Initiation" },
      { label: translated.booting, value: "Booting" },
      { label: translated.heading, value: "Heading" },
      { label: translated.flowering, value: "Flowering" },
      { label: translated.grainFilling, value: "Grain Filling" },
      { label: translated.maturity, value: "Maturity" },
    ]);
  };

  // Load the language and data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          // Use Promise.all to load language and check network status in parallel
          const [storedLang, netInfo] = await Promise.all([
            AsyncStorage.getItem("selectedLanguage"),
            NetInfo.fetch(),
          ]);

          setIsOffline(!netInfo.isConnected);

          if (storedLang && storedLang !== targetLang) {
            setTargetLang(storedLang);
          }

          // Only attempt translation if online
          if (netInfo.isConnected) {
            await handleTranslations(storedLang || targetLang);
          }

          await fetchLandDetails();
        } catch (error) {
          console.error("Error loading data:", error);
        }
      };

      loadData();
    }, [targetLang])
  );

  // Handle translations
  const handleTranslations = async (lang: string) => {
    setIsTranslating(true);
    
    // Default English translations
    const keys = {
      fetchingPlace: "Fetching place...",
      offlineMode: "Offline Mode",
      displayingCachedData: "Displaying cached data.",
      noCachedData: "No cached data found. Please go online to fetch data.",
      location: "LOCATION:",
      landSizeHectares: "LAND SIZE (hectares):",
      landSizeSQM: "LAND SIZE (sqm):",
      landCondition: "LAND CONDITION:",
      riceGrowth: "RICE GROWTH:",
      riceVariety: "Rice Variety",
      advisories: "Advisories",
      noDataAvailable: "No data available",
      selectCondition: "-- Select Condition --",
      irrigatedLowlandRice: "Irrigated Lowland Rice",
      rainfedLowlandRice: "Rainfed Lowland Rice",
      uplandRice: "Upland Rice",
      notYetStarted: "Not Yet Started",
      germination: "Germination",
      seedingEstablishment: "Seeding Establishment",
      tillering: "Tillering",
      panicleInitiation: "Panicle Initiation",
      booting: "Booting",
      heading: "Heading",
      flowering: "Flowering",
      grainFilling: "Grain Filling",
      maturity: "Maturity",
    };

    try {
      // Only translate if online
      if (!isOffline) {
        // Translate all keys in parallel
        const translationPromises = Object.entries(keys).map(async ([key, value]) => {
          return { key, value: await translateText(value, lang) };
        });

        const translatedEntries = await Promise.all(translationPromises);
        const translated = translatedEntries.reduce((acc, { key, value }) => {
          acc[key] = value;
          return acc;
        }, {} as any);

        setTranslations(translated);
        updateConditionAndStageLabels(translated);
        await cacheTranslations(translated, lang);
      }
    } catch (error) {
      console.error("Translation error:", error);
      // Fallback to English if translation fails
      setTranslations(keys);
      updateConditionAndStageLabels(keys);
    } finally {
      await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s delay
      setIsTranslating(false);
    }
  };

  // Fetch rice land details
  const fetchLandDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      if (isOffline) {
        // Offline mode: Retrieve cached data
        const cachedRiceLand = await AsyncStorage.getItem(`cachedRiceLand_${id}`);
        if (cachedRiceLand) {
          const data = JSON.parse(cachedRiceLand);
          setRiceLandData(data);
          // Alert.alert(translations.offlineMode, translations.displayingCachedData);
        } else {
          // Alert.alert(translations.offlineMode, translations.noCachedData);
        }
      } else {
        // Online mode: Fetch data from API
        const response = await api.get(`/get_rice_land/${id}`);
        const data = response.data;
        setRiceLandData(data);

        // Cache the fetched data
        await AsyncStorage.setItem(`cachedRiceLand_${id}`, JSON.stringify(data));
      }
    } catch (error) {
      // console.error("Error fetching land details:", error);
      // Alert.alert("Error", "Failed to fetch land details.");
    } finally {
      setLoading(false);
    }
  };

  // Set rice land data
  const setRiceLandData = (data: any) => {
    setRiceLandId(data.id);
    setRiceLandName(data.rice_land_name);
    setRiceLandLat(data.rice_land_lat);
    setRiceLandLong(data.rice_land_long);
    setRiceLandSize(data.rice_land_size);
    setRiceLandSizeSQM(data.rice_land_size_sqm);
    setRiceLandCondition(data.rice_land_condition);
    setRiceLandStage(data.rice_land_current_stage);
    setRiceVarietyName(data.rice_variety_name);
  };

  // Fetch weather data
  const fetchWeatherData = async () => {
    setWeatherLoading(true);
    try {
      if (isOffline) {
        // Offline mode: Retrieve cached data
        const cachedWeatherData = await AsyncStorage.getItem(`cachedWeatherData_${id}`);
        if (cachedWeatherData) {
          setWeatherData(JSON.parse(cachedWeatherData));
          // Alert.alert(translations.offlineMode, translations.displayingCachedData);
        } else {
          // Alert.alert(translations.offlineMode, translations.noCachedData);
        }
      } else {
        const response = await api.get(
          `https://api.open-meteo.com/v1/forecast?latitude=${rice_land_lat}&longitude=${rice_land_long}&current_weather=true`
        );
        setWeatherData(response.data.current_weather);

        // Cache the fetched data
        await AsyncStorage.setItem(
          `cachedWeatherData_${id}`,
          JSON.stringify(response.data.current_weather)
        );
      }
    } catch (error) {
      // console.error("Error fetching weather data:", error);
      // Alert.alert("Error", "Failed to fetch weather data.");
    } finally {
      setWeatherLoading(false);
    }
  };

  // Reverse geocode to get place name
  const reverseGeocodeExpo = async (lat: number, lng: number) => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Please allow location access.");
        return;
      }

      let result = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (result.length > 0) {
        let place = result[0];
        setPlaceName(
          `${place.city || "Unknown place"}, ${place.region || "Unknown region"}, ${place.country || "Unknown country"}`
        );
      } else {
        setPlaceName(translations.fetchingPlace);
      }
    } catch (error) {
      // console.error("Error fetching place:", error);
      // Alert.alert("Error", "Failed to fetch place name.");
    }
  };

  useEffect(() => {
    if (rice_land_lat && rice_land_long) {
      // Run these in parallel
      Promise.all([
        reverseGeocodeExpo(parseFloat(rice_land_lat), parseFloat(rice_land_long)),
        fetchWeatherData()
      ]).catch(error => {
        console.error("Error in parallel operations:", error);
      });
    }
  }, [rice_land_lat, rice_land_long]);

  const getWeatherIcon = (weatherCode: number) => {
    const weatherIcons: { [key: number]: string } = {
      0: "weather-sunny",
      1: "weather-partly-cloudy",
      2: "weather-cloudy",
      3: "weather-cloudy",
      45: "weather-fog",
      48: "weather-fog",
      51: "weather-rainy",
      53: "weather-rainy",
      55: "weather-rainy",
      61: "weather-pouring",
      63: "weather-pouring",
      65: "weather-pouring",
      66: "weather-snowy-rainy",
      67: "weather-snowy-rainy",
      71: "weather-snowy",
      73: "weather-snowy",
      75: "weather-snowy",
      80: "weather-pouring",
      81: "weather-pouring",
      82: "weather-pouring",
      95: "weather-lightning",
      96: "weather-lightning-rainy",
      99: "weather-lightning-rainy",
    };

    return weatherIcons[weatherCode] || "weather-cloudy";
  };

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
      <ScrollView
        contentContainerStyle={[
          GlobalStyles.RiceLandScrollContainer,
          { flexGrow: 1 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            GlobalStyles.container,
            { alignItems: "center", justifyContent: "center" },
          ]}
        >
          {loading ? (
            <View style={GlobalStyles.loadingContainer}>
              <ActivityIndicator
                animating={true}
                size="large"
                color={GlobalStyles.activityIndicator.color}
              />
            </View>
          ) : (
            <>
              {weatherLoading ? (
                <View style={GlobalStyles.loadingContainer}>
                  <ActivityIndicator
                    animating={true}
                    size="large"
                    color={GlobalStyles.activityIndicator.color}
                  />
                </View>
              ) : weatherData ? (
                <>
                  <View
                    style={{
                      flexDirection: "column",
                      alignItems: "flex-end",
                      justifyContent: "center",
                      alignSelf: "flex-end",
                      marginBottom: 10,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={[GlobalStyles.dataText]}>
                        {formattedDate}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                      }}
                    >
                      <Icon
                        name={getWeatherIcon(weatherData.weathercode)}
                        size={40}
                        color="#FFD700"
                      />
                      <Text style={[GlobalStyles.dataText, { fontSize: 28 }]}>
                        {weatherData.temperature}°C
                      </Text>
                    </View>
                  </View>
                  <View style={[GlobalStyles.mainDetailContainer]}>
                    <Text style={GlobalStyles.label}>
                      {translations.location}
                    </Text>
                    <Text style={[GlobalStyles.dataText]}>{placeName}</Text>
                  </View>
                  <View style={[GlobalStyles.mainDetailContainer]}>
                    <Text style={GlobalStyles.label}>
                      {translations.landSizeHectares}
                    </Text>
                    <Text style={[GlobalStyles.dataText]}>
                      {rice_land_size || 0} Hectares
                    </Text>
                  </View>
                  <View style={[GlobalStyles.mainDetailContainer]}>
                    <Text style={GlobalStyles.label}>
                      {translations.landSizeSQM}
                    </Text>
                    <Text style={[GlobalStyles.dataText]}>
                      {rice_land_size_sqm || 0} sqm
                    </Text>
                  </View>
                  <View style={[GlobalStyles.mainDetailContainer]}>
                    <Text style={GlobalStyles.label}>
                      {translations.landCondition}
                    </Text>
                    <Text style={GlobalStyles.dataText}>
                      {riceLandConditions.find(
                        (condition) => condition.value === rice_land_condition
                      )?.label || "Not available"}
                    </Text>
                  </View>
                  <View style={[GlobalStyles.mainDetailContainer]}>
                    <Text style={GlobalStyles.label}>
                      {translations.riceGrowth}
                    </Text>
                    <Text style={GlobalStyles.dataText}>
                      {riceLandStages.find(
                        (stage) => stage.value === rice_land_current_stage
                      )?.label || "Not available"}
                    </Text>
                  </View>
                  <Button
                    icon="seed"
                    mode="contained"
                    style={[
                      GlobalStyles.button,
                      { width: "100%", marginBottom: 5, marginTop: 0 },
                    ]}
                  >
                    <Link
                      href={`/(rices)?rice_land_id=${riceLandId}`}
                      style={{}}
                    >
                      {translations.riceVariety}
                    </Link>
                  </Button>
                  {rice_variety_name !== null && rice_variety_name !== "" && (
                    <Button
                      icon={getWeatherIcon(weatherData.weathercode)}
                      mode="contained"
                      style={[
                        GlobalStyles.button,
                        { width: "100%", backgroundColor: "#FBBC04" },
                      ]}
                    >
                      <Link href={`/(advisories)?land_id=${riceLandId}`}>
                        {translations.advisories}
                      </Link>
                    </Button>
                  )}
                </>
              ) : (
                <Text>{translations.noDataAvailable}</Text>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </PaperProvider>
  );
}