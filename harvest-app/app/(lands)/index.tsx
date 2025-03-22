import React, { useState, useEffect } from "react";
import { View, ImageBackground, ScrollView, Alert, ActivityIndicator } from "react-native";
import {
  Text,
  Button,
  Menu,
  Divider,
  IconButton,
  PaperProvider,
  Card,
} from "react-native-paper";
import GlobalStyles from "../../assets/styles/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";
import customTheme from "../../assets/styles/theme";
import { Link, useRouter } from "expo-router";
import getUserIdOrLogout from "@/hooks/getUserIdOrLogout";
import * as Notifications from "expo-notifications";
import { registerBackgroundTask } from "../../services/notification";
import NetInfo from "@react-native-community/netinfo";
import translateText from "../../hooks/translateText"; // Import translation hook

// Set up the notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Index: React.FC = () => {
  const [riceLands, setRiceLands] = useState<Array<any>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [visible, setVisible] = useState(false);
  const [selectedLandId, setSelectedLandId] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(true);
  const [targetLang, setTargetLang] = useState<string>("en");
  const [translations, setTranslations] = useState({
    riceLands: "Rice Lands",
    addRiceLand: "Add Rice Land",
    view: "View",
    update: "Update",
    delete: "Delete",
    confirmDeletion: "Confirm Deletion",
    confirmDeleteRiceLand: "Are you sure you want to delete this rice land?",
    cancel: "Cancel",
    riceLandDeleted: "Rice land deleted successfully!",
    noRiceLandsAvailable: "No rice lands available.",
    offlineMode: "Offline Mode",
    displayingCachedData: "Displaying cached data.",
    noCachedDataFound: "No cached data found.",
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
        riceLands: "Rice Lands",
        addRiceLand: "Add Rice Land",
        view: "View",
        update: "Update",
        delete: "Delete",
        confirmDeletion: "Confirm Deletion",
        confirmDeleteRiceLand: "Are you sure you want to delete this rice land?",
        cancel: "Cancel",
        riceLandDeleted: "Rice land deleted successfully!",
        noRiceLandsAvailable: "No rice lands available.",
        offlineMode: "Offline Mode",
        displayingCachedData: "Displaying cached data.",
        noCachedDataFound: "No cached data found.",
      };

      const translated = {} as any;
      for (const key in keys) {
        translated[key] = await translateText(keys[key], targetLang);
      }

      setTranslations(translated);
      await new Promise((resolve) => setTimeout(resolve, 1000)); 
      setIsTranslating(false); 
    };

    translateAll();
  }, [targetLang]);

  // Check network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Fetch rice lands data
  const fetchRiceLands = async () => {
    try {
      const user_id = await getUserIdOrLogout(router);
      if (!user_id) return;

      if (isOffline) {
        const cachedRiceLands = await AsyncStorage.getItem("cachedRiceLands");
        if (cachedRiceLands) {
          setRiceLands(JSON.parse(cachedRiceLands));
          Alert.alert(translations.offlineMode, translations.displayingCachedData);
        } else {
          Alert.alert(translations.offlineMode, translations.noCachedDataFound);
        }
      } else {
        const response = await api.post("/rice_lands", { user_id });
        if (response.status === 200) {
          setRiceLands(response.data.lands);
          await AsyncStorage.setItem("cachedRiceLands", JSON.stringify(response.data.lands));
        }
      }
    } catch (error) {
      console.error("Network error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Delete rice land
  const deleteRiceLand = async (id: string) => {
    try {
      const user_id = await getUserIdOrLogout(router);
      if (!user_id) return;

      Alert.alert(
        translations.confirmDeletion,
        translations.confirmDeleteRiceLand,
        [
          { text: translations.cancel, style: "cancel" },
          {
            text: translations.delete,
            style: "destructive",
            onPress: async () => {
              setLoading(true);
              const response = await api.delete("/delete_rice_land/", {
                data: { id, user_id },
              });
              if (response.status === 200) {
                Alert.alert(translations.riceLandDeleted);
                fetchRiceLands();
              }
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error("Error deleting rice land:", error);
    } finally {
      setLoading(false);
    }
  };

  // Register background task
  useEffect(() => {
    registerBackgroundTask();
  }, []);

  // Fetch rice lands on component mount
  useEffect(() => {
    fetchRiceLands();
  }, [isOffline]);

  if (loading || isTranslating) {
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
          {translations.riceLands}
        </Text>
      </View>
      <Card style={GlobalStyles.RiceLandCard}>
        <Card.Content>
          <Button mode="contained" style={{ marginBottom: 20 }}>
            <Link href="/(lands)/add_land">{translations.addRiceLand}</Link>
          </Button>
          <ScrollView showsVerticalScrollIndicator={false} style={{ height: 520 }}>
            {riceLands.length > 0 ? (
              riceLands.map((land) => (
                <View key={land.id} style={{ marginBottom: 10 }}>
                  <ImageBackground
                    source={require("../../assets/images/rice-field.jpg")}
                    style={GlobalStyles.RiceLandItem}
                  >
                    <View style={GlobalStyles.overlay} />
                    <View style={GlobalStyles.moreOptionsButtonContainer}>
                      <Menu
                        visible={visible && selectedLandId === land.id}
                        onDismiss={() => setVisible(false)}
                        anchor={
                          <IconButton
                            icon="dots-vertical"
                            onPress={() => {
                              setSelectedLandId(land.id);
                              setVisible(true);
                            }}
                            iconColor="#fff"
                          />
                        }
                      >
                        <Menu.Item onPress={() => router.push(`/(tabs)/?id=${land.id}`)} title={translations.view} />
                        <Menu.Item onPress={() => router.push(`/(lands)/update_land?id=${land.id}`)} title={translations.update} />
                        <Divider />
                        <Menu.Item onPress={() => deleteRiceLand(land.id)} title={translations.delete} />
                      </Menu>
                    </View>
                    <Text style={GlobalStyles.RiceLandTitle}>{land.rice_land_name}</Text>
                  </ImageBackground>
                </View>
              ))
            ) : (
              <Text>{translations.noRiceLandsAvailable}</Text>
            )}
          </ScrollView>
        </Card.Content>
      </Card>
    </PaperProvider>
  );
};

export default Index;