import {
  View,
  Alert,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import api from "@/services/api";
import GlobalStyles from "@/assets/styles/styles";
import customTheme from "@/assets/styles/theme";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  Text,
  ActivityIndicator,
  PaperProvider,
  Button,
  TextInput,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import translateText from "../../hooks/translateText"; // Import translation hook

export default function Index() {
  const [advisories, setAdvisories] = useState<any[]>([]);
  const [rice_land_id, setRiceLandId] = useState<string>("");
  const [rice_land_lat, setRiceLandLat] = useState<string>("");
  const [rice_land_long, setRiceLandLong] = useState<string>("");
  const [rice_land_size, setRiceLandSize] = useState<string>("");
  const [rice_land_condition, setRiceLandCondition] = useState<string>("");
  const [rice_variety, setRiceVariety] = useState<string>("");
  const [rice_land_current_stage, setRiceLandStage] = useState<string>("");
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const { land_id } = useLocalSearchParams();
  const [question, setQuestion] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [targetLang, setTargetLang] = useState<string>("en"); // Default language
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
    previous: "Previous",
    next: "Next",
    typeYourQuestion: "Type your question here...",
    advisoryAlert: "Advisory Alert",
    noAdvisoriesFound: "No advisories found. Generating advisory...",
    success: "Success",
    advisoryGenerated: "Advisory has been generated successfully.",
    error: "Error",
    failedToGenerateAdvisory: "Failed to generate advisory. Please try again.",
    somethingWentWrong: "Something went wrong while generating the advisory.",
    pleaseEnterQuestion: "Please enter a question.",
    sorryCouldNotProcess: "Sorry, I couldn't process your question.",
    tryAgain: "Something went wrong. Please try again.",
  });

  const stageIcons: { [key: string]: string } = {
    "Germination": "sprout",
    "Seeding Establishment": "sprout-outline",
    "Tillering": "grass",
    "Panicle Initiation": "leaf",
    "Booting": "leaf-maple",
    "Heading": "corn",
    "Flowering": "flower",
    "Grain Filling": "wheat",
    "Maturity": "rice",
  };

  const today = new Date().toISOString().split("T")[0];

  // Function to translate advisories
  const translateAdvisories = async (advisories: string[]) => {
    const translatedAdvisories = await Promise.all(
      advisories.map(async (advisory) => {
        return await translateText(advisory, targetLang);
      })
    );
    return translatedAdvisories;
  };

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
        previous: "Previous",
        next: "Next",
        typeYourQuestion: "Type your question here...",
        advisoryAlert: "Advisory Alert",
        noAdvisoriesFound: "No advisories found. Generating advisory...",
        success: "Success",
        advisoryGenerated: "Advisory has been generated successfully.",
        error: "Error",
        failedToGenerateAdvisory: "Failed to generate advisory. Please try again.",
        somethingWentWrong: "Something went wrong while generating the advisory.",
        pleaseEnterQuestion: "Please enter a question.",
        sorryCouldNotProcess: "Sorry, I couldn't process your question.",
        tryAgain: "Something went wrong. Please try again.",
      };

      const translated = {} as any;
      for (const key in keys) {
        translated[key] = await translateText(keys[key], targetLang);
      }

      setTranslations(translated);
    };

    translateAll();
  }, [targetLang]); // Re-translate when targetLang changes

  // Fetch advisories
  const fetchAdvisories = async (
    landId: string,
    date: string,
    isGenerating: boolean = false
  ) => {
    if (!landId) return;
    try {
      const response = await api.get(`/get_advisories_today/${landId}/${date}`);
      const today_advisories = response.data;
      const recent_advisories = response.data.recent_advisories;

      console.log("fetchAdvisories response:", today_advisories);

      if (today_advisories.length > 0) {
        const advisoriesArray = JSON.parse(today_advisories[0].advisories);
        const translatedAdvisories = await translateAdvisories(advisoriesArray); // Translate advisories
        setAdvisories(translatedAdvisories);

        if (!isGenerating) {
          Alert.alert(
            translations.advisoryAlert,
            "There are advisories for today. Please check them."
          );
        }
      } else {
        if (!isGenerating) {
          Alert.alert(
            translations.advisoryAlert,
            translations.noAdvisoriesFound
          );
          if (today_advisories.length === 0) {
            console.log("Generating advisory for", date);
            generateAdvisory(landId, date);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching advisories:", error);
      Alert.alert(translations.error, translations.somethingWentWrong);
    }
  };

  // Generate advisories
  const generateAdvisory = async (landId: string, date: string) => {
    setLoading(true);
    try {
      const response = await api.post("/generate_advisories", {
        rice_land_id: landId,
        rice_land_size,
        rice_land_condition,
        rice_land_current_stage,
        rice_variety,
        weatherData: weatherData?.daily?.[currentDayIndex] || null,
        date,
      });

      console.log("generateAdvisory response:", response.data);

      if (response.status === 200) {
        const advisoriesArray = response.data.advisories;
        const translatedAdvisories = await translateAdvisories(advisoriesArray); // Translate advisories
        setAdvisories(translatedAdvisories);

        Alert.alert(translations.success, translations.advisoryGenerated);
      } else {
        Alert.alert(translations.error, translations.failedToGenerateAdvisory);
      }
    } catch (error) {
      console.error("Error generating advisory:", error);
      Alert.alert(translations.error, translations.somethingWentWrong);
    } finally {
      setLoading(false);
    }
  };

  // Fetch land details
  const fetchLandDetails = async () => {
    if (!land_id) return;
    setLoading(true);
    try {
      const response = await api.get(`/get_rice_land/${land_id}`);
      const data = response.data;
      setRiceLandId(data.id);
      setRiceLandLat(data.rice_land_lat);
      setRiceLandLong(data.rice_land_long);
      setRiceLandSize(data.rice_land_size);
      setRiceLandCondition(data.rice_land_condition);
      setRiceLandStage(data.rice_land_current_stage);
      setRiceVariety(data.rice_variety.rice_variety_name);
      setLoading(false);

      fetchAdvisories(data.id, today);
    } catch (error) {
      console.error("Error fetching land details:", error);
      Alert.alert(translations.error, translations.somethingWentWrong);
    }
  };

  // Map weather codes to descriptions
  const weatherDescriptions: { [key: number]: string } = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snowfall",
    73: "Moderate snowfall",
    75: "Heavy snowfall",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };

  // Fetch 7-day forecast data
  const fetchWeatherData = async () => {
    setWeatherLoading(true);
    try {
      const response = await api.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${rice_land_lat}&longitude=${rice_land_long}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7&current_weather=true`
      );

      setWeatherData({
        daily: response.data.daily,
        current: response.data.current_weather,
      });
      setWeatherLoading(false);
    } catch (error) {
      console.error("Error fetching weather data:", error);
      Alert.alert(translations.error, translations.somethingWentWrong);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      alert(translations.pleaseEnterQuestion);
      return;
    }
    setLoading(true);
    try {
      const response = await api.post("/ask_question", { question });
      console.log("API Response:", response.data);
      if (response.data && typeof response.data === "object") {
        const answerText = response.data.data;
        setAnswer(answerText);
      } else {
        setAnswer(translations.sorryCouldNotProcess);
      }
    } catch (error) {
      console.error("Error asking question:", error);
      alert(translations.tryAgain);
    } finally {
      setLoading(false);
    }
  };

  // Fetch land details when component mounts
  useEffect(() => {
    fetchLandDetails();
  }, []);

  // Fetch weather data when latitude & longitude are available
  useEffect(() => {
    if (rice_land_lat && rice_land_long) {
      fetchWeatherData();
    }
  }, [rice_land_lat, rice_land_long]);

  // Fetch advisories when currentDayIndex changes
  useEffect(() => {
    if (weatherData?.daily?.time?.[currentDayIndex]) {
      const date = weatherData.daily.time[currentDayIndex];
      fetchAdvisories(rice_land_id, date);
    }
  }, [currentDayIndex, weatherData]);

  // Map weather codes to icons
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

  const handleNextDay = () => {
    if (currentDayIndex < 6) {
      setCurrentDayIndex(currentDayIndex + 1);
    }
  };

  const handlePreviousDay = () => {
    if (currentDayIndex > 0 || currentDayIndex === 0) {
      setCurrentDayIndex(currentDayIndex - 1);
    }
  };

  const currentDate = new Date(
    weatherData?.daily?.time?.[currentDayIndex] || today
  );
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <PaperProvider theme={customTheme}>
      <View
        style={[
          GlobalStyles.container,
          { alignItems: "center", justifyContent: "flex-start" },
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
            ) : weatherData?.daily ? (
              <>
                <View
                  style={[
                    GlobalStyles.mainDetailContainer,
                    {
                      flexDirection: "column",
                      alignItems: "flex-start",
                      justifyContent: "center",
                      alignSelf: "flex-start",
                      marginBottom: 10,
                      width: "100%",
                    },
                  ]}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={[GlobalStyles.dataText]}>{formattedDate}</Text>
                  </View>
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 5,
                        }}
                      >
                        <Icon
                          name={getWeatherIcon(
                            weatherData.daily.weathercode[currentDayIndex]
                          )}
                          size={40}
                          color="#FFD700"
                        />
                        <Text style={[GlobalStyles.dataText, { fontSize: 28 }]}>
                          {currentDayIndex === 0
                            ? `${weatherData?.current?.temperature}°C`
                            : `${weatherData?.daily?.temperature_2m_min?.[currentDayIndex]}°C`}
                        </Text>
                      </View>
                      <View>
                        <Text style={[GlobalStyles.dataText]}>
                          {rice_land_current_stage}
                        </Text>
                        <Text
                          style={[GlobalStyles.dataText, { fontWeight: "700" }]}
                        >
                          {rice_variety}
                        </Text>
                      </View>
                    </View>
                    <View style={{ width: "50%" }}>
                      <Icon
                        name={
                          stageIcons[rice_land_current_stage] || "help-circle"
                        }
                        size={50}
                        color="#4CAF50"
                        style={{ alignSelf: "center" }}
                      />
                    </View>
                  </View>
                </View>
                <View
                  style={{
                    width: "100%",
                    marginBottom: 10,
                    borderColor: "#EBEBEB",
                    borderWidth: 1,
                    borderRadius: 20,
                    justifyContent: "center",
                    paddingHorizontal: 15,
                    backgroundColor: "#fff",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  {/* TextInput for Question */}
                  <TextInput
                    style={{
                      flex: 1,
                      backgroundColor: "transparent",
                      width: "100%",
                    }}
                    value={question}
                    placeholder={translations.typeYourQuestion}
                    onChangeText={(text) => setQuestion(text)}
                    autoCapitalize="none"
                  />

                  {/* Search Icon */}
                  <Icon
                    name="search-web"
                    size={20}
                    color="#000"
                    onPress={handleAskQuestion}
                    style={{ marginRight: 0, marginLeft: 0 }}
                  />
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Result Container */}
                  {answer && (
                    <View
                      style={{
                        width: "100%",
                        marginBottom: 10,
                        borderColor: "#EBEBEB",
                        borderWidth: 1,
                        borderRadius: 20,
                        justifyContent: "center",
                        paddingHorizontal: 15,
                        paddingVertical: 10,
                        backgroundColor: "#fff",
                      }}
                    >
                      <Text style={[GlobalStyles.dataText]}>{answer}</Text>
                    </View>
                  )}

                  <View>
                    <Text
                      style={[
                        GlobalStyles.dataText,
                        {
                          fontSize: 20,
                          fontWeight: "bold",
                          textAlign: "center",
                        },
                      ]}
                    >
                      {weatherData?.daily
                        ? weatherDescriptions[
                            weatherData.daily.weathercode[currentDayIndex]
                          ] || "Unknown"
                        : "Loading..."}
                    </Text>
                    {advisories.length > 0 ? (
                      advisories.map((advisory, index) => (
                        <Text key={index} style={[GlobalStyles.dataText]}>
                          • {advisory}
                        </Text>
                      ))
                    ) : (
                      <Text>{translations.noDataAvailable}</Text>
                    )}
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                      width: "100%",
                      gap: 10,
                      marginTop: 20,
                    }}
                  >
                    <Button
                      icon="chevron-left"
                      mode="contained"
                      style={[GlobalStyles.button, { width: "30%" }]}
                      onPress={handlePreviousDay}
                      disabled={currentDayIndex === 0}
                    >
                      {translations.previous}
                    </Button>
                    <Button
                      icon="chevron-right"
                      mode="contained"
                      style={[GlobalStyles.button, { width: "30%" }]}
                      onPress={handleNextDay}
                      disabled={currentDayIndex === 6}
                    >
                      {translations.next}
                    </Button>
                  </View>
                </ScrollView>
              </>
            ) : (
              <Text>{translations.noDataAvailable}</Text>
            )}
          </>
        )}
      </View>
    </PaperProvider>
  );
}