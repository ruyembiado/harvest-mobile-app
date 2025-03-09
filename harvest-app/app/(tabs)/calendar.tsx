import { View, ScrollView, Modal, TouchableOpacity } from "react-native";
import React, { useState, useEffect } from "react";
import api from "@/services/api";
import { useRiceLand } from "../../context/RiceLandContext";
import { Calendar } from "react-native-calendars";
import {
  Text,
  ActivityIndicator,
  PaperProvider,
  Button,
  TextInput,
} from "react-native-paper";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import GlobalStyles from "@/assets/styles/styles";
import customTheme from "@/assets/styles/theme";
import NetInfo from "@react-native-community/netinfo"; // Import NetInfo
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage

const CalendarScreen: React.FC = () => {
  const { riceLandId, setRiceLandId } = useRiceLand();
  const [growthStages, setGrowthStages] = useState<Array<any>>([]);
  const [advisories, setAdvisories] = useState<Array<any>>([]);
  const [markedDates, setMarkedDates] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [tasks, setTasks] = useState<{ [key: string]: string[] }>({});
  const [taskInputs, setTaskInputs] = useState<string[]>([""]); // Array to hold multiple task inputs
  const [isTaskModalVisible, setTaskModalVisible] = useState<boolean>(false);
  const [isUpdateMode, setIsUpdateMode] = useState<boolean>(false); // Track update mode
  const [isOffline, setIsOffline] = useState<boolean>(false); // Track offline state

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
  }, [riceLandId, isOffline]);

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
          setGrowthStages(dataStages);
        }
        if (cachedStagesToCalendar) {
          const dataMarkedDates = JSON.parse(cachedStagesToCalendar);
          mapStagesToCalendar(dataMarkedDates);
        }
      } else {
        setLoading(true);
        const response = await api.get(`/get_rice_growth_stages/${riceLandId}`);

        if (response.data.status === "success") {
          setGrowthStages(response.data.data);
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

          // Console cachedGrowthStages
          const cachedGrowthStages = await AsyncStorage.getItem(
            `cachedGrowthStages_${riceLandId}`
          );
          console.log("cachedGrowthStages", cachedGrowthStages);

          // Console cachedStagesToCalendar
          const cachedStagesToCalendar = await AsyncStorage.getItem(
            `cachedStagesToCalendar_${riceLandId}`
          );
          console.log("cachedStagesToCalendar", cachedStagesToCalendar);
        } else {
          console.error("Error fetching growth stages:", response.data.message);
        }
      }
    } catch (error) {
      // console.error("Network error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Advisories
  const fetchAdvisories = async () => {
    try {
      if (isOffline) {
        // Offline mode: Retrieve cached data
        const cachedAdvisories = await AsyncStorage.getItem(
          `cachedAdvisories_${riceLandId}`
        );

        if (cachedAdvisories) {
          setAdvisories(JSON.parse(cachedAdvisories));
        }
      } else {
        const response = await api.get(`/get_all_advisories/${riceLandId}`);
        if (response) {
          setAdvisories(response.data);

          // Cache advisories data
          await AsyncStorage.setItem(
            `cachedAdvisories_${riceLandId}`,
            JSON.stringify(response.data)
          );
        } else {
          console.error("Error fetching advisories:", response.data.message);
        }
      }
    } catch (error) {
      // console.error("Network error:", error);
    }
  };

  // Fetch Tasks for the selected date
  const fetchTasks = async () => {
    if (!selectedDate) return;

    try {
      if (isOffline) {
        // Offline mode: Retrieve cached data
        const cachedTasks = await AsyncStorage.getItem(
          `cachedTasks_${riceLandId}`
        );

        if (cachedTasks) {
          const data = JSON.parse(cachedTasks);
          setTasks(data);
        }
      } else {
        const response = await api.get(`/get_task`, {
          params: {
            date: selectedDate,
            rice_land_id: riceLandId,
          },
        });

        if (response.data) {
          setTasks((prevTasks) => ({
            ...prevTasks,
            [selectedDate]: response.data.map((task: any) => task.task),
          }));

          // Cache tasks data
          await AsyncStorage.setItem(
            `cachedTasks_${riceLandId}`,
            JSON.stringify({
              ...tasks,
              [selectedDate]: response.data.map((task: any) => task.task),
            })
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
      "Germination": "#4CAF50", // Green
      "Seeding Establishment": "#FFC107", // Yellow
      "Tillering": "#03A9F4", // Blue
      "Panicle Initiation": "#9C27B0", // Purple
      "Booting": "#FF9800", // Orange
      "Heading": "#F44336", // Red
      "Flowering": "#E91E63", // Pink
      "Grain Filling": "#795548", // Brown
      "Maturity": "#607D8B", // Gray
    };

    return stageColors[stage] || "#000000"; // Default: Black
  };

  // Handle day press
  const handleDayPress = (day: any) => {
    setSelectedDate(day.dateString);
    fetchTasks(); // Fetch tasks for the selected date
  };

  // Add task input field
  const addTaskInput = () => {
    setTaskInputs([...taskInputs, ""]); // Add a new empty input field
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
        alert("Please add at least one task.");
        return;
      }

      try {
        // Send tasks to the backend
        await api.post("/add_tasks", {
          tasks: taskInputs.filter((task) => task.trim()), // Send only non-empty tasks
          date: selectedDate,
          rice_land_id: riceLandId,
        });

        // Refetch tasks after saving
        await fetchTasks();

        // Reset task inputs and close modal
        setTaskInputs([""]);
        setTaskModalVisible(false);

        // Show success message
        alert("Tasks added successfully.");
      } catch (error) {
        console.error("Error saving tasks:", error);
      }
    }
  };

  // Update tasks
  const updateTasks = async () => {
    if (selectedDate) {
      if (taskInputs.every((task) => task.trim() === "")) {
        alert("Please add at least one task.");
        return;
      }

      try {
        // Send updated tasks to the backend
        await api.post("/update_tasks", {
          tasks: taskInputs.filter((task) => task.trim()), // Send only non-empty tasks
          date: selectedDate,
          rice_land_id: riceLandId,
        });

        // Refetch tasks after updating
        await fetchTasks();

        // Reset task inputs and close modal
        setTaskInputs([""]);
        setTaskModalVisible(false);
        setIsUpdateMode(false); // Exit update mode

        // Show success message
        alert("Tasks updated successfully.");
      } catch (error) {
        console.error("Error updating tasks:", error);
      }
    }
  };

  // Display Loading Indicator
  if (loading) {
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
              Growth Stages
            </Text>
            {growthStages.map((stage) => (
              <View key={stage.id} style={GlobalStyles.stageContainer}>
                <View
                  style={[
                    GlobalStyles.circle,
                    { backgroundColor: getStageColor(stage.rice_growth_stage) },
                  ]}
                />
                <Text style={GlobalStyles.dataText}>
                  {stage.rice_growth_stage}
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
              Advisories
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
                  No advisories for this date.
                </Text>
              )
            ) : (
              <Text style={GlobalStyles.dataText}>
                Select a date to view advisories.
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
              <Text style={[GlobalStyles.label, { marginTop: 5 }]}>Tasks</Text>
              {selectedDate ? (
                <View
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    flexDirection: "row",
                  }}
                >
                  {
                    // Show "Add" button if there are no tasks for the selected date
                    (!tasks[selectedDate] ||
                      tasks[selectedDate].length === 0) && (
                      <TouchableOpacity
                        onPress={() => {
                          setTaskModalVisible(true);
                          setIsUpdateMode(false); // Switch to add mode
                          setTaskInputs([""]); // Reset task inputs to a single empty task
                        }}
                      >
                        <FontAwesome name="plus" size={20} color="#4CAF50" />
                      </TouchableOpacity>
                    )
                  }
                  {
                    // Show "Edit" button if there are tasks for the selected date
                    tasks[selectedDate]?.length > 0 && (
                      <TouchableOpacity
                        style={{ marginLeft: 10 }}
                        onPress={() => {
                          setTaskModalVisible(true);
                          setIsUpdateMode(true); // Switch to update mode
                          setTaskInputs(tasks[selectedDate]); // Pre-fill tasks for the selected date
                        }}
                      >
                        <FontAwesome name="edit" size={20} color="#4CAF50" />
                      </TouchableOpacity>
                    )
                  }
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
                  No tasks for this date.
                </Text>
              )
            ) : (
              <Text style={GlobalStyles.dataText}>
                Select a date to view tasks.
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
            setIsUpdateMode(false); // Reset update mode when modal is closed
          }}
        >
          {/* Centered Modal Container */}
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
            }}
          >
            {/* Modal Content with ScrollView */}
            <View
              style={[
                GlobalStyles.Weathercard,
                { width: 340, maxHeight: "90%", padding: 20 },
              ]}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={GlobalStyles.label}>
                  {isUpdateMode ? "Update Tasks for" : "Add Tasks for"}{" "}
                  {selectedDate}
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
                      setIsUpdateMode(false); // Reset update mode
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
                      label={`Task ${index + 1}`}
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
                  Add Another Task
                </Button>
                {isUpdateMode ? (
                  <Button
                    icon="check"
                    mode="contained"
                    style={GlobalStyles.button}
                    onPress={updateTasks}
                  >
                    Update Tasks
                  </Button>
                ) : (
                  <Button
                    icon="check"
                    mode="contained"
                    style={GlobalStyles.button}
                    onPress={saveTasks}
                  >
                    Save Tasks
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
