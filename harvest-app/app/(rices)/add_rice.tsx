import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  Platform,
  TouchableOpacity,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Provider as PaperProvider,
  Text,
  Button,
  ActivityIndicator,
} from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import GlobalStyles from "../../assets/styles/styles";
import customTheme from "../../assets/styles/theme";
import api from "../../services/api";
import getUserIdOrLogout from "@/hooks/getUserIdOrLogout";
import AsyncStorage from "@react-native-async-storage/async-storage";
import translateText from "../../hooks/translateText";

const AddRice: React.FC = () => {
  const [rice_variety_name, setRiceVariety] = useState<string>("");
  const [planting_date, setPlantingDate] = useState(new Date());
  const [loading, setLoading] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(true);
  const [targetLang, setTargetLang] = useState<string>("en");
  const [translations, setTranslations] = useState({
    addRiceVariety: "Add Rice Variety",
    selectRiceVariety: "Select Rice Variety:",
    selectPlantingDate: "Select Planting Date:",
    addRiceVarietyButton: "Add Rice Variety",
    riceVarietyRequired: "Rice variety name is required.",
    plantingDateRequired: "Please select a planting date.",
    riceVarietyAdded: "Rice variety added successfully.",
    growthStageGenerated: "Growth stage schedule generated successfully!",
    failedToGenerateSchedule: "Failed to generate schedule: ",
    addFailed: "Add failed. Please try again.",
  });

  const router = useRouter();
  const { rice_land_id } = useLocalSearchParams();

  // Rice varieties for the Picker
  const riceVarities = [
    { label: "-- Select Variety --", value: "" },
    { label: "NSIC Rc 222", value: "NSIC Rc 222" },
    { label: "NSIC Rc 216", value: "NSIC Rc 216" },
    { label: "NSIC Rc 480", value: "NSIC Rc 480" },
    { label: "NSIC Rc 10", value: "NSIC Rc 10" },
  ];

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
        addRiceVariety: "Add Rice Variety",
        selectRiceVariety: "Select Rice Variety:",
        selectPlantingDate: "Select Planting Date:",
        addRiceVarietyButton: "Add Rice Variety",
        riceVarietyRequired: "Rice variety name is required.",
        plantingDateRequired: "Please select a planting date.",
        riceVarietyAdded: "Rice variety added successfully.",
        growthStageGenerated: "Growth stage schedule generated successfully!",
        failedToGenerateSchedule: "Failed to generate schedule: ",
        addFailed: "Add failed. Please try again.",
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

  // Handle date change from DateTimePicker
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false); // Hide the date picker
    if (selectedDate) {
      setPlantingDate(selectedDate);
    }
  };

  // Handle adding rice variety
  const handleAddRiceVariety = async () => {
    try {
      // Input validation
      if (!rice_variety_name) {
        Alert.alert("Error", translations.riceVarietyRequired);
        return;
      }
      if (!planting_date) {
        Alert.alert("Error", translations.plantingDateRequired);
        return;
      }

      setLoading(true);

      // Get user ID
      const user_id = await getUserIdOrLogout(router);
      if (!user_id) {
        console.log("No user ID - possibly logged out");
        return;
      }

      if (!rice_land_id) {
        console.log("No rice_land_id provided");
        Alert.alert("Error", "No rice land selected");
        return;
      }

      // Format the date to "YYYY-MM-DD"
      const formattedDate = planting_date.toISOString().split("T")[0];
      console.log("Adding rice variety with data:", {
        rice_land_id,
        rice_variety_name,
        planting_date: formattedDate,
      });

      // Step 1: Add the rice variety with planting date
      const response = await api.post("/add_rice_variety", {
        rice_land_id,
        rice_variety_name,
      });

      console.log("Add rice variety response:", response.data);

      if (response.data.status !== "success") {
        Alert.alert("Error", translations.addFailed);
        return;
      }

      Alert.alert("Success", translations.riceVarietyAdded);

      // Step 2: Generate growth stage schedule
      const scheduleResponse = await api.post(
        "/generate_stage_growth_schedule",
        {
          rice_variety_name,
          rice_land_id,
          planting_date: formattedDate,
        }
      );

      console.log("Generate schedule response:", scheduleResponse.data);

      if (scheduleResponse.data.status === "success") {
        Alert.alert("Success", translations.growthStageGenerated);
        console.log("Generated Schedule:", scheduleResponse.data.data);
      } else {
        Alert.alert(
          "Warning",
          translations.failedToGenerateSchedule + scheduleResponse.data.message
        );
      }

      // Navigate back
      router.replace({
        pathname: "/(rices)",
        params: { rice_land_id: rice_land_id.toString() },
      });
    } catch (error) {
      console.error("Add error:", error);
      Alert.alert(
        "Error",
        translations.addFailed + "\n" + (error as Error).message
      );
    } finally {
      setLoading(false);
    }
  };

  // Show loading indicator while translating
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
      <View style={[GlobalStyles.TitleContainer]}>
        <Text variant="headlineLarge" style={[GlobalStyles.title]}>
          {translations.addRiceVariety}
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
            <Text>{translations.selectRiceVariety}</Text>
            <Picker
              selectedValue={rice_variety_name}
              onValueChange={(itemValue) => setRiceVariety(itemValue)}
              style={{ height: 50, width: 250 }}
            >
              {riceVarities.map((variety) => (
                <Picker.Item
                  label={variety.label}
                  value={variety.value}
                  key={variety.value}
                />
              ))}
            </Picker>
          </View>

          <View style={{ marginVertical: 10 }}>
            <Text>{translations.selectPlantingDate}</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <Text
                style={[
                  GlobalStyles.dataText,
                  { padding: 10, borderWidth: 1, borderRadius: 5, margin: 10 },
                ]}
              >
                {planting_date.toDateString()}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={planting_date}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>

          <Button
            icon="plus"
            mode="contained"
            style={GlobalStyles.button}
            loading={loading}
            disabled={loading}
            onPress={handleAddRiceVariety}
          >
            {translations.addRiceVarietyButton}
          </Button>
        </View>
      </ScrollView>
    </PaperProvider>
  );
};

export default AddRice;
