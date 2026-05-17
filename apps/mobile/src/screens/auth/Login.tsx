import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuthStore } from "@/store/authStore";
import { COLORS } from "@calm-stories/shared";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) return;
    await login({ email, password });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Admin Login</Text>
        <Text style={styles.subtitle}>
          Sign in to manage stories and content
        </Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            clearError();
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={COLORS.admin.textLight}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            clearError();
          }}
          secureTextEntry
          placeholderTextColor={COLORS.admin.textLight}
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: COLORS.admin.background,
  },
  card: {
    backgroundColor: COLORS.admin.surface,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.admin.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.admin.textLight,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.admin.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    color: COLORS.admin.text,
    backgroundColor: "#FAFBFC",
  },
  button: {
    backgroundColor: COLORS.admin.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  errorBox: {
    backgroundColor: "#FEE",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.admin.danger,
    fontSize: 14,
  },
});
