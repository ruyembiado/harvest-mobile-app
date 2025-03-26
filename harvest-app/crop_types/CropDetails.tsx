import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import GlobalStyles from "../assets/styles/styles";

export const cropDetails = {
  "NSIC Rc 222": {
    averageYield: "4.8 t/ha",
    maximumYield: "7.5 t/ha",
    maturity: "106 days after seeding",
    height: "77 cm",
    reactionToPestsAndDiseases:
      "Resistant to blast and brown planthopper. Intermediate reaction to bacterial leaf blight, tungro, and stem borer. Moderately resistant to green leaf hopper.",
    grainSize: "Medium",
    millingRecovery: "66.62%",
    eatingQuality: "Hard",
  },
  "NSIC Rc 216": {
    averageYield: "5.2 t/ha",
    maximumYield: "8.0 t/ha",
    maturity: "110 days after seeding",
    height: "80 cm",
    reactionToPestsAndDiseases:
      "Resistant to blast and bacterial leaf blight. Intermediate reaction to tungro and stem borer. Moderately resistant to green leaf hopper.",
    grainSize: "Medium",
    millingRecovery: "68.5%",
    eatingQuality: "Medium",
  },
  "NSIC Rc 480": {
    averageYield: "5.5 t/ha",
    maximumYield: "8.5 t/ha",
    maturity: "115 days after seeding",
    height: "85 cm",
    reactionToPestsAndDiseases:
      "Resistant to blast and brown planthopper. Intermediate reaction to bacterial leaf blight and tungro. Moderately resistant to stem borer.",
    grainSize: "Long",
    millingRecovery: "70.0%",
    eatingQuality: "Soft",
  },
  "NSIC Rc 10": {
    averageYield: "4.5 t/ha",
    maximumYield: "7.0 t/ha",
    maturity: "100 days after seeding",
    height: "75 cm",
    reactionToPestsAndDiseases:
      "Resistant to blast and green leaf hopper. Intermediate reaction to bacterial leaf blight and tungro. Moderately resistant to stem borer.",
    grainSize: "Short",
    millingRecovery: "65.0%",
    eatingQuality: "Medium",
  },
};

interface CropDetailsProps {
  cropType: string;
  translations: {
    [key: string]: string;
  };
  targetLang: string;
  translateText: (text: string, targetLang: string) => Promise<string>;
  isOffline: boolean;
}

const CropDetails = ({
  cropType,
  translations,
  targetLang,
  translateText,
  isOffline,
}: CropDetailsProps) => {
  const [translatedDetails, setTranslatedDetails] = useState<
    (typeof cropDetails)[keyof typeof cropDetails] | null
  >(null);
  const [loading, setLoading] = useState(true);

  const details = cropDetails[cropType as keyof typeof cropDetails];

  useEffect(() => {
    if (details) {
      const processDetails = async () => {
        if (isOffline) {
          // Use untranslated details when offline
          setTranslatedDetails(details);
        } else {
          // Online - try to translate
          try {
            const translated = {
              averageYield: await translateText(
                details.averageYield,
                targetLang
              ),
              maximumYield: await translateText(
                details.maximumYield,
                targetLang
              ),
              maturity: await translateText(details.maturity, targetLang),
              height: await translateText(details.height, targetLang),
              reactionToPestsAndDiseases: await translateText(
                details.reactionToPestsAndDiseases,
                targetLang
              ),
              grainSize: await translateText(details.grainSize, targetLang),
              millingRecovery: await translateText(
                details.millingRecovery,
                targetLang
              ),
              eatingQuality: await translateText(
                details.eatingQuality,
                targetLang
              ),
            };
            setTranslatedDetails(translated);
          } catch (error) {
            // Fallback to untranslated if translation fails
            setTranslatedDetails(details);
          }
        }
        setLoading(false);
      };

      processDetails();
    } else {
      setLoading(false);
    }
  }, [details, targetLang, translateText, isOffline]);

  if (!details) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{translations.cropNotFound}</Text>
      </View>
    );
  }

  if (loading || !translatedDetails) {
    return (
      <View style={styles.container}>
        <ActivityIndicator
          size="large"
          color={GlobalStyles.activityIndicator.color}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{cropType}</Text>
      <Text style={styles.label}>{translations.averageYield}:</Text>
      <Text style={styles.value}>{translatedDetails.averageYield}</Text>
      <Text style={styles.label}>{translations.maximumYield}:</Text>
      <Text style={styles.value}>{translatedDetails.maximumYield}</Text>
      <Text style={styles.label}>{translations.maturity}:</Text>
      <Text style={styles.value}>{translatedDetails.maturity}</Text>
      <Text style={styles.label}>{translations.height}:</Text>
      <Text style={styles.value}>{translatedDetails.height}</Text>
      <Text style={styles.label}>
        {translations.reactionToPestsAndDiseases}:
      </Text>
      <Text style={styles.value}>
        {translatedDetails.reactionToPestsAndDiseases}
      </Text>
      <Text style={styles.label}>{translations.grainSize}:</Text>
      <Text style={styles.value}>{translatedDetails.grainSize}</Text>
      <Text style={styles.label}>{translations.millingRecovery}:</Text>
      <Text style={styles.value}>{translatedDetails.millingRecovery}</Text>
      <Text style={styles.label}>{translations.eatingQuality}:</Text>
      <Text style={styles.value}>{translatedDetails.eatingQuality}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
  },
  value: {
    fontSize: 14,
    marginBottom: 0,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
  },
});

export default CropDetails;
