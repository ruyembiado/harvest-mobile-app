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

const UpdateLand: React.FC = () => {
  const [rice_land_name, setRiceLandName] = React.useState<string>("");
  const [rice_land_lat, setRiceLandLat] = React.useState<string>("");
  const [rice_land_long, setRiceLandLong] = React.useState<string>("");
  const [rice_land_size, setRiceLandSize] = React.useState<string>("");
  const [rice_land_size_sqm, setRiceLandSizeSQM] = React.useState<string>("");
  const [rice_land_condition, setRiceLandCondition] = React.useState<string>("");
  const [rice_land_current_stage, setRiceLandStage] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [locationLoading, setLocationLoading] = React.useState<boolean>(false);
  const router = useRouter();
  const { id } = useLocalSearchParams();

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
        Alert.alert("Error", "Unable to fetch land details.");
      }
    };

    fetchLandDetails();
  }, [id]);

  const handleUpdateLand = async () => {
    if (!rice_land_name) {
      alert("Rice land name is required.");
      return;
    }
    if (!rice_land_lat || !rice_land_long) {
      alert("Location coordinates are required.");
      return;
    }
    if (!rice_land_size && !rice_land_size_sqm) {
      alert("Size of the land is required.");
      return;
    }
    if (!rice_land_condition) {
      alert("Land condition is required.");
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

      Alert.alert("Success", "Rice land updated successfully.");
      router.replace("/(lands)"); // Navigate back to the list of lands
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("Update failed", "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
          Update Rice Land
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={[GlobalStyles.RiceLandScrollContainer, { paddingLeft: 20, paddingRight: 20 }]}
      >
        <View style={[GlobalStyles.FormContainer]}>
          <View>
            <Text>Rice Land Name:</Text>
            <TextInput
              label="Enter rice land name"
              value={rice_land_name}
              onChangeText={setRiceLandName}
              mode="outlined"
              style={GlobalStyles.input}
            />
          </View>

          <View>
            <Text>Location:</Text>
            <TextInput
              disabled
              label="Enter location (Latitude)"
              value={rice_land_lat}
              onChangeText={setRiceLandLat}
              mode="outlined"
              style={GlobalStyles.input}
              keyboardType="numeric"
            />

            <TextInput
              disabled
              label="Enter location (Longitude)"
              value={rice_land_long}
              onChangeText={setRiceLandLong}
              mode="outlined"
              style={GlobalStyles.input}
              keyboardType="numeric"
            />

            {/* <Button
              style={[GlobalStyles.button, { marginBottom: 10 }]}
              mode="outlined"
              onPress={fetchLocation}
              loading={locationLoading}
              disabled={locationLoading}
              icon={locationLoading ? undefined : "crosshairs-gps"}
            >
              {locationLoading ? "Fetching Location..." : "Get Current Location"}
            </Button> */}
          </View>

          <View>
            <Text>Size of the Land in hectares (optional):</Text>
            <TextInput
              label="Enter size of the land (hectares)"
              value={rice_land_size}
              onChangeText={setRiceLandSize}
              mode="outlined"
              style={GlobalStyles.input}
              keyboardType="numeric"
            />
          </View>

          <View>
             <Text>Size of the Land in square meter(sqm) (optional):</Text>
            <TextInput
              label="Enter size of the land (sqm)"
              value={rice_land_size_sqm}  
              onChangeText={setRiceLandSizeSQM}
              mode="outlined"
              style={GlobalStyles.input}
              keyboardType="numeric"
            />
          </View>

          <View>
            <Text>Select Land Condition:</Text>
            <Picker
              selectedValue={rice_land_condition}
              onValueChange={(itemValue) => setRiceLandCondition(itemValue)}
              style={{ height: 50, width: 250 }}
            >
              {riceLandConditions.map((condition) => (
                <Picker.Item label={condition.label} value={condition.value} key={condition.value} />
              ))}
            </Picker>
          </View>

          <View>
            <Text>Current Stage of Rice Growth:</Text>
            <TextInput
              label="Current Stage"
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
            Update Land
          </Button>
        </View>
      </ScrollView>
    </PaperProvider>
  );
};

export default UpdateLand;