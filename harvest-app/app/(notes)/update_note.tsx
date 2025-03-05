import React, { useState, useEffect } from "react";
import { View, ScrollView, Alert } from "react-native";
import {
  Provider as PaperProvider,
  Text,
  TextInput,
  Button,
} from "react-native-paper";
import { useRouter, useLocalSearchParams, Link } from "expo-router";
import GlobalStyles from "../../assets/styles/styles";
import customTheme from "../../assets/styles/theme";
import api from "../../services/api";

const UpdateNote: React.FC = () => {
  const [noteTitle, setNoteTitle] = useState<string>("");
  const [noteContents, setNoteContents] = useState<string[]>([""]);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const { id } = useLocalSearchParams();

  useEffect(() => {
    fetchNote();
  }, [id]);

  const fetchNote = async () => {
    try {
      const response = await api.get(`/get_note/${id}`);
      setNoteTitle(response.data.title);
      setNoteContents(JSON.parse(response.data.content));
    } catch (error) {
      console.error("Fetch error:", error);
      Alert.alert("Error", "Failed to load note details.");
    }
  };

  const addContentField = () => {
    setNoteContents([...noteContents, ""]);
  };

  const updateContent = (text: string, index: number) => {
    const updatedContents = [...noteContents];
    updatedContents[index] = text;
    setNoteContents(updatedContents);
  };

  const deleteContentField = (index: number) => {
    if (noteContents.length === 1) {
      Alert.alert("Alert", "At least one note content is required.");
      return;
    }
    setNoteContents(noteContents.filter((_, i) => i !== index));
  };

  const handleUpdateNote = async () => {
    if (!noteTitle) {
      Alert.alert("Alert", "Note title is required.");
      return;
    }

    if (noteContents.every((content) => content.trim() === "")) {
      Alert.alert("Alert", "Content field cannot be empty.");
      return;
    }

    setLoading(true);

    try {
      await api.post(`/update_note/${id}`, {
        title: noteTitle,
        content: JSON.stringify(noteContents),
      });

      Alert.alert("Success", "Note updated successfully.");
      router.replace(`/(tabs)/notes?id=${id}`);
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("Failed", "Could not update note. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PaperProvider theme={customTheme}>
      <View style={[GlobalStyles.TitleContainer]}>
        <Text variant="headlineLarge" style={[GlobalStyles.title]}>
          Update Note
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={[
          GlobalStyles.RiceLandScrollContainer,
          { paddingLeft: 20, paddingRight: 20 },
        ]}
      >
        <View style={GlobalStyles.FormContainer}>
          <Text>Note Title:</Text>
          <TextInput
            label="Enter note title"
            value={noteTitle}
            onChangeText={setNoteTitle}
            mode="outlined"
            style={GlobalStyles.input}
          />

          {noteContents.map((content, index) => (
            <View key={index} style={{ marginBottom: 10 }}>
              <Text>Note Content {index + 1}:</Text>
              <TextInput
                label="Enter note content"
                value={content}
                onChangeText={(text) => updateContent(text, index)}
                mode="outlined"
                multiline
                numberOfLines={4}
                style={[GlobalStyles.input, { minHeight: 100 }]}
              />
              <Button
                mode="text"
                onPress={() => deleteContentField(index)}
                disabled={noteContents.length === 1}
                style={{ marginTop: 5, alignSelf: "flex-end" }}
              >
                Remove
              </Button>
            </View>
          ))}

          <Button mode="outlined" onPress={addContentField} style={GlobalStyles.button}>
            + Add More Content
          </Button>

          <Button
            icon="content-save"
            mode="contained"
            style={GlobalStyles.button}
            loading={loading}
            disabled={loading}
            onPress={handleUpdateNote}
          >
            Update Note
          </Button>
        </View>

        <Button icon="arrow-left" mode="contained" style={GlobalStyles.button}>
          <Link href={`/(tabs)/notes?id=${id}`}>Back</Link>
        </Button>
      </ScrollView>
    </PaperProvider>
  );
};

export default UpdateNote;