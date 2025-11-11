import React, { useState } from "react";
import {View,Text,TextInput,TouchableOpacity,StyleSheet,Alert,} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function EditEmail({ navigation }) {
  const [email, setEmail] = useState("m*********@gmail.com");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    if (!email.includes("@") || !email.includes(".")) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setIsSaving(true);

    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert("Success", "Your email has been updated!");
      navigation.goBack();
    }, 1000);
  };

  return (
    <View style={styles.container}>

      {/* Input Field */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="Enter your email"
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Text style={styles.saveButtonText}>
          {isSaving ? "Saving..." : "Save"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 0,
    backgroundColor: "#fff",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginLeft: 10,
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  saveButton: {
    backgroundColor: "#ce4da3ff",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
});
