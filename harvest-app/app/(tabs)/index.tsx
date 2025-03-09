import { View, Alert, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams, Link } from "expo-router";
import React, { useState, useEffect } from "react";
import api from "@/services/api";
import GlobalStyles from "@/assets/styles/styles";
import customTheme from "@/assets/styles/theme";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import {
  Text,
  Button,
  ActivityIndicator,
  PaperProvider,
} from "react-native-paper";
import * as Location from "expo-location";
import { useRiceLand } from "../../context/RiceLandContext";
import NetInfo from "@react-native-community/netinfo"; // Import NetInfo
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage

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
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();

  const riceLandConditions = [
    { label: "-- Select Condition --", value: "" },
    { label: "Irrigated Lowland Rice", value: "Irrigated Lowland Rice" },
    { label: "Rainfed Lowland Rice", value: "Rainfed Lowland Rice" },
    { label: "Upland Rice", value: "Upland Rice" },
  ];
  const riceLandStages = [
    { label: "Not Yet Started", value: "Not Yet Started" },
    { label: "Germination", value: "Germination" },
    { label: "Seeding Establishment", value: "Seeding Establishment" },
    { label: "Tillering", value: "Tillering" },
    { label: "Panicle Initiation", value: "Panicle Initiation" },
    { label: "Booting", value: "Booting" },
    { label: "Heading", value: "Heading" },
    { label: "Flowering", value: "Flowering" },
    { label: "Grain Filling", value: "Grain Filling" },
    { label: "Maturity", value: "Maturity" },
  ];

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (rice_land_name) {
      navigation.setOptions({ title: rice_land_name });
    }
  }, [rice_land_name, navigation, isOffline]);

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

  // Fetch rice land details
  const fetchLandDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      if (isOffline) {
        // Offline mode: Retrieve cached data
        const cachedRiceLand = await AsyncStorage.getItem(
          `cachedRiceLand_${id}`
        );
        if (cachedRiceLand) {
          const data = JSON.parse(cachedRiceLand);
          setRiceLandData(data);
          Alert.alert("Offline Mode", "Displaying cached rice land data.");
        } else {
          Alert.alert(
            "Offline Mode",
            "No cached data found. Please go online to fetch data."
          );
        }
      } else {
        // Online mode: Fetch data from API
        const response = await api.get(`/get_rice_land/${id}`);
        const data = response.data;
        setRiceLandData(data);

        // Cache the fetched data
        await AsyncStorage.setItem(
          `cachedRiceLand_${id}`,
          JSON.stringify(data)
        );

        const cachedRiceLand = await AsyncStorage.getItem(
          `cachedRiceLand_${id}`
        );
        console.log("cached cachedRiceLand:", cachedRiceLand);
      }
    } catch (error) {
      // console.error("Error fetching land details:", error);
      // Alert.alert("Error", "Unable to fetch land details.");
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
        const cachedWeatherData = await AsyncStorage.getItem(
          `cachedWeatherData_${id}`
        );
        if (cachedWeatherData) {
          setWeatherData(JSON.parse(cachedWeatherData));
          Alert.alert("Offline Mode", "Displaying cached weather data.");
        } else {
          Alert.alert(
            "Offline Mode",
            "No cached data found. Please go online to fetch data."
          );
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

        const cachedWeatherData = await AsyncStorage.getItem(
          `cachedWeatherData_${id}`
        );
        console.log("cached cachedWeatherData:", cachedWeatherData);
      }
    } catch (error) {
      // console.error("Error fetching weather data:", error);
      // Alert.alert("Error", "Unable to fetch weather data.");
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
          `${place.city || "Unknown place"}, ${
            place.region || "Unknown region"
          }, ${place.country || "Unknown country"}`
        );
      } else {
        setPlaceName("Place not found");
      }
    } catch (error) {
      // console.error("Error fetching place:", error);
      // Alert.alert("Error", "Failed to fetch place name.");
    }
  };

  useEffect(() => {
    fetchLandDetails();
  }, [id, isOffline]);

  useEffect(() => {
    if (rice_land_lat && rice_land_long) {
      reverseGeocodeExpo(parseFloat(rice_land_lat), parseFloat(rice_land_long));
      fetchWeatherData();
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

    return weatherIcons[weatherCode] || "weather-cloudy"; // Default icon
  };

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
                    <Text style={GlobalStyles.label}>LOCATION:</Text>
                    <Text style={[GlobalStyles.dataText]}>{placeName}</Text>
                  </View>
                  <View style={[GlobalStyles.mainDetailContainer]}>
                    <Text style={GlobalStyles.label}>
                      LAND SIZE (hectares):
                    </Text>
                    <Text style={[GlobalStyles.dataText]}>
                      {rice_land_size || 0} Hectares
                    </Text>
                  </View>
                  <View style={[GlobalStyles.mainDetailContainer]}>
                    <Text style={GlobalStyles.label}>LAND SIZE (sqm):</Text>
                    <Text style={[GlobalStyles.dataText]}>
                      {rice_land_size_sqm || 0} sqm
                    </Text>
                  </View>
                  <View style={[GlobalStyles.mainDetailContainer]}>
                    <Text style={GlobalStyles.label}>LAND CONDITION:</Text>
                    <Text style={GlobalStyles.dataText}>
                      {riceLandConditions.find(
                        (condition) => condition.value === rice_land_condition
                      )?.label || "Not available"}
                    </Text>
                  </View>
                  <View style={[GlobalStyles.mainDetailContainer]}>
                    <Text style={GlobalStyles.label}>RICE GROWTH:</Text>
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
                      Rice Variety
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
                        Advisories
                      </Link>
                    </Button>
                  )}
                </>
              ) : (
                <Text>No data available</Text>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </PaperProvider>
  );
}
