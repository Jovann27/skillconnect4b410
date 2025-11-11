import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

export default function Clients({ navigation }) {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      try {
        const storedUser = await AsyncStorage.getItem("userData");
        const user = JSON.parse(storedUser);
        const userService = user?.services || [];

        // Mock data (replace with API later)
        const fakeClients = [
          {
            id: 1,
            name: "Jeremy Albuera",
            email: "albuera@gmail.com",
            phone: "09123456789",
            service: "Yapperist",
            budget: "₱300",
            date: "10-18-2025",
            time: "9:00AM - 12:00PM",
            location: "Bahay ng Nigga",
            note: "Please arrive early and bring materials.",
            photo: null,
          },
          {
            id: 2,
            name: "Maria Santos",
            email: "maria@gmail.com",
            phone: "09999999999",
            service: "Plumbing",
            budget: "₱500",
            date: "10-20-2025",
            time: "1:00PM - 3:00PM",
            location: "Barangay 2, Street 10",
            note: "Urgent repair needed.",
            photo: null,
          },
        ];

        const filtered =
          userService.length > 0
            ? fakeClients.filter((c) => userService.includes(c.service))
            : fakeClients;

        setClients(filtered);
      } catch (err) {
        console.log("Error loading clients:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleAccept = (client) => {
    Alert.alert("Request Accepted", `You accepted ${client.name}'s request.`, [
      {
        text: "OK",
        onPress: () => navigation.navigate("ClientAccepted", { client }),
      },
    ]);
  };

  const handleDecline = (client) =>
    Alert.alert("Request Declined", `You declined ${client.name}'s request.`);

  const renderClient = ({ item }) => (
    <View style={styles.card}>
      {/* Client Header */}
      <View style={styles.profileHeader}>
        <Image
          source={
            item.photo
              ? { uri: item.photo }
              : require("../assets/default-profile.png")
          }
          style={styles.avatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.info}> {item.email}</Text>
          <Text style={styles.info}> {item.phone}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Service Info */}
      <View style={styles.details}>
        <Detail icon="briefcase-outline" label="Service Needed" value={item.service} />
        <Detail icon="cash-outline" label="Budget" value={item.budget} />
        <Detail icon="calendar-outline" label="Date Required" value={item.date} />
        <Detail icon="time-outline" label="Preferred Time" value={item.time} />
        <Detail icon="location-outline" label="Location" value={item.location} />
        {item.note && <Detail icon="document-text-outline" label="Note" value={item.note} />}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.accept]}
          onPress={() => handleAccept(item)}
        >
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.decline]}
          onPress={() => handleDecline(item)}
        >
          <Ionicons name="close-circle" size={18} color="#fff" />
          <Text style={styles.buttonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading)
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#c20884" />
        <Text style={{ color: "#555", marginTop: 10 }}>Loading clients...</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      {clients.length === 0 ? (
        <Text style={styles.noData}>No client requests found.</Text>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderClient}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

/* Reusable detail line with icon */
const Detail = ({ label, value, icon }) => (
  <View style={styles.detailRow}>
    <Ionicons name={icon} size={16} color="#c20884" style={{ marginRight: 8 }} />
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fb",
    padding: 15,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#eee",
    padding: 18,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#eee",
    marginRight: 14,
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
  },
  info: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 10,
  },
  details: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    flexWrap: "wrap",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    width: 130,
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    flexShrink: 1,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 25,
    marginHorizontal: 5,
  },
  accept: {
    backgroundColor: "#4CAF50",
  },
  decline: {
    backgroundColor: "#E57373",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 6,
  },
  noData: {
    textAlign: "center",
    color: "#777",
    marginTop: 50,
    fontSize: 16,
  },
});
