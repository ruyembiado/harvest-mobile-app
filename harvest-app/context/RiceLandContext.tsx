import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define the context type
interface RiceLandContextType {
  riceLandId: number | null;
  setRiceLandId: (id: number | null) => void;
}

// Create the context
const RiceLandContext = createContext<RiceLandContextType | undefined>(undefined);

// Define props for the provider
interface RiceLandProviderProps {
  children: ReactNode;
}

// Create the provider component
export const RiceLandProvider: React.FC<RiceLandProviderProps> = ({ children }) => {
  const [riceLandId, setRiceLandId] = useState<number | null>(null);

  // Load riceLandId from AsyncStorage when the app starts
  useEffect(() => {
    const loadRiceLandId = async () => {
      try {
        const savedRiceLandId = await AsyncStorage.getItem("riceLandId");
        if (savedRiceLandId) {
          setRiceLandId(JSON.parse(savedRiceLandId));
        }
      } catch (error) {
        console.error("Failed to load riceLandId from AsyncStorage:", error);
      }
    };

    loadRiceLandId();
  }, []);

  // Save riceLandId to AsyncStorage whenever it changes
  useEffect(() => {
    const saveRiceLandId = async () => {
      try {
        if (riceLandId !== null) {
          await AsyncStorage.setItem("riceLandId", JSON.stringify(riceLandId));
        } else {
          await AsyncStorage.removeItem("riceLandId");
        }
      } catch (error) {
        console.error("Failed to save riceLandId to AsyncStorage:", error);
      }
    };

    saveRiceLandId();
  }, [riceLandId]);

  return (
    <RiceLandContext.Provider value={{ riceLandId, setRiceLandId }}>
      {children}
    </RiceLandContext.Provider>
  );
};

// Custom hook to use the context
export const useRiceLand = () => {
  const context = useContext(RiceLandContext);
  if (!context) {
    throw new Error("useRiceLand must be used within a RiceLandProvider");
  }
  return context;
};