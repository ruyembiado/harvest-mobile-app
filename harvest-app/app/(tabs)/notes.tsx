import React, { useState, useCallback, useEffect } from "react";
import { View, ScrollView, Alert, Text, TouchableOpacity } from "react-native";
import { Button, PaperProvider, ActivityIndicator } from "react-native-paper";
import { FontAwesome } from "@expo/vector-icons";
import GlobalStyles from "@/assets/styles/styles";
import customTheme from "@/assets/styles/theme";
import { useRiceLand } from "../../context/RiceLandContext";
import api from "@/services/api";
import { Link, useLocalSearchParams, useFocusEffect } from "expo-router";
import NetInfo from "@react-native-community/netinfo"; // Import NetInfo
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage

const NotesScreen: React.FC = () => {
  const { riceLandId, setRiceLandId } = useRiceLand();
  const [loading, setLoading] = useState<boolean>(false);
  const [notes, setNotes] = useState<Array<any>>([]);
  const { id } = useLocalSearchParams();
  const ID = riceLandId || id;
  const [isOffline, setIsOffline] = useState<boolean>(false); // Track offline state

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
        // console.error("Failed to load riceLandId from AsyncStorage:", error);
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

  const fetchNotes = async () => {
    setLoading(true);
    if (!ID) {
      // console.warn("No riceLandId or id found, but proceeding with fetch.");
    }
    try {
      if (isOffline) {
        // console.log("Device is offline, fetching cached notes data.");
        const cachedNotesData = await AsyncStorage.getItem(
          `cachedNotesData_${ID}`
        );
        if (cachedNotesData) {
          setNotes(JSON.parse(cachedNotesData));
        }
      } else {
        // console.log("Fetching notes for rice land id:", ID);
        const response = await api.get(`/get_notes/${ID}/`);
        console.log("API Response:", response.data);
        setNotes(response.data);

        // Store notes in AsyncStorage
        await AsyncStorage.setItem(
          `cachedNotesData_${ID}`,
          JSON.stringify(response.data)
        );

        // Console log the stored data
        const cachedData = await AsyncStorage.getItem(`cachedNotesData_${ID}`);
        console.log("Cached Notes Data:", cachedData);
      }
    } catch (error) {
      // console.error("Error fetching notes:", error);
      // Alert.alert("Error", "Failed to load notes.");
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (noteId: number) => {
    Alert.alert("Confirm", "Are you sure you want to delete this note?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        onPress: async () => {
          try {
            setLoading(true);
            await api.delete(`/delete_note/${noteId}/`);
            Alert.alert("Success", "Note deleted successfully.");
            fetchNotes(); // Refresh notes after deletion
          } catch (error) {
            // console.error("Error deleting note:", error);
            // Alert.alert("Error", "Failed to delete note.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotes();
    }, [id, riceLandId, isOffline])
  );

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
      <View
        style={[
          GlobalStyles.container,
          { alignItems: "center", paddingTop: 10 },
        ]}
      >
        <Button
          mode="contained"
          style={{
            marginTop: 5,
            marginBottom: 15,
            width: 150,
            alignSelf: "flex-end",
            backgroundColor: "#4CAF50",
          }}
        >
          <Link href={`/(notes)/add_note?id=${ID}`} style={{ color: "#fff" }}>
            Add Notes
          </Link>
        </Button>
        <ScrollView
          contentContainerStyle={GlobalStyles.RiceLandScrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {notes.length > 0 ? (
            notes.map((note) => {
              const contentArray = (() => {
                try {
                  return typeof note.content === "string"
                    ? JSON.parse(note.content)
                    : note.content || [];
                } catch {
                  return [];
                }
              })();

              return (
                <View
                  key={note.id}
                  style={[
                    GlobalStyles.Weathercard,
                    { width: 330, marginBottom: 0 },
                  ]}
                >
                  <Text style={GlobalStyles.label}>{note.title}</Text>
                  {contentArray.map((item, index) => (
                    <Text key={index} style={GlobalStyles.dataText}>
                      - {item}
                    </Text>
                  ))}
                  {contentArray.length === 0 && (
                    <Text style={GlobalStyles.dataText}>
                      No content available.
                    </Text>
                  )}

                  <View
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      flexDirection: "row",
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => deleteNote(note.id)}
                      style={{ marginRight: 10 }}
                    >
                      <FontAwesome name="trash" size={20} color="#D32F2F" />
                    </TouchableOpacity>

                    <Link href={`/(notes)/update_note?id=${note.id}`}>
                      <FontAwesome name="pencil" size={20} color="#4CAF50" />
                    </Link>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={GlobalStyles.noDataTextContainer}>
              <Text style={GlobalStyles.dataText}>No notes available.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </PaperProvider>
  );
};

export default NotesScreen;
