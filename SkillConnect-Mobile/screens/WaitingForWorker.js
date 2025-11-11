import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  Animated,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import apiClient from "../api";
import { socket } from "../utils/socket";

// --- Status Header Component ---
const StatusHeader = ({ status }) => {
  const isAccepted = status === "ACCEPTED";
  const config = {
    icon: isAccepted ? "checkmark-circle" : "time-outline",
    bgColor: isAccepted ? "#E8FDEB" : "#FFF8E1",
    color: isAccepted ? "#4CAF50" : "#FBC02D",
    title: isAccepted ? "Order Accepted!" : "Finding a Worker...",
    subtitle: isAccepted
      ? "Your worker is on the way. Get ready!"
      : "Please wait while we find a nearby available worker.",
  };

  return (
    <View style={[styles.headerCard, { backgroundColor: config.bgColor }]}>
      <View style={[styles.headerIconBox, { backgroundColor: config.color + "20" }]}>
        <Ionicons name={config.icon} size={34} color={config.color} />
      </View>
      <View style={{ marginLeft: 12 }}>
        <Text style={styles.statusTitle}>{config.title}</Text>
        <Text style={styles.statusSub}>{config.subtitle}</Text>
      </View>
    </View>
  );
};

// --- Animated Loader ---
const AnimatedWaiting = () => {
  const spinValue = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, []);
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  return (
    <Animated.View style={{ transform: [{ rotate: spin }] }}>
      <Ionicons name="refresh-circle" size={70} color="#C20884" />
    </Animated.View>
  );
};

// --- Worker Info ---
const WorkerSection = ({ status, worker, onChat, onCall }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status === "ACCEPTED") {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [status]);

  if (status !== "ACCEPTED") {
    return (
      <View style={styles.waitingContainer}>
        <AnimatedWaiting />
        <Text style={styles.waitingMain}>Searching for an available worker...</Text>
        <Text style={styles.waitingSub}>This may take a few moments.</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.workerCard, { opacity: fadeAnim }]}>
      <View style={styles.workerTopRow}>
        <Image source={{ uri: worker.image }} style={styles.workerImage} />
        <View style={styles.workerDetails}>
          <Text style={styles.workerName}>{worker.name}</Text>
          <Text style={styles.workerSkill}>{worker.skill}</Text>
          <Text style={styles.workerPhone}>{worker.phone}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: "#E8F5E9" }]} onPress={onCall}>
            <Ionicons name="call-outline" size={24} color="#2E7D32" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: "#FCE4EC" }]} onPress={onChat}>
            <Ionicons name="chatbox-ellipses-outline" size={24} color="#C2185B" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.workerFooter}>
        <Ionicons name="navigate-outline" size={18} color="#666" />
        <Text style={styles.workerFooterText}>Worker is heading to your location...</Text>
      </View>
    </Animated.View>
  );
};

// --- Details Card ---
const DetailsCard = ({ title, data }) => (
  <View style={styles.infoCard}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {data.map((item, index) => (
      <Text key={index} style={styles.infoText}>
        <Text style={{ fontWeight: "600" }}>{item.label}: </Text>
        {item.value}
      </Text>
    ))}
  </View>
);

export default function WaitingForWorker({ route, navigation }) {
  const { orderData } = route.params || {};
  const [serviceRequest, setServiceRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determine status display based on service request status
  const getDisplayStatus = (status) => {
    switch (status) {
      case "Available":
        return "PENDING";
      case "Working":
        return "ACCEPTED";
      case "Complete":
        return "COMPLETED";
      case "Cancelled":
        return "CANCELLED";
      default:
        return "PENDING";
    }
  };

  const fetchServiceRequest = async () => {
    try {
      if (!orderData?._id) {
        setError("No order ID provided");
        setLoading(false);
        return;
      }

      const { data } = await apiClient.get(`/user/service-request/${orderData._id}`);
      if (data.success) {
        setServiceRequest(data.request);
      } else {
        setError("Failed to fetch order details");
      }
    } catch (err) {
      console.error("Error fetching service request:", err);
      setError(err.message || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceRequest();

    // Listen for real-time updates
    socket.on("service-request-updated", (data) => {
      console.log("Service request updated:", data);
      if (data.requestId === orderData?._id) {
        fetchServiceRequest(); // Refetch the data
      }
    });

    return () => {
      socket.off("service-request-updated");
    };
  }, [orderData?._id]);

  const handleCancel = async () => {
    if (!serviceRequest?._id) return;

    Alert.alert("Cancel Order", "Are you sure you want to cancel?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/user/service-request/${serviceRequest._id}/cancel`);
            navigation.navigate("PlaceOrder");
          } catch (err) {
            console.error("Error cancelling request:", err);
            Alert.alert("Error", "Failed to cancel the order. Please try again.");
          }
        }
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <AnimatedWaiting />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={50} color="#E53935" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchServiceRequest}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const displayStatus = getDisplayStatus(serviceRequest?.status);
  const workerData = serviceRequest?.serviceProvider ? {
    name: `${serviceRequest.serviceProvider.firstName} ${serviceRequest.serviceProvider.lastName}`,
    skill: serviceRequest.typeOfWork,
    phone: serviceRequest.serviceProvider.phone || "Not available",
    image: serviceRequest.serviceProvider.profilePic || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
  } : null;

  const customerDetails = [
    { label: "Name", value: serviceRequest?.name || "N/A" },
    { label: "Address", value: serviceRequest?.address || "N/A" },
    { label: "Phone", value: serviceRequest?.phone || "N/A" },
  ];

  const orderDetails = [
    { label: "Service Type", value: serviceRequest?.typeOfWork || "N/A" },
    { label: "Priority", value: serviceRequest?.targetProvider ? "Favorite Worker" : "Any Available" },
    { label: "Budget", value: `₱${serviceRequest?.budget || "N/A"}` },
    { label: "Note", value: serviceRequest?.notes || "None" },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <StatusHeader status={displayStatus} />
        <WorkerSection
          status={displayStatus}
          worker={workerData}
          onChat={() => navigation.navigate("WorkerChat", { worker: workerData, orderId: serviceRequest._id })}
          onCall={() => Linking.openURL(`tel:${workerData?.phone}`)}
        />
        <DetailsCard title="Customer Details" data={customerDetails} />
        <DetailsCard title="Order Details" data={orderDetails} />

        {serviceRequest?.status === "Available" && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Ionicons name="close-circle-outline" size={18} color="#D32F2F" />
            <Text style={styles.cancelText}>Cancel Order</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  headerIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },
  statusSub: {
    color: "#555",
    fontSize: 13,
    marginTop: 2,
  },
  waitingContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 30,
    borderRadius: 15,
    marginBottom: 20,
    elevation: 2,
  },
  waitingMain: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 15,
    color: "#333",
  },
  waitingSub: {
    fontSize: 13,
    color: "#777",
    marginTop: 4,
  },
  workerCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  workerTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  workerImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 12,
  },
  workerDetails: { flex: 1 },
  workerName: { fontSize: 18, fontWeight: "700", color: "#111" },
  workerSkill: { fontSize: 14, color: "#555", marginTop: 3 },
  workerPhone: { fontSize: 13, color: "#777", marginTop: 2 },
  buttonContainer: { flexDirection: "row", alignItems: "center" },
  iconButton: {
    borderRadius: 10,
    padding: 8,
    marginLeft: 8,
  },
  workerFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    paddingTop: 10,
  },
  workerFooterText: {
    marginLeft: 8,
    color: "#555",
    fontSize: 13,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    color: "#333",
  },
  infoText: {
    fontSize: 14,
    color: "#444",
    marginBottom: 6,
  },
  cancelButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FEECEC",
    borderWidth: 1,
    borderColor: "#D32F2F",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 10,
  },
  cancelText: {
    color: "#D32F2F",
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    color: "#E53935",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#ce4da3ff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
