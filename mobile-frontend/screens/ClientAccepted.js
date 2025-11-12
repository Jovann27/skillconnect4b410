import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  SafeAreaView,
  Linking,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useMainContext } from "../contexts/MainContext";

export default function ClientAccepted({ route, navigation }) {
  const { requestId } = route.params || {};
  const { user, api } = useMainContext();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState("");
  const [media, setMedia] = useState([]);

  // Fetch request data on component mount
  useEffect(() => {
    if (requestId) {
      fetchRequestData();
    } else {
      // If no requestId provided, fetch all accepted requests and use the first one
      // This is a fallback for backward compatibility
      fetchAcceptedRequests();
    }
  }, [requestId]);

  const fetchRequestData = async () => {
    try {
      setLoading(true);
      // For now, we'll fetch all accepted requests and find the matching one
      // In a real implementation, you'd have a specific endpoint to get a single request
      const response = await api.getMyAcceptedRequests();
      if (response.data.success) {
        const foundRequest = response.data.requests.find(req => req._id === requestId);
        if (foundRequest) {
          setRequest(foundRequest);
        } else {
          Alert.alert("Error", "Request not found");
          navigation.goBack();
        }
      }
    } catch (error) {
      console.error("Error fetching request:", error);
      Alert.alert("Error", "Failed to load request data");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchAcceptedRequests = async () => {
    try {
      setLoading(true);
      const response = await api.getMyAcceptedRequests();
      if (response.data.success && response.data.requests.length > 0) {
        setRequest(response.data.requests[0]); // Use the first/most recent request
      } else {
        Alert.alert("No Active Requests", "You don't have any active accepted requests.");
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error fetching accepted requests:", error);
      Alert.alert("Error", "Failed to load request data");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Confirmation",
      "Are you sure you want to cancel this service request?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          onPress: () => navigation.goBack(),
          style: "destructive",
        },
      ]
    );
  };

  const handleCall = () => {
    const phoneNumber = request?.requester?.phone || user?.phone || "09123456789";
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleChat = () => {
    navigation.navigate("Chat", {
      role: "worker",
      other: request?.requester,
      requestId: request?._id
    });
  };

  const pickMedia = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Camera roll permission is needed to select media.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.All,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const selected = result.assets || [];
      setMedia((prev) => [...prev, ...selected]);
    }
  };

  const handleSubmitProof = async () => {
    if (media.length === 0) {
      Alert.alert("Required", "Please upload proof of work before completing the job.");
      return;
    }

    try {
      setSubmitting(true);
      // Complete the service request
      const response = await api.completeServiceRequest(request._id);

      if (response.data.success) {
        Alert.alert("Success", "Proof of work submitted and job completed successfully!");
        navigation.goBack();
      } else {
        Alert.alert("Error", "Failed to complete the job. Please try again.");
      }
    } catch (error) {
      console.error("Error completing service request:", error);
      Alert.alert("Error", "Failed to submit proof. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f2f2f8", justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#c20884" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading request details...</Text>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f2f2f8", justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#666', textAlign: 'center' }}>No request data available</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f2f2f8" }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Service Provider Info Card (Current User) */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.profileRow}>
              <Image
                source={
                  user?.profilePic
                    ? { uri: user.profilePic }
                    : require("../assets/default-profile.png")
                }
                style={styles.avatar}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
                <Text style={styles.info}>
                  <Text style={{ fontWeight: "600" }}>Role: </Text>
                  Service Provider
                </Text>
                <Text style={styles.info}>
                  <Text style={{ fontWeight: "600" }}>Status: </Text>
                  {request?.status || 'Working'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Client Info Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Details</Text>
          <View style={styles.card}>
            <View style={styles.profileRow}>
              <Image
                source={
                  request?.requester?.profilePic
                    ? { uri: request.requester.profilePic }
                    : require("../assets/default-profile.png")
                }
                style={styles.avatar}
              />
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.name}>
                  {request?.requester?.firstName} {request?.requester?.lastName}
                </Text>
                <Text style={styles.info}>{request?.requester?.email}</Text>
                <Text style={styles.info}>{request?.requester?.phone || 'Phone not provided'}</Text>
              </View>

              {/* Chat & Call Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.iconButton, styles.callButton]}
                  onPress={handleCall}
                >
                  <Ionicons name="call-outline" size={20} color="#2E7D32" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.iconButton, styles.chatButton]}
                  onPress={handleChat}
                >
                  <Ionicons name="chatbox-ellipses-outline" size={20} color="#C2185B" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Service Details */}
            <Detail icon="briefcase-outline" label="Service Type" value={request?.typeOfWork || 'Not specified'} />
            <Detail icon="cash-outline" label="Budget" value={`₱${request?.budget || 0}`} />
            <Detail icon="calendar-outline" label="Date Created" value={request?.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'Not specified'} />
            <Detail icon="time-outline" label="Preferred Time" value={request?.time || 'Not specified'} />

            <View style={styles.divider} />

            <Detail icon="trending-up-outline" label="Status" value={request?.status || 'Working'} />

            {request?.notes && (
              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>Client Notes</Text>
                <Text style={styles.noteText}>
                  {request.notes}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Proof of Work Upload Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Complete Service Request</Text>
          <View style={styles.card}>
            <Text style={styles.requiredText}>
              Please upload proof of work before marking the job as completed.
            </Text>

            <TouchableOpacity
              style={[styles.uploadButton, submitting && { opacity: 0.6 }]}
              onPress={pickMedia}
              disabled={submitting}
            >
              <Ionicons name="cloud-upload-outline" size={24} color="#c20884" />
              <Text style={styles.uploadText}>Attach Photos/Videos</Text>
            </TouchableOpacity>

            {media.length > 0 && (
              <ScrollView horizontal style={{ marginTop: 10 }}>
                {media.map((item, idx) => (
                  <Image
                    key={idx}
                    source={{ uri: item.uri }}
                    style={styles.mediaPreview}
                  />
                ))}
              </ScrollView>
            )}

            <TextInput
              style={styles.commentInput}
              placeholder="Add completion notes (optional)"
              multiline
              value={comment}
              onChangeText={setComment}
              editable={!submitting}
            />

            <TouchableOpacity
              style={[styles.submitButton, submitting && { opacity: 0.6 }]}
              onPress={handleSubmitProof}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitText}>Complete Job</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, submitting && { opacity: 0.6 }]}
              onPress={handleCancel}
              disabled={submitting}
            >
              <Text style={styles.cancelText}>Cancel Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Detail = ({ label, value, icon }) => (
  <View style={styles.detailRow}>
    <Ionicons name={icon} size={18} color="#c20884" style={{ marginRight: 10 }} />
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#222", marginBottom: 10 },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 18, borderWidth: 1, borderColor: "#eee", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  profileRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 55, height: 55, borderRadius: 27.5, backgroundColor: "#eee", marginRight: 12 },
  name: { fontSize: 16, fontWeight: "700", color: "#333" },
  info: { fontSize: 14, color: "#555", marginTop: 3 },
  buttonContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconButton: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  callButton: { backgroundColor: "#E8F5E9" },
  chatButton: { backgroundColor: "#FCE4EC" },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 12 },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, flexWrap: "wrap" },
  detailLabel: { fontSize: 14, fontWeight: "600", color: "#444", width: 150 },
  detailValue: { fontSize: 14, color: "#333", flexShrink: 1 },
  noteBox: { backgroundColor: "#fdf0f7", borderRadius: 12, padding: 12, marginTop: 12 },
  noteLabel: { fontSize: 14, fontWeight: "700", color: "#c20884", marginBottom: 4 },
  noteText: { fontSize: 14, color: "#333", lineHeight: 20 },
  requiredText: { fontSize: 14, color: "#c20884", fontWeight: "600", marginBottom: 12 },
  uploadButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#c20884", padding: 12, borderRadius: 12, gap: 8 },
  uploadText: { color: "#c20884", fontSize: 14, fontWeight: "600" },
  mediaPreview: { width: 80, height: 80, borderRadius: 12, marginRight: 8 },
  commentInput: { borderWidth: 1, borderColor: "#ccc", borderRadius: 12, padding: 10, marginTop: 12, minHeight: 60, textAlignVertical: "top" },
  submitButton: { backgroundColor: "#c20884", padding: 14, borderRadius: 25, marginTop: 12, alignItems: "center" },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  cancelButton: { marginTop: 10, backgroundColor: "#d11d35ff", paddingVertical: 14, borderRadius: 25, alignItems: "center" },
  cancelText: { fontSize: 16, fontWeight: "600", color: "#fff" },
});
