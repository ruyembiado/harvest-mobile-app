import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, Alert } from "react-native";
import {
  Provider as PaperProvider,
  Text,
  TextInput,
  Button, ActivityIndicator
} from "react-native-paper";
import { useRouter, useLocalSearchParams, Link, useFocusEffect } from "expo-router";
import GlobalStyles from "../../assets/styles/styles";
import customTheme from "../../assets/styles/theme";
import api from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import translateText from "../../hooks/translateText"; // Import translation function

const AddNote: React.FC = () => {
  const [noteTitle, setNoteTitle] = useState<string>("");
  const [noteContents, setNoteContents] = useState<string[]>([""]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(true);
  const [targetLang, setTargetLang] = useState<string>("en");
  const [translations, setTranslations] = useState({
    addNoteTitle: "Add Note",
    noteTitleLabel: "Note Title:",
    noteTitlePlaceholder: "Enter note title",
    noteContentLabel: "Note Content",
    removeButton: "Remove",
    addMoreContentButton: "+ Add More Content",
    addNoteButton: "Add Note",
    backButton: "Back",
    alertTitleRequired: "Rice land name is required.",
    alertContentRequired: "Content fields are required.",
    alertSuccess: "Note added successfully.",
    alertFailed: "Could not add note. Please try again.",
    alertMinContent: "At least one note content is required.",
  });

  const router = useRouter();
  const { id } = useLocalSearchParams();

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
        addNoteTitle: "Add Note",
        noteTitleLabel: "Note Title:",
        noteTitlePlaceholder: "Enter note title",
        noteContentLabel: "Note Content",
        removeButton: "Remove",
        addMoreContentButton: "+ Add More Content",
        addNoteButton: "Add Note",
        backButton: "Back",
        alertTitleRequired: "Rice land name is required.",
        alertContentRequired: "Content fields are required.",
        alertSuccess: "Note added successfully.",
        alertFailed: "Could not add note. Please try again.",
        alertMinContent: "At least one note content is required.",
      };

      const translated = {} as any;
      for (const key in keys) {
        translated[key] = await translateText(keys[key], targetLang);
      }

      setTranslations(translated);
      await new Promise((resolve) => setTimeout(resolve, 1500));  // 1-second delay
      setIsTranslating(false);
    };

    translateAll();
  }, [targetLang]); // Re-translate when targetLang changes

  // Add a new content field
  const addContentField = () => {
    setNoteContents([...noteContents, ""]);
  };

  // Update a specific content field
  const updateContent = (text: string, index: number) => {
    const updatedContents = [...noteContents];
    updatedContents[index] = text;
    setNoteContents(updatedContents);
  };

  // Delete a content field
  const deleteContentField = (index: number) => {
    if (noteContents.length === 1) {
      Alert.alert(translations.alertMinContent);
      return;
    }
    const updatedContents = noteContents.filter((_, i) => i !== index);
    setNoteContents(updatedContents);
  };

  const handleAddNote = async () => {
    if (!noteTitle) {
      Alert.alert(translations.alertTitleRequired);
      return;
    }

    if (noteContents.every((content) => content.trim() === "")) {
      Alert.alert(translations.alertContentRequired);
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/add_note", {
        rice_land_id: id,
        title: noteTitle,
        content: noteContents,
      });

      router.replace(`/(tabs)/notes?id=${id}`);
      Alert.alert(translations.alertSuccess);
    } catch (error) {
      console.error("Add error:", error);
      Alert.alert(translations.alertFailed);
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
          {translations.addNoteTitle}
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={[
          GlobalStyles.RiceLandScrollContainer,
          { paddingLeft: 20, paddingRight: 20 },
        ]}
      >
        <View style={[GlobalStyles.FormContainer]}>
          {/* Note Title */}
          <View>
            <Text>{translations.noteTitleLabel}</Text>
            <TextInput
              label={translations.noteTitlePlaceholder}
              value={noteTitle}
              onChangeText={setNoteTitle}
              mode="outlined"
              style={GlobalStyles.input}
            />
          </View>

          {/* Dynamic Note Content Fields (Textarea) */}
          {noteContents.map((content, index) => (
            <View key={index} style={{ marginBottom: 10 }}>
              <Text>
                {translations.noteContentLabel} {index + 1}:
              </Text>
              <TextInput
                label={translations.noteTitlePlaceholder}
                value={content}
                onChangeText={(text) => updateContent(text, index)}
                mode="outlined"
                multiline
                numberOfLines={4} // Sets textarea height
                style={[GlobalStyles.input, { minHeight: 100 }]} // Custom styling for textarea
              />
              <Button
                mode="text"
                onPress={() => deleteContentField(index)}
                disabled={noteContents.length === 1}
                style={{ marginTop: 5, alignSelf: "flex-end" }}
              >
                {translations.removeButton}
              </Button>
            </View>
          ))}

          {/* Add Content Button */}
          <Button
            mode="outlined"
            onPress={addContentField}
            style={GlobalStyles.button}
          >
            {translations.addMoreContentButton}
          </Button>

          {/* Submit Button */}
          <Button
            icon="plus"
            mode="contained"
            style={GlobalStyles.button}
            loading={loading}
            disabled={loading}
            onPress={handleAddNote}
          >
            {translations.addNoteButton}
          </Button>
        </View>
        <Button icon="arrow-left" mode="contained" style={GlobalStyles.button}>
          <Link href={`/(tabs)/notes?id=${id}`}>{translations.backButton}</Link>
        </Button>
      </ScrollView>
    </PaperProvider>
  );
};

export default AddNote;