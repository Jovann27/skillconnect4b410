import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import { useMainContext } from "../contexts/MainContext";
import apiClient from "../api";

export default function PlaceOrder() {
  const navigation = useNavigation();
  const { user } = useMainContext();

  const [name, setName] = useState(`${user?.firstName || ''} ${user?.lastName || ''}`.trim());
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [typeOfWork, setTypeOfWork] = useState("");
  const [time, setTime] = useState("");
  const [favWorker, setFavWorker] = useState(false);
  const [budget, setBudget] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  // Request location permissions on component mount
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          "Location Permission",
          "Location permission is needed to provide accurate service requests. You can still enter your address manually."
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission denied", "Location access is needed to get your current location.");
        setLocationLoading(false);
        return;
      }

      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = locationResult.coords;
      setLocation({ lat: latitude, lng: longitude });

      // Reverse geocode to get address
      await reverseGeocode(latitude, longitude);

    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert("Error", "Failed to get your location. Please try again or enter address manually.");
    } finally {
      setLocationLoading(false);
    }
  };

  const reverseGeocode = async (latitude, longitude) => {
    setGeocodingLoading(true);
    try {
      const geocodedLocation = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (geocodedLocation.length > 0) {
        const addressData = geocodedLocation[0];
        const formattedAddress = [
          addressData.street,
          addressData.district,
          addressData.city,
          addressData.region,
          addressData.postalCode,
          addressData.country,
        ].filter(Boolean).join(', ');

        setAddress(formattedAddress);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      Alert.alert("Error", "Failed to get address from location. Please enter your address manually.");
    } finally {
      setGeocodingLoading(false);
    }
  };

  const handleOrder = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your full name");
      return;
    }
    if (!address.trim()) {
      Alert.alert("Error", "Please enter your address");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }
    if (!typeOfWork) {
      Alert.alert("Error", "Please select type of work");
      return;
    }
    if (!time) {
      Alert.alert("Error", "Please select preferred time");
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        typeOfWork,
        time,
        budget: budget ? parseFloat(budget) : 0,
        notes: note.trim(),
        location: location, // Send location coordinates if available
      };

      const response = await apiClient.post('/post-service-request', requestData);

      if (response.data.success) {
        Alert.alert("Success", "Service request posted successfully!", [
          {
            text: "OK",
            onPress: () => navigation.navigate("WaitingForWorker", { orderData: requestData })
          }
        ]);
      } else {
        Alert.alert("Error", response.data.message || "Failed to post service request");
      }
    } catch (error) {
      console.error('Error posting service request:', error);
      const errorMessage = error.response?.data?.message || "Network error. Please check your connection and try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Name */}
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              placeholder="Enter your full name"
              onChangeText={setName}
            />

            {/* Address */}
            <Text style={styles.label}>Address</Text>
            <View style={styles.addressContainer}>
              <TextInput
                style={[styles.input, styles.addressInput]}
                value={address}
                placeholder="Enter your address"
                onChangeText={setAddress}
              />
              <TouchableOpacity
                style={styles.locationButton}
                onPress={getCurrentLocation}
                disabled={locationLoading || geocodingLoading}
              >
                {locationLoading || geocodingLoading ? (
                  <ActivityIndicator size="small" color="#ce4da3ff" />
                ) : (
                  <Ionicons name="location" size={20} color="#ce4da3ff" />
                )}
              </TouchableOpacity>
            </View>
            {location && (
              <>
                <Text style={styles.locationText}>
                  Location detected: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </Text>
                <MapView
                  style={styles.map}
                  region={{
                    latitude: location.lat,
                    longitude: location.lng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  showsUserLocation={true}
                  showsMyLocationButton={true}
                >
                  <Marker
                    coordinate={{
                      latitude: location.lat,
                      longitude: location.lng,
                    }}
                    title="Your Location"
                    description="Current location for service request"
                  />
                </MapView>
              </>
            )}

            {/* Phone */}
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              value={phone}
              placeholder="09xxxxxxxxx"
              onChangeText={setPhone}
              maxLength={11}
            />

            {/* Type of Work */}
            <Text style={styles.label}>Type of Work</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={typeOfWork}
                onValueChange={setTypeOfWork}
                style={styles.picker}
              >
                <Picker.Item label="Select work type" value="" />
                <Picker.Item label="Plumbing" value="Plumbing" />
                <Picker.Item label="Electrical" value="Electrical" />
                <Picker.Item label="Carpentry" value="Carpentry" />
                <Picker.Item label="Painting" value="Painting" />
                <Picker.Item label="Cleaning" value="Cleaning" />
              </Picker>
            </View>

            {/* Time */}
            <Text style={styles.label}>Preferred Time</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={time} onValueChange={setTime} style={styles.picker}>
                <Picker.Item label="Select time" value="" />
                <Picker.Item label="Morning" value="Morning" />
                <Picker.Item label="Afternoon" value="Afternoon" />
                <Picker.Item label="Evening" value="Evening" />
              </Picker>
            </View>

            {/* Favorite Worker */}
            <View style={styles.switchRow}>
              <Text style={styles.label}>Assign to favourite worker first</Text>
              <Switch
                value={favWorker}
                onValueChange={setFavWorker}
                thumbColor={favWorker ? "#ce4da3ff" : "#ccc"}
                trackColor={{ false: "#ddd", true: "#f5b0e1" }}
              />
            </View>

            {/* Budget */}
            <Text style={styles.label}>Budget (₱)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={budget}
              placeholder="Enter budget amount"
              onChangeText={setBudget}
            />

            {/* Note */}
            <Text style={styles.label}>Note to Worker</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              multiline
              placeholder="Additional instructions (optional)"
              value={note}
              onChangeText={setNote}
            />

            {/* Submit */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#ce4da3ff" }]}
              onPress={handleOrder}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {loading ? "Placing Order..." : "Place Order"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 26,
    paddingTop: 40,
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 16,
    fontSize: 14,
    backgroundColor: "#f9f9f9",
  },
  noteInput: {
    height: 90,
    textAlignVertical: "top",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 16,
    backgroundColor: "#f9f9f9",
  },
  picker: {
    height: 55,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#f9f9f9",
  },
  button: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  addressInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 10,
  },
  locationButton: {
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    width: 45,
    height: 45,
  },
  locationText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    fontStyle: "italic",
  },
  map: {
    height: 200,
    borderRadius: 10,
    marginBottom: 16,
  },
});