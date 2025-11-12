import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMainContext } from "../contexts/MainContext";

export default function BlockedWorker({ route, navigation }) {
  const { api } = useMainContext();
  const worker = route.params?.worker;
  const [unblocking, setUnblocking] = useState(false);

  if (!worker) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#666' }}>No worker data available</Text>
      </View>
    );
  }

  const handleUnblock = () => {
    Alert.alert(
      "Unblock Worker",
      `Are you sure you want to unblock ${worker.firstName} ${worker.lastName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          style: "destructive",
          onPress: () => performUnblock(),
        },
      ]
    );
  };

  const performUnblock = async () => {
    try {
      setUnblocking(true);
      const response = await api.unblockUser(worker._id);

      if (response.data.success) {
        Alert.alert("Success", `${worker.firstName} ${worker.lastName} has been unblocked.`);
        navigation.goBack();
      } else {
        Alert.alert("Error", "Failed to unblock user. Please try again.");
      }
    } catch (error) {
      console.error("Error unblocking user:", error);
      Alert.alert("Error", "Failed to unblock user. Please try again.");
    } finally {
      setUnblocking(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <Image
          source={
            worker.profilePic
              ? { uri: worker.profilePic }
              : require("../assets/default-profile.png")
          }
          style={styles.profileImage}
          accessibilityLabel={`${worker.firstName} ${worker.lastName} profile image`}
        />
        <Text style={styles.name}>{worker.firstName} {worker.lastName}</Text>
        <Text style={styles.service}>
          {worker.skills && worker.skills.length > 0 ? worker.skills.join(', ') : 'No skills listed'}
        </Text>

        {/* ⭐ Rating placeholder */}
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={18} color="#FFD700" />
          <Text style={styles.ratingText}>N/A</Text>
        </View>

        {/* 🧱 Unblock button */}
        <TouchableOpacity
          style={[styles.unblockButton, unblocking && { opacity: 0.6 }]}
          onPress={handleUnblock}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Unblock ${worker.firstName} ${worker.lastName}`}
          disabled={unblocking}
        >
          {unblocking ? (
            <ActivityIndicator size="small" color="#6e6b6bff" style={{ marginRight: 8 }} />
          ) : (
            <Ionicons name="ban" size={18} color="#6e6b6bff" style={{ marginRight: 8 }} />
          )}
          <Text style={styles.unblockText}>
            {unblocking ? 'Unblocking...' : 'Unblock Worker'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.detailsBox}>
        <Text style={styles.label}>Block Information:</Text>
        <Text style={styles.reasonText}>
          This user has been blocked from your interactions. You can unblock them to allow future interactions.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  profileSection: {
    alignItems: "center",
    marginTop: 8,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
  },
  service: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  ratingText: {
    fontSize: 14,
    color: "#444",
    marginLeft: 6,
    fontWeight: "600",
  },
  detailsBox: {
    marginTop: 28,
    backgroundColor: "#f7f7f8",
    borderRadius: 10,
    padding: 16,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
    color: "#111",
  },
  reasonText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },
  unblockButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },
  unblockText: {
    color: "#6e6b6bff",
    fontSize: 16,
    fontWeight: "700",
  },
});
