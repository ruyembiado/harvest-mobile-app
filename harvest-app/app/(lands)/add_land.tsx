import React, { useState, useEffect } from "react";
import { View, ScrollView, Alert } from "react-native";
import {
  Provider as PaperProvider,
  Text,
  TextInput,
  Button,
  ActivityIndicator,
} from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import { Link, useRouter } from "expo-router";
import * as Location from "expo-location";
import GlobalStyles from "../../assets/styles/styles";
import customTheme from "../../assets/styles/theme";
import api from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import getUserIdOrLogout from "@/hooks/getUserIdOrLogout";
import translateText from "../../hooks/translateText"; // Import translation hook

const AddLand: React.FC = () => {
  const [rice_land_name, setRiceLandName] = useState<string>("");
  const [rice_land_lat, setRiceLandLat] = useState<string>("");
  const [rice_land_long, setRiceLandLong] = useState<string>("");
  const [rice_land_size, setRiceLandSize] = useState<string>("");
  const [rice_land_size_sqm, setRiceLandSizeSQM] = useState<string>("");
  const [rice_land_condition, setRiceLandCondition] = useState<string>("");
  const [rice_land_current_stage, setRiceLandStage] =
    useState<string>("Not Yet Started");
  const [loading, setLoading] = useState<boolean>(false);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(true);
  const [targetLang, setTargetLang] = useState<string>("en");
  const [translations, setTranslations] = useState({
    addRiceLand: "Add Rice Land",
    riceLandName: "Rice Land Name",
    location: "Location",
    latitude: "Latitude",
    longitude: "Longitude",
    fetchLocation: "Get Current Location",
    fetchingLocation: "Fetching Location...",
    landSizeHectares: "Size of the Land in hectares (optional)",
    landSizeSQM: "Size of the Land in square meter(sqm) (optional)",
    currentStage: "Current Stage of Rice Growth",
    landCondition: "Select Land Condition",
    addLandButton: "Add Land",
    requiredField: "This field is required.",
    locationRequired: "Location coordinates are required.",
    landSizeRequired: "Size of the land is required.",
    landConditionRequired: "Land condition is required.",
    successMessage: "Rice land added successfully.",
    errorMessage: "Add failed. Please try again.",
  });

  const router = useRouter();

  // Load the language from AsyncStorage
  useEffect(() => {
    const loadLanguage = async () => {
      const storedLang = await AsyncStorage.getItem("selectedLanguage") || "en";
      setTargetLang(storedLang);
    };
    loadLanguage();
  }, []);

  // Translate all text based on the selected language
  useEffect(() => {
    const translateAll = async () => {
      setIsTranslating(true);
      const keys = {
        addRiceLand: "Add Rice Land",
        riceLandName: "Rice Land Name",
        location: "Location",
        latitude: "Latitude",
        longitude: "Longitude",
        fetchLocation: "Get Current Location",
        fetchingLocation: "Fetching Location...",
        landSizeHectares: "Size of the Land in hectares (optional)",
        landSizeSQM: "Size of the Land in square meter(sqm) (optional)",
        currentStage: "Current Stage of Rice Growth",
        landCondition: "Select Land Condition",
        addLandButton: "Add Land",
        requiredField: "This field is required.",
        locationRequired: "Location coordinates are required.",
        landSizeRequired: "Size of the land is required.",
        landConditionRequired: "Land condition is required.",
        successMessage: "Rice land added successfully.",
        errorMessage: "Add failed. Please try again.",
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

  // Fetch current location
  const fetchLocation = async () => {
    setLocationLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access location was denied");
      setLocationLoading(false);
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setRiceLandLat(location.coords.latitude.toString());
    setRiceLandLong(location.coords.longitude.toString());
    setLocationLoading(false);
  };

  const handleAddRiceLand = async () => {
    if (!rice_land_name) {
      alert(translations.requiredField);
      return;
    }
    if (!rice_land_lat || !rice_land_long) {
      alert(translations.locationRequired);
      return;
    }
    if (!rice_land_size && !rice_land_size_sqm) {
      alert(translations.landSizeRequired);
      return;
    }
    if (!rice_land_condition) {
      alert(translations.landConditionRequired);
      return;
    }

    setLoading(true);

    try {
      const user_id = await getUserIdOrLogout(router);
      if (!user_id) {
        return;
      }

      const response = await api.post("/add_rice_land", {
        user_id,
        rice_land_name,
        rice_land_lat,
        rice_land_long,
        rice_land_size,
        rice_land_size_sqm,
        rice_land_condition,
        rice_land_current_stage,
      });

      router.replace("/(lands)");
      Alert.alert(translations.successMessage);
    } catch (error) {
      console.error("Add error:", error);
      Alert.alert(translations.errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const riceLandConditions = [
    { label: "-- Select Condition --", value: "" },
    { label: "Irrigated Lowland Rice", value: "Irrigated Lowland Rice" },
    { label: "Rainfed Lowland Rice", value: "Rainfed Lowland Rice" },
    { label: "Upland Rice", value: "Upland Rice" },
  ];

  const riceLandStages = [
    { label: "Not Yet Started", value: "Not Yet Started" },
  ];

  if (isTranslating) {
    return (
      <View style={GlobalStyles.loadingContainer}>
        <ActivityIndicator size="large" color={GlobalStyles.activityIndicator.color} />
      </View>
    );
  }

  return (
    <PaperProvider theme={customTheme}>
      <View style={[GlobalStyles.TitleContainer]}>
        <Text variant="headlineLarge" style={[GlobalStyles.title]}>
          {translations.addRiceLand}
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={[
          GlobalStyles.RiceLandScrollContainer,
          { paddingLeft: 20, paddingRight: 20 },
        ]}
      >
        <View style={[GlobalStyles.FormContainer]}>
          <View>
            <Text>{translations.riceLandName}:</Text>
            <TextInput
              label={translations.riceLandName}
              value={rice_land_name}
              onChangeText={setRiceLandName}
              mode="outlined"
              style={GlobalStyles.input}
            />
          </View>

          <View>
            <Text>{translations.location}:</Text>
            <TextInput
              label={translations.latitude}
              value={rice_land_lat}
              onChangeText={setRiceLandLat}
              mode="outlined"
              style={GlobalStyles.input}
              keyboardType="numeric"
            />

            <TextInput
              label={translations.longitude}
              value={rice_land_long}
              onChangeText={setRiceLandLong}
              mode="outlined"
              style={GlobalStyles.input}
              keyboardType="numeric"
            />

            <Button
              style={[GlobalStyles.button, { marginBottom: 10 }]}
              mode="outlined"
              onPress={fetchLocation}
              loading={locationLoading}
              disabled={locationLoading}
              icon={locationLoading ? undefined : "crosshairs-gps"}
            >
              {locationLoading
                ? translations.fetchingLocation
                : translations.fetchLocation}
            </Button>
          </View>

          <View>
            <Text>{translations.landSizeHectares}:</Text>
            <TextInput
              label={translations.landSizeHectares}
              value={rice_land_size}
              onChangeText={setRiceLandSize}
              mode="outlined"
              style={GlobalStyles.input}
              keyboardType="numeric"
            />
          </View>

          <View>
            <Text>{translations.landSizeSQM}:</Text>
            <TextInput
              label={translations.landSizeSQM}
              value={rice_land_size_sqm}
              onChangeText={setRiceLandSizeSQM}
              mode="outlined"
              style={GlobalStyles.input}
              keyboardType="numeric"
            />
          </View>

          <View>
            <Text>{translations.currentStage}:</Text>
            <TextInput
              label={translations.currentStage}
              value={
                riceLandStages.find(
                  (stage) => stage.value === rice_land_current_stage
                )?.label || ""
              }
              mode="outlined"
              disabled
              style={GlobalStyles.input}
            />
          </View>

          <View>
            <Text>{translations.landCondition}:</Text>
            <Picker
              selectedValue={rice_land_condition}
              onValueChange={(itemValue) => setRiceLandCondition(itemValue)}
              style={{ height: 50, width: 250 }}
            >
              {riceLandConditions.map((condition) => (
                <Picker.Item
                  label={condition.label}
                  value={condition.value}
                  key={condition.value}
                />
              ))}
            </Picker>
          </View>

          <Button
            icon="plus"
            mode="contained"
            style={GlobalStyles.button}
            loading={loading}
            disabled={loading}
            onPress={handleAddRiceLand}
          >
            {translations.addLandButton}
          </Button>
        </View>
      </ScrollView>
    </PaperProvider>
  );
};

export default AddLand;