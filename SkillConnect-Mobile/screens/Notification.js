import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
} from "react-native";

export default function Notification() {
  const [eReceipts, setEReceipts] = useState(false);
  const [proofDelivery, setProofDelivery] = useState(true);

  return (
    <ScrollView style={styles.container}>
      {/* Section: E-Receipts */}
      <Text style={styles.sectionHeader}>E-Receipts</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Receive E-receipts</Text>
        <Switch
          value={eReceipts}
          onValueChange={setEReceipts}
          thumbColor={eReceipts ? "#4caf50" : "#f4f3f4"}
          trackColor={{ false: "#ccc", true: "#81c784" }}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>E-Receipts Email</Text>
        <Text style={styles.value}>example@email.com</Text>
      </View>

      {/* Section: Proof of Delivery */}
      <Text style={styles.sectionHeader}>Proof of Delivery</Text>

      <View style={styles.row}>
        <Text style={styles.label}>
          Receive signature or photo proof upon delivery
        </Text>
        <Switch
          value={proofDelivery}
          onValueChange={setProofDelivery}
          thumbColor={proofDelivery ? "#4caf50" : "#f4f3f4"}
          trackColor={{ false: "#ccc", true: "#81c784" }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: "#f4f0ef",
    fontWeight: "600",
    color: "#555",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
  },
  label: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingRight: 10, // space before toggle
  },
  value: {
    fontSize: 16,
    color: "#555",
  },
});