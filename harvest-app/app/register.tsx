import React from "react";
import { View, Alert } from "react-native";
import {
  Provider as PaperProvider,
  Text,
  TextInput,
  Card,
  Button,
} from "react-native-paper";
import { Link } from "expo-router";
import GlobalStyles from "../assets/styles/styles";
import customTheme from "../assets/styles/theme";
import api from "../services/api";
import { useTranslation } from "react-i18next"; // Import useTranslation hook

const Register: React.FC = () => {
  const { t } = useTranslation(); // Use the translation hook
  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const [name, setName] = React.useState<string>("");
  const [phone, setPhoneNumber] = React.useState<string>("");
  const [confirm_pass, setConfirmPass] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);

  const handleRegister = async () => {
    if (password !== confirm_pass) {
      alert(t("password_mismatch")); // Translate alert message
      return;
    }

    if (!email) {
      alert(t("email_required")); // Translate alert message
      return;
    }
    if (!password) {
      alert(t("password_required")); // Translate alert message
      return;
    }
    if (!name) {
      alert(t("name_required")); // Translate alert message
      return;
    }
    if (!phone) {
      alert(t("phone_required")); // Translate alert message
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/register", {
        name,
        email,
        phone,
        password,
      });

      console.log("User:", response.data.user);
      setName("");
      setEmail("");
      setPhoneNumber("");
      setPassword("");
      setConfirmPass("");
      alert(t("registration_successful")); // Translate alert message
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert(t("registration_failed"), t("try_again")); // Translate alert messages
    } finally {
      setLoading(false);
    }
  };

  return (
    <PaperProvider theme={customTheme}>
      <View style={GlobalStyles.container}>
        <Card style={GlobalStyles.card}>
          <Card.Content>
            <Text variant="headlineLarge" style={GlobalStyles.title}>
              H.A.R.V.E.S.T
            </Text>
            <TextInput
              label={t("full_name")} // Translate label
              value={name}
              onChangeText={(name) => setName(name)}
              mode="outlined"
              style={GlobalStyles.input}
              autoCapitalize="none"
            />
            <TextInput
              label={t("email")} // Translate label
              value={email}
              onChangeText={(email) => setEmail(email)}
              mode="outlined"
              style={GlobalStyles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              label={t("phone_number")} // Translate label
              value={phone}
              onChangeText={(phone) => setPhoneNumber(phone)}
              mode="outlined"
              style={GlobalStyles.input}
              keyboardType="number-pad"
              autoCapitalize="none"
            />
            <TextInput
              label={t("password")} // Translate label
              value={password}
              onChangeText={(password) => setPassword(password)}
              mode="outlined"
              style={GlobalStyles.input}
              secureTextEntry
              autoCapitalize="none"
            />
            <TextInput
              label={t("confirm_password")} // Translate label
              value={confirm_pass}
              onChangeText={(confirm_pass) => setConfirmPass(confirm_pass)}
              mode="outlined"
              style={GlobalStyles.input}
              secureTextEntry
              autoCapitalize="none"
            />
            <Button
              icon="login"
              mode="contained"
              onPress={handleRegister}
              style={GlobalStyles.button}
              loading={loading} // Show loading spinner when registering
              disabled={loading} // Disable the button while loading
            >
              {t("register")} {/* Translate button text */}
            </Button>

            <Text>
              {t("already_have_an_account")}{" "} {/* Translate text */}
              <Link href="/" style={GlobalStyles.registerLink}>
                {t("login_here")} {/* Translate link text */}
              </Link>
            </Text>
          </Card.Content>
        </Card>
      </View>
    </PaperProvider>
  );
};

export default Register;