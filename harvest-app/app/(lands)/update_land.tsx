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
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import GlobalStyles from "../../assets/styles/styles";
import customTheme from "../../assets/styles/theme";
import api from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import getUserIdOrLogout from "@/hooks/getUserIdOrLogout";
import translateText from "../../hooks/translateText"; // Import translation hook

const UpdateLand: React.FC = () => {
  const [rice_land_name, setRiceLandName] = useState<string>("");
  const [rice_land_lat, setRiceLandLat] = useState<string>("");
  const [rice_land_long, setRiceLandLong] = useState<string>("");
  const [rice_land_size, setRiceLandSize] = useState<string>("");
  const [rice_land_size_sqm, setRiceLandSizeSQM] = useState<string>("");
  const [rice_land_condition, setRiceLandCondition] = useState<string>("");
  const [rice_land_current_stage, setRiceLandStage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(true);
  const [targetLang, setTargetLang] = useState<string>("en");
  const [translations, setTranslations] = useState({
    updateRiceLand: "Update Rice Land",
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
    updateLandButton: "Update Land",
    requiredField: "This field is required.",
    locationRequired: "Location coordinates are required.",
    landSizeRequired: "Size of the land is required.",
    landConditionRequired: "Land condition is required.",
    successMessage: "Rice land updated successfully.",
    errorMessage: "Update failed. Please try again.",
  });

  const router = useRouter();
  const { id } = useLocalSearchParams();

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
        updateRiceLand: "Update Rice Land",
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
        updateLandButton: "Update Land",
        requiredField: "This field is required.",
        locationRequired: "Location coordinates are required.",
        landSizeRequired: "Size of the land is required.",
        landConditionRequired: "Land condition is required.",
        successMessage: "Rice land updated successfully.",
        errorMessage: "Update failed. Please try again.",
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

  // Fetch rice land details for editing
  useEffect(() => {
    setLoading(true);
    const fetchLandDetails = async () => {
      if (!id) return;
      try {
        const response = await api.get(`/get_rice_land/${id}`);
        const data = response.data;

        setRiceLandName(data.rice_land_name);
        setRiceLandLat(data.rice_land_lat);
        setRiceLandLong(data.rice_land_long);
        setRiceLandSize(data.rice_land_size);
        setRiceLandSizeSQM(data.rice_land_size_sqm);
        setRiceLandCondition(data.rice_land_condition);
        setRiceLandStage(data.rice_land_current_stage);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching land details:", error);
        Alert.alert(translations.errorMessage);
      }
    };

    fetchLandDetails();
  }, [id]);

  const handleUpdateLand = async () => {
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

      const response = await api.post(`/update_rice_land/`, {
        id,
        user_id,
        rice_land_name,
        rice_land_lat,
        rice_land_long,
        rice_land_size,
        rice_land_size_sqm,
        rice_land_condition,
        rice_land_current_stage,
      });

      Alert.alert(translations.successMessage);
      router.replace("/(lands)"); // Navigate back to the list of lands
    } catch (error) {
      console.error("Update error:", error);
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
          {translations.updateRiceLand}
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={[GlobalStyles.RiceLandScrollContainer, { paddingLeft: 20, paddingRight: 20 }]}
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
              disabled
              label={translations.latitude}
              value={rice_land_lat}
              onChangeText={setRiceLandLat}
              mode="outlined"
              style={GlobalStyles.input}
              keyboardType="numeric"
            />

            <TextInput
              disabled
              label={translations.longitude}
              value={rice_land_long}
              onChangeText={setRiceLandLong}
              mode="outlined"
              style={GlobalStyles.input}
              keyboardType="numeric"
            />
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

          <Button
            icon="update"
            mode="contained"
            style={GlobalStyles.button}
            loading={loading}
            disabled={loading}
            onPress={handleUpdateLand}
          >
            {translations.updateLandButton}
          </Button>
        </View>
      </ScrollView>
    </PaperProvider>
  );
};

export default UpdateLand;