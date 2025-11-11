import React, { useState } from "react";
import {View,Text,TouchableOpacity,StyleSheet,ScrollView,Image,} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { notifyUserDataChange } from "../../utils/storageEvents";


export default function Profile({ navigation }) {
  const [profilePic, setProfilePic] = useState(null);

  const user = {
    firstName: "Jeremy",
    lastName: "Albuera",
    phone: "+63 912****789",
    email: "m*********@gmail.com",
  };

  const pickImage = async () => {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissionResult.granted) {
    alert("Permission to access photos is required!");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled) {
    const newProfilePic = result.assets[0].uri;
    setProfilePic(newProfilePic);

    // ✅ Save to AsyncStorage for persistent + shared access
    try {
      const storedUser = await AsyncStorage.getItem("userData");
      const userData = storedUser ? JSON.parse(storedUser) : {};

      const updatedUser = {
        ...userData,
        profilePic: newProfilePic,
      };

      await AsyncStorage.setItem("userData", JSON.stringify(updatedUser));

      // ✅ Instantly refresh drawer UI
      notifyUserDataChange();

    } catch (error) {
      console.log("Error saving profile image:", error);
    }
  }
};

  return (
    <ScrollView style={styles.container}>

      {/* Profile Picture Row */}
      <TouchableOpacity
        style={styles.profileRow}
        activeOpacity={0.8}
        onPress={pickImage}
      >
        <View style={styles.profileImageContainer}>
          <Image
            source={
              profilePic
                ? { uri: profilePic }
                : require("../../assets/default-profile.png") // make sure file name matches yours
            }
            style={styles.profileImage}
          />
          <View style={styles.cameraIconContainer}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate("EditFirstName")}
      >
        <Text style={styles.label}>First name</Text>
        <View style={styles.right}>
          <Text style={styles.value}>{user.firstName}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate("EditLastName")}
      >
        <Text style={styles.label}>Last name</Text>
        <View style={styles.right}>
          <Text style={styles.value}>{user.lastName}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate("PhoneVerification")}
      >
        <Text style={styles.label}>Phone</Text>
        <View style={styles.right}>
          <Text style={styles.value}>{user.phone}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate("EditEmail")}
      >
        <Text style={styles.label}>Email</Text>
        <View style={styles.right}>
          <Text style={styles.value}>{user.email}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>
      </TouchableOpacity>


      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => alert("Delete account feature coming soon!")}
      >
        <Text style={styles.deleteText}>Delete Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  // Profile Row
  profileRow: {
    flexDirection: "row",
    justifyContent: "center", 
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#ffffffff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#333",
    borderRadius: 10,
    padding: 3,
  },
  userName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
  },
  changeText: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },

  // Info Section
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
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
  },
  label: { fontSize: 14, paddingVertical: 16, color: "#333" },
  right: {
    flexDirection: "row",
    alignItems: "center",
  },
  value: {
    fontSize: 14,
    color: "#555",
    marginRight: 7,
  },
  deleteBtn: { marginTop: 30, alignItems: "center" },
  deleteText: { color: "red", fontSize: 16, fontWeight: "600" },
});
