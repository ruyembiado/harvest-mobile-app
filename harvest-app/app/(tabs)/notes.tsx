import React, { useState, useCallback, useEffect } from "react";
import { View, ScrollView, Alert, Text, TouchableOpacity } from "react-native";
import { Button, PaperProvider, ActivityIndicator } from "react-native-paper";
import { FontAwesome } from "@expo/vector-icons";
import GlobalStyles from "@/assets/styles/styles";
import customTheme from "@/assets/styles/theme";
import { useRiceLand } from "../../context/RiceLandContext";
import api from "@/services/api";
import { Link, useLocalSearchParams, useFocusEffect } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import translateText from "../../hooks/translateText";

const NotesScreen: React.FC = () => {
  const { riceLandId, setRiceLandId } = useRiceLand();
  const [loading, setLoading] = useState<boolean>(false);
  const [notes, setNotes] = useState<Array<any>>([]);
  const { id } = useLocalSearchParams();
  const ID = riceLandId || id;
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(true);
  const [targetLang, setTargetLang] = useState<string>("en"); // Default language
  const [translations, setTranslations] = useState({
    loading: "Loading...",
    addNotes: "Add Notes",
    noNotesAvailable: "No notes available.",
    noContentAvailable: "No content available.",
    confirmDelete: "Confirm",
    deleteMessage: "Are you sure you want to delete this note?",
    cancel: "Cancel",
    delete: "Delete",
    success: "Success",
    noteDeleted: "Note deleted successfully.",
    error: "Error",
    deleteFailed: "Failed to delete note.",
  });

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
        loading: "Loading...",
        addNotes: "Add Notes",
        noNotesAvailable: "No notes available.",
        noContentAvailable: "No content available.",
        confirmDelete: "Confirm",
        deleteMessage: "Are you sure you want to delete this note?",
        cancel: "Cancel",
        delete: "Delete",
        success: "Success",
        noteDeleted: "Note deleted successfully.",
        error: "Error",
        deleteFailed: "Failed to delete note.",
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

  // Check network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Fetch notes and translate them
  const fetchNotes = async () => {
    setLoading(true);
    try {
      if (isOffline) {
        const cachedNotesData = await AsyncStorage.getItem(`cachedNotesData_${ID}`);
        if (cachedNotesData) {
          setNotes(JSON.parse(cachedNotesData)); // Use cached data
        }
      } else {
        const response = await api.get(`/get_notes/${ID}/`);
        const translatedNotes = await Promise.all(
          response.data.map(async (note) => {
            const translatedTitle = await translateText(note.title, targetLang);
            const contentArray = typeof note.content === "string"
              ? JSON.parse(note.content)
              : note.content || [];
            const translatedContent = await Promise.all(
              contentArray.map(async (item) => {
                return await translateText(item, targetLang);
              })
            );
            return {
              ...note,
              title: translatedTitle,
              content: JSON.stringify(translatedContent),
            };
          })
        );
        setNotes(translatedNotes); // Update state with translated notes
        await AsyncStorage.setItem(`cachedNotesData_${ID}`, JSON.stringify(translatedNotes)); // Cache translated notes
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
      Alert.alert(translations.error, translations.deleteFailed);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch notes when the screen comes into focus or when targetLang changes
  useFocusEffect(
    useCallback(() => {
      fetchNotes();
    }, [id, riceLandId, isOffline, targetLang]) 
  );

  const deleteNote = async (noteId: number) => {
    Alert.alert(translations.confirmDelete, translations.deleteMessage, [
      {
        text: translations.cancel,
        style: "cancel",
      },
      {
        text: translations.delete,
        onPress: async () => {
          try {
            setLoading(true);
            await api.delete(`/delete_note/${noteId}/`);
            Alert.alert(translations.success, translations.noteDeleted);
            fetchNotes(); // Refresh notes after deletion
          } catch (error) {
            console.error("Error deleting note:", error);
            Alert.alert(translations.error, translations.deleteFailed);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

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
      <View style={[GlobalStyles.container, { alignItems: "center", paddingTop: 10 }]}>
        <Button
          mode="contained"
          style={{
            marginTop: 5,
            marginBottom: 15,
            width: "100%",
            alignSelf: "flex-end",
            backgroundColor: "#4CAF50",
          }}
        >
          <Link href={`/(notes)/add_note?id=${ID}`} style={{ color: "#fff" }}>
            {translations.addNotes}
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
                <View key={note.id} style={[GlobalStyles.Weathercard, { width: 330, marginBottom: 0 }]}>
                  <Text style={GlobalStyles.label}>{note.title}</Text>
                  {contentArray.map((item, index) => (
                    <Text key={index} style={GlobalStyles.dataText}>
                      - {item}
                    </Text>
                  ))}
                  {contentArray.length === 0 && (
                    <Text style={GlobalStyles.dataText}>
                      {translations.noContentAvailable}
                    </Text>
                  )}

                  <View style={{ position: "absolute", top: 10, right: 10, flexDirection: "row" }}>
                    <TouchableOpacity onPress={() => deleteNote(note.id)} style={{ marginRight: 10 }}>
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
              <Text style={GlobalStyles.dataText}>
                {translations.noNotesAvailable}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </PaperProvider>
  );
};

export default NotesScreen;