import React, { useState, useEffect } from "react";
import { View, ImageBackground, ScrollView, Alert } from "react-native";
import {
  Text,
  Button,
  Menu,
  Divider,
  IconButton,
  ActivityIndicator,
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
import NetInfo from "@react-native-community/netinfo"; // Import NetInfo
import { useRiceLand } from "../../context/RiceLandContext";

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
  const [isOffline, setIsOffline] = useState<boolean>(false); // Track offline state
  const router = useRouter();
  const [riceLandId, setRiceLandId] = useState<number | null>(null);

  const handleSelectRiceLand = async (id: number) => {
    try {
      setRiceLandId(id); // Update the state
      await AsyncStorage.setItem("riceLandId", id.toString()); // Convert id to string and save to AsyncStorage
      console.log("Rice Land ID saved to AsyncStorage:", id);
    } catch (error) {
      console.error("Failed to save riceLandId to AsyncStorage:", error);
    }
  };

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
      if (!user_id) {
        return;
      }

      if (isOffline) {
        // Offline mode: Retrieve cached data
        const cachedRiceLands = await AsyncStorage.getItem("cachedRiceLands");
        if (cachedRiceLands) {
          setRiceLands(JSON.parse(cachedRiceLands));
          Alert.alert("Offline Mode", "Displaying cached rice lands data.");
        } else {
          Alert.alert(
            "Offline Mode",
            "No cached data found. Please go online to fetch data."
          );
        }
      } else {
        console.log("Online Mode");
        // Online mode: Fetch data from API
        const response = await api.post("/rice_lands", {
          user_id,
        });

        if (response.status === 200) {
          setRiceLands(response.data.lands);
          // Cache the fetched data
          await AsyncStorage.setItem(
            "cachedRiceLands",
            JSON.stringify(response.data.lands)
          );
        } else {
          console.error("Error fetching rice lands:", response.data.error);
        }
      }
    } catch (error) {
      // console.error("Network error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Delete rice land
  const deleteRiceLand = async (id: string) => {
    try {
      const user_id = await getUserIdOrLogout(router);
      if (!user_id) {
        return;
      }

      Alert.alert(
        "Confirm Deletion",
        "Are you sure you want to delete this rice land?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              setLoading(true);
              const response = await api.delete("/delete_rice_land/", {
                data: {
                  id,
                  user_id,
                },
              });
              if (response.status === 200) {
                alert("Rice land deleted successfully!");
                fetchRiceLands(); // Refresh the list
              } else {
                console.error("Error deleting rice land:", response.data.error);
              }
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      // console.error("Network error:", error);
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
  }, [isOffline]); // Re-fetch when offline status changes

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
          Rice Lands
        </Text>
      </View>
      <Card style={GlobalStyles.RiceLandCard}>
        <Card.Content>
          <View style={[GlobalStyles.RiceLandContainer]}>
            <View>
              {/* {!isOffline && (
                <> */}
                  <Button
                    mode="contained"
                    style={[GlobalStyles.addButton, { marginBottom: 20 }]}
                  >
                    <Link href="/(lands)/add_land">Add</Link>
                  </Button>
                {/* </>
              )} */}
              <ScrollView
                contentContainerStyle={[
                  GlobalStyles.RiceLandScrollContainer,
                  { paddingBottom: 10 },
                ]}
                showsVerticalScrollIndicator={false}
              >
                {riceLands.length > 0 ? (
                  riceLands.map((land) => (
                    <View key={land.id}>
                      <ImageBackground
                        source={require("../../assets/images/rice-field.jpg")}
                        style={GlobalStyles.RiceLandItem}
                      >
                        <View style={GlobalStyles.overlay}></View>
                        <View style={[GlobalStyles.moreOptionsButtonContainer]}>
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
                                style={[GlobalStyles.menuButton]}
                                iconColor="#fff"
                              />
                            }
                          >
                            <Menu.Item
                              onPress={async () => {
                                setVisible(false);
                                handleSelectRiceLand(land.id);
                                router.push(`/(tabs)/?id=${land.id}`);
                              }}
                              title="View"
                            />
                            {/* {!isOffline && (
                              <> */}
                            <Menu.Item
                              onPress={() => {
                                setVisible(false);
                                router.push(
                                  `/(lands)/update_land?id=${land.id}`
                                );
                              }}
                              title="Update"
                            />
                            {/* </>
                            )} */}
                            <Divider />
                            {/* {!isOffline && (
                              <> */}
                            <Menu.Item
                              onPress={() => {
                                setVisible(false);
                                deleteRiceLand(land.id);
                              }}
                              title="Delete"
                            />
                            {/* </>
                            )} */}
                          </Menu>
                        </View>
                        <Text style={GlobalStyles.RiceLandTitle}>
                          {land.rice_land_name}
                        </Text>
                      </ImageBackground>
                    </View>
                  ))
                ) : (
                  <View style={[GlobalStyles.noDataTextContainer]}>
                    <Text style={[GlobalStyles.dataText]}>
                      No rice lands available.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Card.Content>
      </Card>
    </PaperProvider>
  );
};

export default Index;
