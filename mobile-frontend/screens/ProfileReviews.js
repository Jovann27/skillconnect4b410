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
  const [userProfile, setUserProfile] = useState(null);
  const userId = route.params?.userId || "123";
  const fromFavorites = route.params?.fromFavorites || false;

  const fetchUserProfile = async () => {
    try {
      const response = await apiClient.get(`/user/profile/${userId}`);
      if (response.data.success) {
        setUserProfile(response.data.user);
      }
    } catch (error) {
      console.log("Error fetching user profile:", error);
      // Keep default profile data
    }
  };

  const fetchReviewStats = async () => {
    try {
      const response = await apiClient.get(`/reviews/stats/${userId}`);
      if (response.data.success) {
        const stats = response.data.stats;
        setUserProfile(prev => prev ? { ...prev, ...stats } : stats);
      }
    } catch (error) {
      console.log("Error fetching review stats:", error);
      // Keep default stats
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await apiClient.get(`/reviews/user/${userId}`);
      if (response.data.success) {
        setReviews(response.data.reviews);
      } else {
        throw new Error("Failed to fetch reviews");
      }
    } catch (error) {
      console.log("Error fetching reviews:", error);
      setReviews([]); // Set empty array when no reviews available
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchReviewStats();
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
          source={
            userProfile?.profilePic
              ? { uri: userProfile.profilePic }
              : require("../assets/default-profile.png")
          }
          style={styles.workerProfileImage}
        />
        <Text style={styles.workerName}>
          {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : "Juan Dela Cruz"}
        </Text>
        <Text style={styles.workerSkills}>
          {userProfile?.skills?.length > 0 ? userProfile.skills.join(" • ") : "Plumbing • Electrical"}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={16} color="#f1c40f" />
            <Text style={styles.statText}>
              {userProfile?.averageRating ? `${userProfile.averageRating} Rating` : "4.8 Rating"}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statText}>
              {userProfile?.totalReviews ? `${userProfile.totalReviews} Reviews` : "3 Job Orders"}
            </Text>
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
        {reviews.length === 0 ? (
          <Text style={styles.noReviewsText}>No reviews yet</Text>
        ) : (
          <FlatList
            data={reviews}
            keyExtractor={(item) => item.id}
            renderItem={renderReview}
            scrollEnabled={false}
          />
        )}
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
  noReviewsText: {
    textAlign: "center",
    color: "#777",
    fontSize: 16,
    marginTop: 20,
    fontStyle: "italic",
  },
});
