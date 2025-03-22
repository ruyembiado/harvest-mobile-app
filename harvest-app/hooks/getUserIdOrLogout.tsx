import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import api from "../services/api";

const getUserIdOrLogout = async (router: any): Promise<string | null> => {
  try {
    const user_id = await AsyncStorage.getItem("user_id");

    if (!user_id) {
      console.error("User ID not found.");
      Alert.alert("Session Expired", "You have been logged out.", [
        {
          text: "OK",
          onPress: async () => {
            await api.post("/logout"); 
            await AsyncStorage.removeItem("user_id");
            await AsyncStorage.removeItem("authToken");
            router.replace("../../login");
          },
        },
      ]);
      return null;
    }
    return user_id;
  } catch (error) {
    console.error("Error retrieving user ID:", error);
    return null;
  }
};

export default getUserIdOrLogout;
