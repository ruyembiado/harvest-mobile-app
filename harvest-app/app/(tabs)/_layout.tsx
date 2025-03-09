import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PaperProvider } from "react-native-paper";
import { RiceLandProvider } from "../../context/RiceLandContext";

export default function RootLayout() {
  return (
    <RiceLandProvider>
      <PaperProvider>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: "#4CAF50",
            tabBarInactiveTintColor: "#808080",
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              tabBarLabel: "Home",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="home-outline" size={size} color={color} />
              ),
              headerTitleAlign: "center",
            }}
          />

          <Tabs.Screen
            name="calendar"
            options={{
              tabBarLabel: "Calendar",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="calendar-outline" size={size} color={color} />
              ),
              headerTitle: "Calendar",
              headerTitleAlign: "center",
            }}
          />

          <Tabs.Screen
            name="weather"
            options={{
              tabBarLabel: "Weather",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="cloudy-outline" size={size} color={color} />
              ),
              headerTitle: "Weather",
              headerTitleAlign: "center",
            }}
          />

          <Tabs.Screen
            name="notes"
            options={{
              tabBarLabel: "Notes",
              tabBarIcon: ({ color, size }) => (
                <Ionicons
                  name="document-text-outline"
                  size={size}
                  color={color}
                />
              ),
              headerTitle: "Notes",
              headerTitleAlign: "center",
            }}
          />

          <Tabs.Screen
            name="setting"
            options={{
              tabBarLabel: "Settings",
              tabBarIcon: ({ color, size }) => (
                <Ionicons
                  name="settings-outline"
                  size={size}
                  color={color}
                />
              ),
              headerTitle: "Settings",
              headerTitleAlign: "center",
            }}
          />
        </Tabs>
      </PaperProvider>
    </RiceLandProvider>
  );
}
