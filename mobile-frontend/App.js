import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Platform, Alert, TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MainProvider } from "./contexts/MainContext";

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

// Import all your screens
import Login from "./screens/auth/Login";
import ForgotPassword from "./screens/auth/ForgotPassword";
import Register from "./screens/auth/Register";
import ResetPassword from "./screens/auth/ResetPassword";
import Home from "./screens/home/Home";
import Settings from "./screens/Settings";
import Profile from "./screens/profile/Profile";
import EditFirstName from "./screens/profile/EditFirstName";
import EditLastName from "./screens/profile/EditLastName";
import EditEmail from "./screens/profile/EditEmail";
import PhoneVerification from "./screens/auth/PhoneVerification";
import VerifyPhoneForPassword from "./screens/auth/VerifyPhoneForPassword";
import Notification from "./screens/Notification";
import TermsPolicies from "./screens/TermsPolicies";
import PlaceOrder from "./screens/PlaceOrder";
import WaitingForWorker from "./screens/WaitingForWorker";
import Records from "./screens/records/Records";
import Workers from "./screens/Workers";
import Clients from "./screens/Clients";
import Favourites from "./screens/Favourites";
import Blocked from "./screens/Blocked";
import Service from "./screens/Service";
import ClientAccepted from "./screens/ClientAccepted";
import Chat from "./screens/Chat";
import ProfileReviews from "./screens/ProfileReviews";
import OrderDetails from "./screens/records/OrderDetails";
import BlockedWorker from "./screens/BlockedWorker";
import CustomDrawer from "./components/CustomDrawer";
import GiveReview from "./screens/GiveReview";
import NotificationScreen from "./screens/NotificationScreen";
import RoleGuard, { withRoleGuard } from "./components/RoleGuard";
import AboutUs from "./screens/AboutUs";
import TermsScreen from "./screens/TermsScreen";
import PrivacyScreen from "./screens/PrivacyScreen";

const Stack = createNativeStackNavigator();

const SERVICE_FLOW_ROLES = ["Community Member", "Service Provider", "Service Provider Applicant"];
const PROVIDER_ONLY_ROLES = ["Service Provider"];

const GuardedPlaceOrder = withRoleGuard(PlaceOrder, {
  allowedRoles: SERVICE_FLOW_ROLES,
  fallbackRoute: "Home",
});
const GuardedWaitingForWorker = withRoleGuard(WaitingForWorker, {
  allowedRoles: SERVICE_FLOW_ROLES,
  fallbackRoute: "Home",
});
const GuardedRecords = withRoleGuard(Records, {
  allowedRoles: SERVICE_FLOW_ROLES,
  fallbackRoute: "Home",
});
const GuardedOrderDetails = withRoleGuard(OrderDetails, {
  allowedRoles: SERVICE_FLOW_ROLES,
  fallbackRoute: "Records",
});
const GuardedProfileReviews = withRoleGuard(ProfileReviews, {
  fallbackRoute: "Home",
});
const GuardedService = withRoleGuard(Service, {
  allowedRoles: PROVIDER_ONLY_ROLES,
  fallbackRoute: "Home",
});
const GuardedClients = withRoleGuard(Clients, {
  allowedRoles: PROVIDER_ONLY_ROLES,
  fallbackRoute: "Home",
});
const GuardedClientAccepted = withRoleGuard(ClientAccepted, {
  allowedRoles: PROVIDER_ONLY_ROLES,
  fallbackRoute: "Home",
});
const GuardedBlockedWorker = withRoleGuard(BlockedWorker, {
  allowedRoles: PROVIDER_ONLY_ROLES,
  fallbackRoute: "Home",
});
const GuardedPhoneVerification = withRoleGuard(PhoneVerification, {
  fallbackRoute: "Profile",
});
const GuardedEditEmail = withRoleGuard(EditEmail, {
  fallbackRoute: "Profile",
});
const GuardedEditFirstName = withRoleGuard(EditFirstName, {
  fallbackRoute: "Profile",
});
const GuardedEditLastName = withRoleGuard(EditLastName, {
  fallbackRoute: "Profile",
});
const GuardedWorkers = withRoleGuard(Workers, {
  fallbackRoute: "Home",
});
const GuardedChat = withRoleGuard(Chat, {
  fallbackRoute: "Home",
});
const GuardedNotificationScreen = withRoleGuard(NotificationScreen, {
  fallbackRoute: "Home",
});
const GuardedNotification = withRoleGuard(Notification, {
  fallbackRoute: "Home",
});
const GuardedFavourites = withRoleGuard(Favourites, {
  fallbackRoute: "Home",
});
const GuardedBlocked = withRoleGuard(Blocked, {
  fallbackRoute: "Home",
});
const GuardedGiveReview = withRoleGuard(GiveReview, {
  fallbackRoute: "Home",
});
const GuardedAboutUs = withRoleGuard(AboutUs, {
  fallbackRoute: "Home",
});
const GuardedTermsScreen = withRoleGuard(TermsScreen, {
  fallbackRoute: "TermsPolicies",
});
const GuardedPrivacyScreen = withRoleGuard(PrivacyScreen, {
  fallbackRoute: "TermsPolicies",
});

// Configure notification behavior when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState("");
  const notificationListener = useRef();
  const responseListener = useRef();

  // Register device for push notifications
  async function registerForPushNotificationsAsync() {
    let token;
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        Alert.alert("Failed to get push token for push notifications!");
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log("Expo Push Token:", token);
      setExpoPushToken(token);
    } else {
      Alert.alert("Must use physical device for Push Notifications");
    }

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return token;
  }

  useEffect(() => {
    registerForPushNotificationsAsync();

    // Listener fired when a notification is received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log("Notification received:", notification);
    });

    // Listener fired when user interacts with a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("Notification response:", response);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <MainProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <CustomDrawer isLoggedIn={isLoggedIn}>
            {(toggleDrawer) => (
            <Stack.Navigator
              // Global settings for all screens
              screenOptions={{
                headerShown: true,
                headerTitleAlign: "center",
                headerTitleStyle: { fontSize: 17 },
                headerShadowVisible: false,
                headerLeft: () => (
                  <TouchableOpacity onPress={toggleDrawer} style={{ marginLeft: 10 }}>
                    <Ionicons name="reorder-three" size={24} color="#000" />
                  </TouchableOpacity>
                ),
              }}
            >
            {/* Regular Screens */}
           <Stack.Screen
                name="Home"
                component={Home}
                options={({ navigation }) => ({
                  headerTitleAlign: "center",
                  headerTitleStyle: { fontSize: 17 },
                  headerShadowVisible: false,
                  headerLeft: () => (
                    <TouchableOpacity onPress={toggleDrawer} style={{ marginLeft: 10 }}>
                      <Ionicons name="reorder-three" size={24} color="#000" />
                    </TouchableOpacity>
                  ),
                  headerRight: () => (
                    <TouchableOpacity
                      onPress={() => navigation.navigate("NotificationScreen")}
                      style={{ marginRight: 15 }}
                    >
                      <Ionicons name="notifications-outline" size={24} color="#000" />
                    </TouchableOpacity>
                  ),
                })}
              />
            <Stack.Screen name="Login">
              {(props) => <Login {...props} setIsLoggedIn={setIsLoggedIn} />}
            </Stack.Screen>
            <Stack.Screen name="Register" component={Register} />
            <Stack.Screen name="Settings">
              {(props) => (
                <RoleGuard navigation={props.navigation}>
                  <Settings {...props} setIsLoggedIn={setIsLoggedIn} />
                </RoleGuard>
              )}
            </Stack.Screen>

            <Stack.Screen
              name="EditFirstName"
              component={GuardedEditFirstName}
              options={{
                presentation: "transparentModal",
                headerShown: false,
                animation: "fade",
                animationDuration: 200,
              }}
            />
            <Stack.Screen
              name="EditLastName"
              component={GuardedEditLastName}
              options={{
                presentation: "transparentModal",
                headerShown: false,
                animation: "fade",
                animationDuration: 200,
              }}
            />
            <Stack.Screen
              name="VerifyPhoneForPassword"
              component={VerifyPhoneForPassword}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PlaceOrder"
              component={GuardedPlaceOrder}
              options={{ headerTitle: "Place Order", headerTitleStyle: { fontSize: 17 } }}
            />
            <Stack.Screen
              name="ProfileReviews"
              component={GuardedProfileReviews}
              options={{ headerTitle: "Profile", headerTitleStyle: { fontSize: 17 } }}
            />
            <Stack.Screen
              name="Service"
              component={GuardedService}
              options={{ headerTitle: "My Service", headerTitleStyle: { fontSize: 17 } }}
            />
            <Stack.Screen name="Records" component={GuardedRecords} />
           
            <Stack.Screen
              name="Workers"
              component={GuardedWorkers}
              options={{ headerTitle: "Workers", headerTitleStyle: { fontSize: 17 } }}
            />
            <Stack.Screen name="WaitingForWorker" component={GuardedWaitingForWorker} />
            <Stack.Screen name="Chat" component={GuardedChat} options={{ headerShown: false }} />
            <Stack.Screen name="NotificationScreen" component={GuardedNotificationScreen} options={{ headerTitle: "Notifications" }}/>

            {/* Modified Screens */}
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPassword}
              options={({ navigation }) => ({
                headerTitle: "",
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ marginLeft: 10 }}
                  >
                    <Ionicons name="chevron-back" size={24} color="#000" />
                  </TouchableOpacity>
                ),
              })}
            />

            <Stack.Screen
              name="Profile"
              options={({ navigation }) => ({
                headerTitle: "Personal Information",
                headerTitleStyle: { fontSize: 17 },
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ marginLeft: 10 }}
                  >
                    <Ionicons name="chevron-back" size={24} color="#000" />
                  </TouchableOpacity>
                ),
              })}
            >
              {(props) => (
                <RoleGuard navigation={props.navigation}>
                  <Profile {...props} setIsLoggedIn={setIsLoggedIn} />
                </RoleGuard>
              )}
            </Stack.Screen>

            <Stack.Screen
              name="ClientAccepted"
              component={GuardedClientAccepted}
              options={({ navigation }) => ({
                headerTitle: "Accepted Client",
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ marginLeft: 10 }}
                  >
                    <Ionicons name="chevron-back" size={24} color="#000" />
                  </TouchableOpacity>
                ),
              })}
            />

            <Stack.Screen
              name="EditEmail"
              component={GuardedEditEmail}
              options={({ navigation }) => ({
                headerTitle: "Change Email",
                headerTitleStyle: { fontSize: 17 },
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ marginLeft: 10 }}
                  >
                    <Ionicons name="chevron-back" size={24} color="#000" />
                  </TouchableOpacity>
                ),
              })}
            />

            <Stack.Screen
              name="PhoneVerification"
              component={GuardedPhoneVerification}
              options={({ navigation }) => ({
                headerTitle: "Change your phone number",
                headerTitleStyle: { fontSize: 17 },
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ marginLeft: 10 }}
                  >
                    <Ionicons name="chevron-back" size={24} color="#000" />
                  </TouchableOpacity>
                ),
              })}
            />

            <Stack.Screen
              name="Clients"
              component={GuardedClients}
              options={({ navigation }) => ({
                headerTitle: "Clients",
                headerTitleStyle: { fontSize: 17 },
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ marginLeft: 10 }}
                  >
                    <Ionicons name="chevron-back" size={24} color="#000" />
                  </TouchableOpacity>
                ),
              })}
            />

            <Stack.Screen
              name="OrderDetails"
              component={GuardedOrderDetails}
              options={({ navigation }) => ({
                headerTitle: "",
                headerTitleStyle: { fontSize: 17 },
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ marginLeft: 10 }}
                  >
                    <Ionicons name="chevron-back" size={24} color="#000" />
                  </TouchableOpacity>
                ),
              })}
            />

            <Stack.Screen
              name="TermsPolicies"
              component={TermsPolicies}
              options={({ navigation }) => ({
                headerTitle: "Terms & Policies",
                headerTitleStyle: { fontSize: 17 },
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ marginLeft: 10 }}
                  >
                    <Ionicons name="chevron-back" size={24} color="#000" />
                  </TouchableOpacity>
                ),
              })}
            />
            <Stack.Screen
              name="Terms"
              component={GuardedTermsScreen}
              options={({ navigation }) => ({
                headerTitle: "Terms & Conditions",
                headerTitleStyle: { fontSize: 17 },
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ marginLeft: 10 }}
                  >
                    <Ionicons name="chevron-back" size={24} color="#000" />
                  </TouchableOpacity>
                ),
              })}
            />
            <Stack.Screen
              name="Privacy"
              component={GuardedPrivacyScreen}
              options={({ navigation }) => ({
                headerTitle: "Privacy Policy",
                headerTitleStyle: { fontSize: 17 },
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ marginLeft: 10 }}
                  >
                    <Ionicons name="chevron-back" size={24} color="#000" />
                  </TouchableOpacity>
                ),
              })}
            />
            <Stack.Screen
              name="AboutUs"
              component={GuardedAboutUs}
              options={({ navigation }) => ({
                headerTitle: "About SkillConnect",
                headerTitleStyle: { fontSize: 17 },
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ marginLeft: 10 }}
                  >
                    <Ionicons name="chevron-back" size={24} color="#000" />
                  </TouchableOpacity>
                ),
              })}
            />

            <Stack.Screen
              name="Notification"
              component={GuardedNotification}
              options={({ navigation }) => ({
                headerTitleStyle: { fontSize: 17 },
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ marginLeft: 10 }}
                  >
                    <Ionicons name="chevron-back" size={24} color="#000" />
                  </TouchableOpacity>
                ),
              })}
            />

          

            <Stack.Screen
              name="Favourites"
              component={GuardedFavourites}
              options={({ navigation }) => ({
                headerTitleStyle: { fontSize: 17 },
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ marginLeft: 10 }}
                  >
                    <Ionicons name="chevron-back" size={24} color="#000" />
                  </TouchableOpacity>
                ),
              })}
            />

            <Stack.Screen
              name="Blocked"
              component={GuardedBlocked}
              options={({ navigation }) => ({
                headerTitleStyle: { fontSize: 17 },
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ marginLeft: 10 }}
                  >
                    <Ionicons name="chevron-back" size={24} color="#000" />
                  </TouchableOpacity>
                ),
              })}
            />
            <Stack.Screen
              name="BlockedWorker"
              component={GuardedBlockedWorker}
              options={({ navigation }) => ({
                headerTitleStyle: { fontSize: 17 },
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ marginLeft: 10 }}
                  >
                    <Ionicons name="chevron-back" size={24} color="#000" />
                  </TouchableOpacity>
                ),
              })}
            />
            <Stack.Screen
              name="GiveReview"
              component={GuardedGiveReview}
              options={{
                presentation: "modal",     // FULL SCREEN MODAL
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="ResetPassword"
              component={ResetPassword}
              options={({ navigation }) => ({
                headerTitle: "Reset Password",
                headerTitleStyle: { fontSize: 17 },
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ marginLeft: 10 }}
                  >
                    <Ionicons name="chevron-back" size={24} color="#000" />
                  </TouchableOpacity>
                ),
              })}
            />

          </Stack.Navigator>
        )}
        </CustomDrawer>
      </NavigationContainer>
    </SafeAreaProvider>
  </MainProvider>
);
}
