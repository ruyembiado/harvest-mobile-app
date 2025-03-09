import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import api from "../services/api";
import { useEffect } from "react";
import { BackgroundFetchResult, BackgroundFetchStatus } from "expo-background-fetch";

const BACKGROUND_TASK = "fetch-user-tasks";
const INTERVAL = 15 * 60 * 1000; // 15 minutes

// Define Background Task
TaskManager.defineTask(BACKGROUND_TASK, async () => {
  try {
    console.log("[TASK] Background task started...");

    const user_id = await AsyncStorage.getItem("user_id");
    console.log("[TASK] User ID:", user_id);
    if (!user_id) {
      console.log("[TASK] No user_id found, exiting task.");
      return BackgroundFetchResult.NoData;
    }

    // Store the last execution time
    const lastExecution = Date.now();
    await AsyncStorage.setItem("last_execution", lastExecution.toString());

    // Fetch rice_land_id list
    const riceLandsResponse = await api.post("/rice_lands", { user_id });
    if (!riceLandsResponse.data || riceLandsResponse.data.lands.length === 0) {
      console.log("[TASK] No rice lands found.");
      return BackgroundFetchResult.NoData;
    }

    const riceLandIds = riceLandsResponse.data.lands.map((land) => land.id);
    let newTasks = [];

    // Fetch tasks for each rice_land_id
    for (const rice_land_id of riceLandIds) {
      const response = await api.get("/get_task", {
        params: {
          date: new Date().toISOString().split("T")[0], // Get today's date
          rice_land_id,
        },
      });

      if (response.data && response.data.length > 0) {
        console.log(`[TASK] Tasks found for Rice Land ${rice_land_id}:`, response.data);
        newTasks.push(...response.data);

        // Send local notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Task Today!",
            body: `You have new tasks for your Land. Check them out`,
            data: { rice_land_id, tasks: response.data },
          },
          trigger: null,
        });
      }
    }

    console.log(`[TASK] Completed. New Tasks: ${newTasks.length}`);
    return newTasks.length > 0 ? BackgroundFetchResult.NewData : BackgroundFetchResult.NoData;

  } catch (error) {
    console.error("[TASK] Background task error:", error);
    return BackgroundFetchResult.Failed;
  }
});

// Register Background Task
export async function registerBackgroundTask() {
  const status = await BackgroundFetch.getStatusAsync();
  console.log("[TASK] Background Fetch Status:", status);

  if (status === BackgroundFetchStatus.Restricted || status === BackgroundFetchStatus.Denied) {
    console.log("[TASK] Background fetch is disabled.");
    return;
  }

  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK);
  console.log("[TASK] Is Task Already Registered?:", isRegistered);

  if (!isRegistered) {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK, {
      minimumInterval: 15 * 60, // Every 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log("[TASK] Background task registered successfully.");
  } else {
    console.log("[TASK] Background task already registered.");
  }
}

// Function to get remaining time for the next execution
export async function getRemainingTime() {
  try {
    const lastExecution = await AsyncStorage.getItem("last_execution");

    if (!lastExecution) {
      console.log("[TIMER] No last execution time found.");
      return "Unknown";
    }

    const lastExecutionTime = parseInt(lastExecution, 10);
    const now = Date.now();
    const elapsedTime = now - lastExecutionTime;
    const remainingTime = INTERVAL - elapsedTime;

    return remainingTime > 0 ? `${Math.floor(remainingTime / 1000)} seconds` : "Now";
  } catch (error) {
    console.error("[TIMER] Error getting remaining time:", error);
    return "Error";
  }
}