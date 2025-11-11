import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from "react-native";

export default function AcceptedScreen({ navigation }) {
  const handleCancel = () => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => {
            Alert.alert("Order Cancelled");
            navigation.navigate("PlaceOrder");
          },
        },
      ]
    );
  };

  const handleChat = () => {
    navigation.navigate("ChatScreen"); // Placeholder for chat navigation
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Status: Accepted</Text>
        <Text style={styles.headerText}>Date: 2025-10-07</Text>
        <Text style={styles.headerText}>Time: Morning</Text>
      </View>

      {/* Worker Info */}
      <View style={styles.workerBox}>
        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
          }}
          style={styles.workerImage}
        />
        <View style={styles.workerInfo}>
          <Text style={styles.workerName}>Juan Dela Cruz</Text>
          <Text style={styles.workerDetail}>Skill: Plumbing</Text>
          <Text style={styles.workerDetail}>Phone: 09123456789</Text>

         
        </View>
      </View>

      {/* Customer Details */}
      <View style={styles.detailsBox}>
        <Text style={styles.text}>
          <Text style={styles.label}>Customer Name:</Text> John Doe
        </Text>
        <Text style={styles.text}>
          <Text style={styles.label}>Address:</Text> 123 Main St
        </Text>
        <Text style={styles.text}>
          <Text style={styles.label}>Phone #:</Text> 09123456789
        </Text>
      </View>

      {/* Order Details */}
      <View style={styles.workBox}>
        <Text style={styles.text}>
          <Text style={styles.label}>Type of Work:</Text> Plumbing
        </Text>
        <Text style={styles.text}>
          <Text style={styles.label}>Assigned to favourite worker first</Text>
        </Text>
        <Text style={styles.text}>
          <Text style={styles.label}>Budget:</Text> ₱300
        </Text>
        <Text style={styles.text}>
          <Text style={styles.label}>Note:</Text> Please come ASAP.
        </Text>
      </View>

      {/* Buttons */}
      <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
        <Text style={styles.chatText}>Chat with Worker</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Text style={styles.cancelText}>Cancel Order</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#B7B5FF",
    paddingVertical: 25,
    paddingHorizontal: 25,
    marginHorizontal: -20,
    marginTop: 50,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  workerBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: "#fafafa",
  },
  workerImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  workerDetail: {
    fontSize: 14,
    color: "#444",
    marginBottom: 2,
  },
  detailsBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  workBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  label: {
    fontWeight: "600",
    color: "#333",
  },
  text: {
    fontSize: 14,
    color: "#444",
    marginBottom: 6,
  },
  chatButton: {
    backgroundColor: "#000",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  chatText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
});