import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Alert, FlatList } from "react-native";
import { Text, ActivityIndicator, PaperProvider } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useRiceLand } from "../../context/RiceLandContext";
import { useFocusEffect } from "expo-router";
import api from "../../services/api";
import GlobalStyles from "@/assets/styles/styles";
import customTheme from "@/assets/styles/theme";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import translateText from "../../hooks/translateText";

const WeatherScreen: React.FC = () => {
  const { riceLandId } = useRiceLand();
  const [landLoading, setLandLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [rice_land_lat, setRiceLandLat] = useState<string | null>(null);
  const [rice_land_long, setRiceLandLong] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<Array<any>>([]);
  const [current_weather_temperature, setCurrentWeatherTemp] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isTranslating, setIsTranslating] = useState(true);
  const [targetLang, setTargetLang] = useState<string>("en");

  const defaultTranslations = {
    loading: "Loading...",
    highestTemperature: "Highest Temperature",
    lowestTemperature: "Lowest Temperature",
    wind: "Wind",
    rain: "Rain",
    sunshine: "Sunshine",
    noCachedData: "No cached data found. Please go online to fetch data.",
    error: "Error",
    fetchFailed: "Unable to fetch data. Please try again.",
  };

  const [translations, setTranslations] = useState(defaultTranslations);

  // Load language settings
  useFocusEffect(
    useCallback(() => {
      const loadLanguage = async () => {
        const storedLang = await AsyncStorage.getItem("selectedLanguage");
        if (storedLang && storedLang !== targetLang) {
          setTargetLang(storedLang);
        }
      };
      loadLanguage();
    }, [targetLang])
  );

  // Translate text only when online
  useEffect(() => {
    const translateAll = async () => {
      if (isOffline) {
        setTranslations(defaultTranslations); 
        setIsTranslating(false);
        return;
      }

      const translated = {} as any;
      for (const key in defaultTranslations) {
        translated[key] = await translateText(defaultTranslations[key], targetLang);
      }

      setTranslations(translated);
      await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s delay
      setIsTranslating(false);
    };

    translateAll();
  }, [targetLang, isOffline]);

  // Check network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Fetch land details
  useEffect(() => {
    const fetchLandDetails = async () => {
      if (!riceLandId) return;
      setLandLoading(true);

      try {
        if (isOffline) {
          const cachedLandData = await AsyncStorage.getItem(`cachedLandData_${riceLandId}`);
          if (cachedLandData) {
            const data = JSON.parse(cachedLandData);
            setRiceLandLat(data.rice_land_lat);
            setRiceLandLong(data.rice_land_long);
          } else {
            throw new Error("No cached land data found");
          }
        } else {
          const response = await api.get(`/get_rice_land/${riceLandId}`);
          const data = response.data;

          if (data && data.rice_land_lat && data.rice_land_long) {
            setRiceLandLat(data.rice_land_lat);
            setRiceLandLong(data.rice_land_long);

            await AsyncStorage.setItem(
              `cachedLandData_${riceLandId}`,
              JSON.stringify(data)
            );
          } else {
            throw new Error("Invalid land data received");
          }
        }
      } catch (error) {
        Alert.alert(
          translations.error,
          isOffline ? translations.noCachedData : translations.fetchFailed
        );
      } finally {
        setLandLoading(false);
      }
    };
    fetchLandDetails();
  }, [riceLandId, isOffline]);

  // Fetch weather data
  useEffect(() => {
    if (rice_land_lat && rice_land_long) {
      fetchWeatherData();
    }
  }, [rice_land_lat, rice_land_long, isOffline]);

  const fetchWeatherData = async () => {
    setWeatherLoading(true);

    try {
      if (isOffline) {
        const cachedWeatherData = await AsyncStorage.getItem(`cachedWeatherData_${riceLandId}`);
        const cachedCurrentTemp = await AsyncStorage.getItem(`cachedCurrentTemp_${riceLandId}`);

        if (cachedWeatherData && cachedCurrentTemp) {
          setWeatherData(JSON.parse(cachedWeatherData));
          setCurrentWeatherTemp(JSON.parse(cachedCurrentTemp));
        } else {
          throw new Error("No cached weather data found");
        }
      } else {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${rice_land_lat}&longitude=${rice_land_long}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,sunshine_duration,weathercode&timezone=auto&current_weather=true`
        );
        const data = await response.json();

        setCurrentWeatherTemp(data.current_weather.temperature);

        const transformedData = data.daily.time.map((date, index) => ({
          date,
          high: data.daily.temperature_2m_max?.[index] ?? "N/A",
          low: data.daily.temperature_2m_min?.[index] ?? "N/A",
          rain: `${data.daily.precipitation_sum?.[index] ?? 0} mm`,
          wind: `${data.daily.windspeed_10m_max?.[index] ?? "N/A"} km/h`,
          sun: `${Math.round((data.daily.sunshine_duration?.[index] ?? 0) / 3600)}h`,
          weatherCode: data.daily.weathercode?.[index] ?? 0,
          day: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
          icon: getWeatherIcon(data.daily.weathercode?.[index]),
        }));

        setWeatherData(transformedData);

        await AsyncStorage.setItem(
          `cachedWeatherData_${riceLandId}`,
          JSON.stringify(transformedData)
        );
        await AsyncStorage.setItem(
          `cachedCurrentTemp_${riceLandId}`,
          JSON.stringify(data.current_weather.temperature)
        );
      }
    } catch (error) {
      Alert.alert(
        translations.error,
        isOffline ? translations.noCachedData : translations.fetchFailed
      );
    } finally {
      setWeatherLoading(false);
    }
  };

  const weatherIcons = {
    0: "weather-sunny",
    1: "weather-partly-cloudy",
    2: "weather-cloudy",
    3: "weather-cloudy",
    45: "weather-fog",
    51: "weather-rainy",
    61: "weather-pouring",
    95: "weather-lightning",
  };

  const getWeatherIcon = (code: number) => weatherIcons[code] || "weather-cloudy";

  const today = new Date().toISOString().split("T")[0];

  if (landLoading || weatherLoading || isTranslating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={GlobalStyles.activityIndicator.color}
        />
      </View>
    );
  }

  return (
    <PaperProvider theme={customTheme}>
      <View style={styles.container}>
        <FlatList
          data={weatherData}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          style={{ padding: 10, paddingTop: 10, marginBottom: 15 }}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.Weathercard}>
              <View style={styles.row}>
                <Text style={styles.day}>{item.day}</Text>
                <Text style={styles.date}>{item.date}</Text>
              </View>
              <View style={styles.row}>
                <Icon
                  name={item.icon}
                  size={40}
                  color="#FFD700"
                  style={styles.icon}
                />
                {item.date === today && (
                  <View style={styles.tempContainer}>
                    <Text style={styles.highTemp}>
                      🌡️{current_weather_temperature}°C
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.info}>
                🌡️ {translations.highestTemperature}: {item.high}°C
              </Text>
              <Text style={styles.info}>
                🌡️ {translations.lowestTemperature}: {item.low}°C
              </Text>
              <Text style={styles.info}>
                🌬️ {translations.wind}: {item.wind}
              </Text>
              <Text style={styles.info}>
                💧 {translations.rain}: {item.rain}
              </Text>
              <Text style={styles.info}>
                ☀️ {translations.sunshine}: {item.sun}
              </Text>
            </View>
          )}
        />
      </View>
    </PaperProvider>
  );
};

export default WeatherScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  Weathercard: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 3,
    shadowColor: "#F9F9F9",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  day: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#003366",
  },
  date: {
    fontSize: 14,
    color: "#666",
  },
  icon: {
    marginRight: 10,
  },
  tempContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  highTemp: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#E65100",
    marginRight: 5,
  },
  lowTemp: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0277BD",
  },
  info: {
    fontSize: 14,
    color: "#555",
    marginTop: 5,
  },
});