import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from './locales/english.json';
import tl from './locales/tagalog.json';
import hil from './locales/hiligaynon.json';

// Initialize i18next
i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        tl: { translation: tl },
        hil: { translation: hil },
    },
    lng: Localization.locale.split('-')[0], // Use the device's locale
    fallbackLng: 'en', // Fallback language
    interpolation: {
        escapeValue: false, // React already escapes values
    },
});

// Function to change language
export const changeLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng);
    await AsyncStorage.setItem('selectedLanguage', lng); // Save language preference
};

// Load saved language preference on app start
export const loadLanguage = async () => {
    const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
    const defaultLanguage = savedLanguage || Localization.locale.split('-')[0]; // Use Expo Localization
    await changeLanguage(defaultLanguage); // Set the language
};

// Load language when the app starts
loadLanguage();

export default i18n;