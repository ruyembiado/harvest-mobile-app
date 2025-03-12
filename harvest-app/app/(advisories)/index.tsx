import {
  View,
  Alert,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
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
  Menu,
  IconButton,
} from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import DropDownPicker from "react-native-dropdown-picker";

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

  const stageIcons: { [key: string]: string } = {
    Germination: "sprout",
    "Seeding Establishment": "sprout-outline",
    Tillering: "grass",
    "Panicle Initiation": "leaf",
    Booting: "leaf-maple",
    Heading: "corn",
    Flowering: "flower",
    "Grain Filling": "wheat",
    Maturity: "rice",
  };

  const today = new Date().toISOString().split("T")[0];

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
      // console.log("fetchRecentAdvisories response:", recent_advisories);

      if (today_advisories.length > 0) {
        const advisoriesArray = JSON.parse(today_advisories[0].advisories);
        setAdvisories(advisoriesArray);

        if (!isGenerating) {
          Alert.alert(
            "Advisory Alert",
            "There are advisories for today. Please check them."
          );
        }
      } else {
        if (!isGenerating) {
          // Alert.alert(
          //   "Advisory Alert",
          //   "No advisories found. Generating advisory..."
          // );
          if (today_advisories.length === 0) {
            console.log("Generating advisory for", date);
            generateAdvisory(landId, date);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching advisories:", error);
      Alert.alert("Error", "Unable to fetch advisories.");
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
        Alert.alert("Success", "Advisory has been generated successfully.");
        setAdvisories(response.data.advisories);
      } else {
        Alert.alert("Error", "Failed to generate advisory. Please try again.");
      }
    } catch (error) {
      console.error("Error generating advisory:", error);
      Alert.alert(
        "Error",
        "Something went wrong while generating the advisory."
      );
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
      Alert.alert("Error", "Unable to fetch land details.");
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
      Alert.alert("Error", "Unable to fetch weather data.");
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      alert("Please enter a question.");
      return;
    }
    setLoading(true);
    try {
      const response = await api.post("/ask_question", { question });
      console.log("API Response:", response.data);
      // Ensure the response is in the expected format
      if (response.data && typeof response.data === "object") {
        // Extract the message or data from the response
        const answerText = response.data.data;
        setAnswer(answerText);
      } else {
        setAnswer("Sorry, I couldn't process your question.");
      }
    } catch (error) {
      console.error("Error asking question:", error);
      alert("Something went wrong. Please try again.");
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
                    placeholder="Type your question here..."
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
                      <Text>No advisories available</Text>
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
                      Previous
                    </Button>
                    <Button
                      icon="chevron-right"
                      mode="contained"
                      style={[GlobalStyles.button, { width: "30%" }]}
                      onPress={handleNextDay}
                      disabled={currentDayIndex === 6}
                    >
                      Next
                    </Button>
                  </View>
                </ScrollView>
              </>
            ) : (
              <Text>No data available</Text>
            )}
          </>
        )}
      </View>
    </PaperProvider>
  );
}
