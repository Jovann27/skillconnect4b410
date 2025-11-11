import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import apiClient from "../api";

const { width } = Dimensions.get("window");

export default function ProfileReviews({ route, navigation }) {
  const [reviews, setReviews] = useState([]);
  const userId = route.params?.userId || "123";
  const fromFavorites = route.params?.fromFavorites || false;

  const fetchReviews = async () => {
    try {
      const response = await apiClient.get(`/reviews/user/${userId}`);
      setReviews(response.data);
    } catch (error) {
      console.log("Error fetching reviews:", error);

      // fallback data (some with photos, some without)
      setReviews([
        {
          id: "1",
          clientName: "Jeremy Alburea",
          service: "Plumbing",
          rating: 4,
          comment:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean commodo ligula eget dolor.",
          images: [], // no photo uploaded
        },
        {
          id: "2",
          clientName: "Darlene Faith",
          service: "Electrical",
          rating: 5,
          comment:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean massa.",
          images: ["https://via.placeholder.com/150"], // has images
        },
      ]);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={16}
          color="#f1c40f"
        />
      );
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  const renderReview = ({ item }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <Image
          source={require("../assets/default-profile.png")}
          style={styles.clientProfileImage}
        />
        <View style={{ marginLeft: 8 }}>
          <Text style={styles.clientName}>{item.clientName}</Text>
          <Text style={styles.clientService}>{item.service}</Text>
        </View>
      </View>

      <View style={{ marginTop: 6 }}>{renderStars(item.rating)}</View>

      <Text style={styles.commentText}>{item.comment}</Text>

      {item.images && item.images.length > 0 && (
        <View style={styles.imagesRow}>
          {item.images.map((imgUrl, idx) => (
            <Image key={idx} source={{ uri: imgUrl }} style={styles.reviewImage} />
          ))}
        </View>
      )}

      <View style={styles.divider} />
    </View>
  );

  const handleButtonPress = () => {
    if (fromFavorites) {
      Alert.alert("Removed", "Worker has been removed from your favorites.");
      // You can add API logic here to remove favorite
    } else {
      navigation.navigate("Profile");
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Worker Profile Header */}
      <View style={styles.profileHeader}>
        <Image
          source={require("../assets/default-profile.png")}
          style={styles.workerProfileImage}
        />
        <Text style={styles.workerName}>Juan Dela Cruz</Text>
        <Text style={styles.workerSkills}>Plumbing • Electrical</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={16} color="#f1c40f" />
            <Text style={styles.statText}>4.8 Rating</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statText}>3 Job Orders</Text>
          </View>
        </View>

        {/* ✅ Dynamic Button (Edit Profile or Unfavorite Worker) */}
        <TouchableOpacity
          style={[
            styles.editButton,
            fromFavorites && { backgroundColor: "#f87171" }, // red if from favorites
          ]}
          onPress={handleButtonPress}
        >
          <Text
            style={[
              styles.editButtonText,
              fromFavorites && { color: "#fff" },
            ]}
          >
            {fromFavorites ? "Unfavorite Worker" : "Edit Profile"}
          </Text>
        </TouchableOpacity>

        {/* Divider below button */}
        <View style={styles.divider} />
      </View>

      {/* Reviews Section */}
      <View style={styles.reviewsSection}>
        <Text style={styles.reviewsTitle}>Reviews</Text>
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={renderReview}
          scrollEnabled={false}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  /* HEADER */
  profileHeader: {
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  workerProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  workerName: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
  },
  workerSkills: {
    fontSize: 14,
    color: "#666",
  },

  statsRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
  },
  statText: {
    marginLeft: 5,
    color: "#444",
  },
  editButton: {
    marginTop: 10,
    backgroundColor: "#e5e5e5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },

  /* REVIEWS */
  reviewsSection: {
    padding: 12,
  },
  reviewsTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  reviewItem: {
    paddingVertical: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  clientProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  clientName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
  clientService: {
    fontSize: 12,
    color: "#777",
  },
  starsRow: {
    flexDirection: "row",
  },
  commentText: {
    fontSize: 13,
    color: "#444",
    marginTop: 4,
  },
  imagesRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  reviewImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 6,
  },
  divider: {
    height: 1,
    backgroundColor: "#dbdadaff",
    width: "100%",
    alignSelf: "center",
    marginTop: 15,
  },
});