import { View, ScrollView, Modal, TouchableOpacity, Alert } from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import api from "@/services/api";
import { useRiceLand } from "../../context/RiceLandContext";
import { Calendar } from "react-native-calendars";
import { Text, ActivityIndicator, PaperProvider, Button, TextInput } from "react-native-paper";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import GlobalStyles from "@/assets/styles/styles";
import customTheme from "@/assets/styles/theme";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import translateText from "../../hooks/translateText";
import { useFocusEffect } from "expo-router";

const CalendarScreen: React.FC = () => {
  const { riceLandId, setRiceLandId } = useRiceLand();
  const [growthStages, setGrowthStages] = useState<Array<any>>([]);
  const [advisories, setAdvisories] = useState<Array<any>>([]);
  const [markedDates, setMarkedDates] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [tasks, setTasks] = useState<{ [key: string]: string[] }>({});
  const [taskInputs, setTaskInputs] = useState<string[]>([""]);
  const [isTaskModalVisible, setTaskModalVisible] = useState<boolean>(false);
  const [isUpdateMode, setIsUpdateMode] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(true);
  const [targetLang, setTargetLang] = useState<string>("en");
  const [translations, setTranslations] = useState({
    loading: "Loading...",
    growthStages: "Growth Stages",
    advisories: "Advisories",
    tasks: "Tasks",
    noAdvisories: "No advisories for this date.",
    selectDateAdvisories: "Select a date to view advisories.",
    noTasks: "No tasks for this date.",
    selectDateTasks: "Select a date to view tasks.",
    addTask: "Add Another Task",
    updateTasks: "Update Tasks",
    saveTasks: "Save Tasks",
    addTaskTitle: "Add Tasks for",
    updateTaskTitle: "Update Tasks for",
    close: "Close",
    taskPlaceholder: "Task",
    taskAdded: "Tasks added successfully.",
    taskUpdated: "Tasks updated successfully.",
    taskError: "Please add at least one task.",
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
        growthStages: "Growth Stages",
        advisories: "Advisories",
        tasks: "Tasks",
        noAdvisories: "No advisories for this date.",
        selectDateAdvisories: "Select a date to view advisories.",
        noTasks: "No tasks for this date.",
        selectDateTasks: "Select a date to view tasks.",
        addTask: "Add Another Task",
        updateTasks: "Update Tasks",
        saveTasks: "Save Tasks",
        addTaskTitle: "Add Tasks for",
        updateTaskTitle: "Update Tasks for",
        close: "Close",
        taskPlaceholder: "Task",
        taskAdded: "Tasks added successfully.",
        taskUpdated: "Tasks updated successfully.",
        taskError: "Please add at least one task.",
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

  // Translate growth stages
  const translateGrowthStages = async (stages: any[]) => {
    const translatedStages = await Promise.all(
      stages.map(async (stage) => {
        const translatedStage = await translateText(
          stage.rice_growth_stage,
          targetLang
        );
        return {
          ...stage,
          rice_growth_stage: translatedStage, // Translated name for display
          original_stage: stage.rice_growth_stage, // Original name for color mapping
        };
      })
    );
    setGrowthStages(translatedStages);
  };

  // Translate advisories
  const translateAdvisories = async (advisories: any[]) => {
    const translatedAdvisories = await Promise.all(
      advisories.map(async (advisory) => {
        const advisoryMessages = JSON.parse(advisory.advisories);
        const translatedMessages = await Promise.all(
          advisoryMessages.map(async (message: string) => {
            return await translateText(message, targetLang);
          })
        );
        return { ...advisory, advisories: JSON.stringify(translatedMessages) };
      })
    );
    setAdvisories(translatedAdvisories);
  };

  // Translate tasks
  const translateTasks = async (tasks: { [key: string]: string[] }) => {
    const translatedTasks = {} as { [key: string]: string[] };
    for (const date in tasks) {
      const translatedTaskList = await Promise.all(
        tasks[date].map(async (task) => {
          return await translateText(task, targetLang);
        })
      );
      translatedTasks[date] = translatedTaskList;
    }
    setTasks(translatedTasks);
  };

  // Check network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Fetch growth stages, advisories, and tasks when riceLandId is available
  useEffect(() => {
    if (riceLandId) {
      fetchGrowthStages();
      fetchAdvisories();
      fetchTasks();
    }
  }, [riceLandId, isOffline, targetLang]); // Re-fetch when targetLang changes

  // Fetch Growth Stages
  const fetchGrowthStages = async () => {
    try {
      if (isOffline) {
        const cachedGrowthStages = await AsyncStorage.getItem(
          `cachedGrowthStages_${riceLandId}`
        );
        const cachedStagesToCalendar = await AsyncStorage.getItem(
          `cachedStagesToCalendar_${riceLandId}`
        );
        if (cachedGrowthStages) {
          const dataStages = JSON.parse(cachedGrowthStages);
          await translateGrowthStages(dataStages);
        }
        if (cachedStagesToCalendar) {
          const dataMarkedDates = JSON.parse(cachedStagesToCalendar);
          mapStagesToCalendar(dataMarkedDates);
        }
      } else {
        setLoading(true);
        const response = await api.get(`/get_rice_growth_stages/${riceLandId}`);

        if (response.data.status === "success") {
          await translateGrowthStages(response.data.data);
          mapStagesToCalendar(response.data.data);

          // Cache growth stages data
          await AsyncStorage.setItem(
            `cachedGrowthStages_${riceLandId}`,
            JSON.stringify(response.data.data)
          );

          // Cache marked dates
          await AsyncStorage.setItem(
            `cachedStagesToCalendar_${riceLandId}`,
            JSON.stringify(response.data.data)
          );
        } else {
          console.error("Error fetching growth stages:", response.data.message);
        }
      }
    } catch (error) {
      console.error("Network error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Advisories
  const fetchAdvisories = async () => {
    try {
      if (isOffline) {
        const cachedAdvisories = await AsyncStorage.getItem(
          `cachedAdvisories_${riceLandId}`
        );
        if (cachedAdvisories) {
          const data = JSON.parse(cachedAdvisories);
          await translateAdvisories(data);
        }
      } else {
        const response = await api.get(`/get_all_advisories/${riceLandId}`);
        if (response) {
          await translateAdvisories(response.data);
          await AsyncStorage.setItem(
            `cachedAdvisories_${riceLandId}`,
            JSON.stringify(response.data)
          );
        } else {
          console.error("Error fetching advisories:", response.data.message);
        }
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };

  // Fetch Tasks for the selected date
  const fetchTasks = async () => {
    if (!selectedDate) return;

    try {
      if (isOffline) {
        const cachedTasks = await AsyncStorage.getItem(
          `cachedTasks_${riceLandId}`
        );
        if (cachedTasks) {
          const data = JSON.parse(cachedTasks);
          await translateTasks(data);
        }
      } else {
        const response = await api.get(`/get_task`, {
          params: {
            date: selectedDate,
            rice_land_id: riceLandId,
          },
        });

        if (response.data) {
          const tasksData = {
            ...tasks,
            [selectedDate]: response.data.map((task: any) => task.task),
          };
          await translateTasks(tasksData);

          await AsyncStorage.setItem(
            `cachedTasks_${riceLandId}`,
            JSON.stringify(tasksData)
          );
        }
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  // Map growth stages to the calendar
  const mapStagesToCalendar = (stages: any[]) => {
    const marked: { [key: string]: any } = {};

    stages.forEach((stage) => {
      const startDate = new Date(stage.rice_growth_stage_start);
      const endDate = new Date(stage.rice_growth_stage_end);
      const stageColor = getStageColor(stage.rice_growth_stage);

      while (startDate <= endDate) {
        const formattedDate = startDate.toISOString().split("T")[0];
        marked[formattedDate] = {
          selected: true,
          marked: true,
          selectedColor: stageColor,
        };
        startDate.setDate(startDate.getDate() + 1);
      }
    });
    setMarkedDates(marked);
  };

  // Get color based on rice growth stage
  const getStageColor = (stage: string) => {
    const stageColors: { [key: string]: string } = {
      Germination: "#4CAF50",
      "Seeding Establishment": "#FFC107",
      Tillering: "#03A9F4",
      "Panicle Initiation": "#9C27B0",
      Booting: "#FF9800",
      Heading: "#F44336",
      Flowering: "#E91E63",
      "Grain Filling": "#795548",
      Maturity: "#607D8B",
    };
    return stageColors[stage] || "#000000"; // Default: Black
  };

  // Handle day press
  const handleDayPress = (day: any) => {
    setSelectedDate(day.dateString);
    fetchTasks();
  };

  // Add task input field
  const addTaskInput = () => {
    setTaskInputs([...taskInputs, ""]);
  };

  // Handle task input change
  const handleTaskInputChange = (text: string, index: number) => {
    const newTaskInputs = [...taskInputs];
    newTaskInputs[index] = text;
    setTaskInputs(newTaskInputs);
  };

  // Remove a task input field
  const removeTaskInput = (index: number) => {
    const newTaskInputs = taskInputs.filter((_, i) => i !== index);
    setTaskInputs(newTaskInputs);
  };

  // Save all tasks
  const saveTasks = async () => {
    if (selectedDate) {
      if (taskInputs.every((task) => task.trim() === "")) {
        Alert.alert(translations.taskError);
        return;
      }

      try {
        await api.post("/add_tasks", {
          tasks: taskInputs.filter((task) => task.trim()),
          date: selectedDate,
          rice_land_id: riceLandId,
        });

        await fetchTasks();
        setTaskInputs([""]);
        setTaskModalVisible(false);
        Alert.alert(translations.taskAdded);
      } catch (error) {
        console.error("Error saving tasks:", error);
      }
    }
  };

  // Update tasks
  const updateTasks = async () => {
    if (selectedDate) {
      if (taskInputs.every((task) => task.trim() === "")) {
        Alert.alert(translations.taskError);
        return;
      }

      try {
        await api.post("/update_tasks", {
          tasks: taskInputs.filter((task) => task.trim()),
          date: selectedDate,
          rice_land_id: riceLandId,
        });

        await fetchTasks();
        setTaskInputs([""]);
        setTaskModalVisible(false);
        setIsUpdateMode(false);
        Alert.alert(translations.taskUpdated);
      } catch (error) {
        console.error("Error updating tasks:", error);
      }
    }
  };

  // Display Loading Indicator
  if (loading || isTranslating) {
    return (
      <View style={GlobalStyles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <PaperProvider theme={customTheme}>
      <View
        style={[
          GlobalStyles.container,
          { alignItems: "center", width: "100%", padding: 0, paddingTop: 10 },
        ]}
      >
        <ScrollView
          contentContainerStyle={GlobalStyles.RiceLandScrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Calendar */}
          <Calendar
            style={{
              borderWidth: 1,
              borderRadius: 5,
              borderColor: "#E0E0E0",
              width: 340,
              alignSelf: "center",
            }}
            theme={{
              arrowColor: "#4CAF50",
              backgroundColor: "#ffffff",
              calendarBackground: "#ffffff",
              textSectionTitleColor: "#000",
              selectedDayBackgroundColor: "#00adf5",
              selectedDayTextColor: "#ffffff",
              todayTextColor: "#4CAF50",
              dayTextColor: "#000",
              textDisabledColor: "#CBCBCB",
            }}
            markedDates={{
              ...markedDates,
              ...(selectedDate
                ? {
                    [selectedDate]: {
                      selected: true,
                      selectedColor: "#000",
                    },
                  }
                : {}),
            }}
            markingType={"multi-dot"}
            onDayPress={handleDayPress}
          />

          {/* Growth Stages */}
          <View
            style={[
              GlobalStyles.Weathercard,
              {
                width: 340,
                marginHorizontal: 10,
                alignContent: "center",
                marginBottom: 0,
              },
            ]}
          >
            <Text style={[GlobalStyles.label, { marginTop: 5 }]}>
              {translations.growthStages}
            </Text>
            {growthStages.map((stage) => (
              <View key={stage.id} style={GlobalStyles.stageContainer}>
                <View
                  style={[
                    GlobalStyles.circle,
                    { backgroundColor: getStageColor(stage.original_stage) },
                  ]}
                />
                <Text style={GlobalStyles.dataText}>
                  {stage.rice_growth_stage}{" "}
                </Text>
              </View>
            ))}
          </View>

          {/* Advisories */}
          <View
            style={[
              GlobalStyles.Weathercard,
              {
                width: 340,
                marginHorizontal: 10,
                alignContent: "center",
                marginBottom: 0,
              },
            ]}
          >
            <Text style={[GlobalStyles.label, { marginTop: 5 }]}>
              {translations.advisories}
            </Text>
            {selectedDate ? (
              advisories.some((advisory) => advisory.date === selectedDate) ? (
                advisories
                  .filter((advisory) => advisory.date === selectedDate)
                  .map((advisory, index) => {
                    const advisoryMessages = JSON.parse(advisory.advisories);
                    return (
                      <View key={index}>
                        {advisoryMessages.map(
                          (message: string, msgIndex: number) => (
                            <Text key={msgIndex} style={GlobalStyles.dataText}>
                              • {message}
                            </Text>
                          )
                        )}
                      </View>
                    );
                  })
              ) : (
                <Text style={GlobalStyles.dataText}>
                  {translations.noAdvisories}
                </Text>
              )
            ) : (
              <Text style={GlobalStyles.dataText}>
                {translations.selectDateAdvisories}
              </Text>
            )}
          </View>

          {/* Tasks */}
          <View
            style={[
              GlobalStyles.Weathercard,
              {
                width: 340,
                marginHorizontal: 10,
                alignContent: "center",
                marginBottom: 10,
              },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[GlobalStyles.label, { marginTop: 5 }]}>
                {translations.tasks}
              </Text>
              {selectedDate ? (
                <View
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    flexDirection: "row",
                  }}
                >
                  {(!tasks[selectedDate] ||
                    tasks[selectedDate].length === 0) && (
                    <TouchableOpacity
                      onPress={() => {
                        setTaskModalVisible(true);
                        setIsUpdateMode(false);
                        setTaskInputs([""]);
                      }}
                    >
                      <FontAwesome name="plus" size={20} color="#4CAF50" />
                    </TouchableOpacity>
                  )}
                  {tasks[selectedDate]?.length > 0 && (
                    <TouchableOpacity
                      style={{ marginLeft: 10 }}
                      onPress={() => {
                        setTaskModalVisible(true);
                        setIsUpdateMode(true);
                        setTaskInputs(tasks[selectedDate]);
                      }}
                    >
                      <FontAwesome name="edit" size={20} color="#4CAF50" />
                    </TouchableOpacity>
                  )}
                </View>
              ) : null}
            </View>
            {selectedDate ? (
              tasks[selectedDate]?.length > 0 ? (
                tasks[selectedDate].map((task, index) => (
                  <Text key={index} style={GlobalStyles.dataText}>
                    • {task}
                  </Text>
                ))
              ) : (
                <Text style={GlobalStyles.dataText}>
                  {translations.noTasks}
                </Text>
              )
            ) : (
              <Text style={GlobalStyles.dataText}>
                {translations.selectDateTasks}
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Task Modal */}
        <Modal
          visible={isTaskModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setTaskModalVisible(false);
            setIsUpdateMode(false);
          }}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            }}
          >
            <View
              style={[
                GlobalStyles.Weathercard,
                { width: 340, maxHeight: "90%", padding: 20 },
              ]}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={GlobalStyles.label}>
                  {isUpdateMode
                    ? `${translations.updateTaskTitle} ${selectedDate}`
                    : `${translations.addTaskTitle} ${selectedDate}`}
                </Text>
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    flexDirection: "row",
                  }}
                >
                  <TouchableOpacity
                    style={{ marginBottom: 15 }}
                    onPress={() => {
                      setTaskModalVisible(false);
                      setIsUpdateMode(false);
                    }}
                  >
                    <FontAwesome name="close" size={20} color="#D32F2F" />
                  </TouchableOpacity>
                </View>
                {taskInputs.map((input, index) => (
                  <View
                    key={index}
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    <TextInput
                      style={[GlobalStyles.input, { flex: 1 }]}
                      mode="outlined"
                      label={`${translations.taskPlaceholder} ${index + 1}`}
                      value={input}
                      onChangeText={(text) =>
                        handleTaskInputChange(text, index)
                      }
                    />
                    {taskInputs.length > 1 && (
                      <TouchableOpacity
                        style={{ marginLeft: 5, marginBottom: 10 }}
                        onPress={() => removeTaskInput(index)}
                      >
                        <FontAwesome name="trash" size={20} color="#D32F2F" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                <Button
                  icon="plus"
                  mode="contained"
                  style={GlobalStyles.button}
                  onPress={addTaskInput}
                >
                  {translations.addTask}
                </Button>
                {isUpdateMode ? (
                  <Button
                    icon="check"
                    mode="contained"
                    style={GlobalStyles.button}
                    onPress={updateTasks}
                  >
                    {translations.updateTasks}
                  </Button>
                ) : (
                  <Button
                    icon="check"
                    mode="contained"
                    style={GlobalStyles.button}
                    onPress={saveTasks}
                  >
                    {translations.saveTasks}
                  </Button>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </PaperProvider>
  );
};

export default CalendarScreen;