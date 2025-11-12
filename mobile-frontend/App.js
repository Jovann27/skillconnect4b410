import { useState, useEffect, useRef } from "react";
import { Platform, Alert, TouchableOpacity, View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useMainContext } from "./contexts/MainContext";

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

// Check if notifications are available
const notificationsAvailable = !!Notifications && typeof Notifications.getPermissionsAsync === 'function';

// Import all your screens
import Login from "./screens/auth/Login";
import ForgotPassword from "./screens/auth/ForgotPassword";
import Register from "./screens/auth/Register";
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
import RecordsScreen from "./screens/records/Records";
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
import { MainProvider } from "./contexts/MainContext";

// Role-based screen guard component
const RoleGuardedScreen = ({ allowedRoles, component: Component, fallbackMessage, ...props }) => {
  const { user } = useMainContext();
  const userRole = user?.role;

  if (!allowedRoles.includes(userRole)) {
    // Return a component that shows the fallback message
    const FallbackComponent = () => (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 }}>
          {fallbackMessage?.title || 'Access Restricted'}
        </Text>
        <Text style={{ fontSize: 16, textAlign: 'center', color: '#666' }}>
          {fallbackMessage?.message || 'You do not have permission to access this feature.'}
        </Text>
      </View>
    );
    return <FallbackComponent />;
  }

  return <Component {...props} />;
};

const Stack = createNativeStackNavigator();

// Configure notification behavior when app is foregrounded
if (notificationsAvailable) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState("");
  const notificationListener = useRef();
  const responseListener = useRef();

  // Register device for push notifications
  async function registerForPushNotificationsAsync() {
    if (!notificationsAvailable) {
      console.log("Notifications not available");
      return;
    }

    let token;
    if (Device.isDevice) {
      try {
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
      } catch (error) {
        console.log("Error registering for push notifications:", error);
      }
    } else {
      Alert.alert("Must use physical device for Push Notifications");
    }

    if (Platform.OS === "android") {
      try {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      } catch (error) {
        console.log("Error setting notification channel:", error);
      }
    }

    return token;
  }

  useEffect(() => {
    if (notificationsAvailable) {
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
        if (notificationListener.current && Notifications.removeNotificationSubscription) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current && Notifications.removeNotificationSubscription) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
      };
    }
  }, []);

  return (
    <MainProvider>
      <NavigationContainer>
        <CustomDrawer>
          {(toggleDrawer) => (
            <Stack.Navigator
            // Global settings for all screens
            screenOptions={{
              headerShown: true,
              headerTitleAlign: "center",
              headerTitleStyle: { fontSize: 17 },
              headerLeft: () => (
                <TouchableOpacity
                  onPress={toggleDrawer}
                  style={{ marginLeft: 10 }}
                >
                  <Ionicons name="menu" size={24} color="#000" />
                </TouchableOpacity>
              ),
            }}
          >
            {/* Authentication Required Screens */}
            <Stack.Screen name="Home">
              {(props) => (
                <RoleGuardedScreen
                  allowedRoles={["Community Member", "Service Provider", "Service Provider Applicant"]}
                  component={Home}
                  fallbackMessage={{
                    title: "Authentication Required",
                    message: "Please login to access the home screen."
                  }}
                  {...props}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="Login">
              {(props) => <Login {...props} setIsLoggedIn={setIsLoggedIn} />}
            </Stack.Screen>
            <Stack.Screen name="Register" component={Register} />

            <Stack.Screen name="Settings">
              {(props) => (
                <RoleGuardedScreen
                  allowedRoles={["Community Member", "Service Provider", "Service Provider Applicant"]}
                  component={(props) => <Settings {...props} setIsLoggedIn={setIsLoggedIn} />}
                  fallbackMessage={{
                    title: "Authentication Required",
                    message: "Please login to access settings."
                  }}
                  {...props}
                />
              )}
            </Stack.Screen>

            {/* Profile Management - Authentication Required */}
            <Stack.Screen
              name="EditFirstName"
              options={{
                presentation: "transparentModal",
                headerShown: false,
                animation: "fade",
                animationDuration: 200,
              }}
            >
              {(props) => (
                <RoleGuardedScreen
                  allowedRoles={["Community Member", "Service Provider", "Service Provider Applicant"]}
                  component={EditFirstName}
                  fallbackMessage={{
                    title: "Authentication Required",
                    message: "Please login to edit your profile."
                  }}
                  {...props}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="EditLastName"
              options={{
                presentation: "transparentModal",
                headerShown: false,
                animation: "fade",
                animationDuration: 200,
              }}
            >
              {(props) => (
                <RoleGuardedScreen
                  allowedRoles={["Community Member", "Service Provider", "Service Provider Applicant"]}
                  component={EditLastName}
                  fallbackMessage={{
                    title: "Authentication Required",
                    message: "Please login to edit your profile."
                  }}
                  {...props}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="VerifyPhoneForPassword"
              component={VerifyPhoneForPassword}
              options={{ headerShown: false }}
            />
            {/* Role-guarded screens */}
            <Stack.Screen
              name="PlaceOrder"
              options={{ headerTitle: "Place Order", headerTitleStyle: { fontSize: 17 } }}
            >
              {(props) => (
                <RoleGuardedScreen
                  allowedRoles={["Community Member", "Service Provider", "Service Provider Applicant"]}
                  component={PlaceOrder}
                  fallbackMessage={{
                    title: "Application Under Review",
                    message: "Your application to become a Service Provider is being reviewed. You can place orders once approved."
                  }}
                  {...props}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="ProfileReviews"
              options={{ headerTitle: "Profile", headerTitleStyle: { fontSize: 17 } }}
            >
              {(props) => (
                <RoleGuardedScreen
                  allowedRoles={["Community Member", "Service Provider", "Service Provider Applicant"]}
                  component={ProfileReviews}
                  fallbackMessage={{
                    title: "Authentication Required",
                    message: "Please login to view profile reviews."
                  }}
                  {...props}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="Service"
              options={{ headerTitle: "My Service", headerTitleStyle: { fontSize: 17 } }}
            >
              {(props) => (
                <RoleGuardedScreen
                  allowedRoles={["Service Provider"]}
                  component={Service}
                  fallbackMessage={{
                    title: "Access Restricted",
                    message: "Only approved Service Providers can access this feature."
                  }}
                  {...props}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="Records"
              options={{ headerTitle: "Records", headerTitleStyle: { fontSize: 17 } }}
            >
              {(props) => (
                <RoleGuardedScreen
                  allowedRoles={["Community Member", "Service Provider", "Service Provider Applicant"]}
                  component={RecordsScreen}
                  fallbackMessage={{
                    title: "Application Under Review",
                    message: "Your application to become a Service Provider is being reviewed."
                  }}
                  {...props}
                />
              )}
            </Stack.Screen>

            <Stack.Screen
              name="Workers"
              options={{ headerTitle: "Workers", headerTitleStyle: { fontSize: 17 } }}
            >
              {(props) => (
                <RoleGuardedScreen
                  allowedRoles={["Community Member", "Service Provider", "Service Provider Applicant"]}
                  component={Workers}
                  fallbackMessage={{
                    title: "Application Under Review",
                    message: "Your application to become a Service Provider is being reviewed."
                  }}
                  {...props}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="WaitingForWorker"
              options={{ headerTitle: "Waiting for Worker", headerTitleStyle: { fontSize: 17 } }}
            >
              {(props) => (
                <RoleGuardedScreen
                  allowedRoles={["Community Member", "Service Provider", "Service Provider Applicant"]}
                  component={WaitingForWorker}
                  fallbackMessage={{
                    title: "Application Under Review",
                    message: "Your application to become a Service Provider is being reviewed."
                  }}
                  {...props}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="Chat"
              options={{ headerShown: false }}
            >
              {(props) => (
                <RoleGuardedScreen
                  allowedRoles={["Community Member", "Service Provider", "Service Provider Applicant"]}
                  component={Chat}
                  fallbackMessage={{
                    title: "Authentication Required",
                    message: "Please login to access chat features."
                  }}
                  {...props}
                />
              )}
            </Stack.Screen>

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
                <RoleGuardedScreen
                  allowedRoles={["Community Member", "Service Provider", "Service Provider Applicant"]}
                  component={(props) => <Profile {...props} setIsLoggedIn={setIsLoggedIn} />}
                  fallbackMessage={{
                    title: "Authentication Required",
                    message: "Please login to access your profile."
                  }}
                  {...props}
                />
              )}
            </Stack.Screen>

            <Stack.Screen
              name="ClientAccepted"
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
            >
              {(props) => (
                <RoleGuardedScreen
                  allowedRoles={["Service Provider"]}
                  component={ClientAccepted}
                  fallbackMessage={{
                    title: "Access Restricted",
                    message: "Only approved Service Providers can access client information."
                  }}
                  {...props}
                />
              )}
            </Stack.Screen>

            <Stack.Screen
              name="EditEmail"
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
            >
              {(props) => (
                <RoleGuardedScreen
                  allowedRoles={["Community Member", "Service Provider", "Service Provider Applicant"]}
                  component={EditEmail}
                  fallbackMessage={{
                    title: "Authentication Required",
                    message: "Please login to edit your email."
                  }}
                  {...props}
                />
              )}
            </Stack.Screen>

            <Stack.Screen
              name="PhoneVerification"
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
            >
              {(props) => (
                <RoleGuardedScreen
                  allowedRoles={["Community Member", "Service Provider", "Service Provider Applicant"]}
                  component={PhoneVerification}
                  fallbackMessage={{
                    title: "Authentication Required",
                    message: "Please login to change your phone number."
                  }}
                  {...props}
                />
              )}
            </Stack.Screen>

            <Stack.Screen
              name="Clients"
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
            >
              {(props) => (
                <RoleGuardedScreen
                  allowedRoles={["Service Provider"]}
                  component={Clients}
                  fallbackMessage={{
                    title: "Access Restricted",
                    message: "Only approved Service Providers can access client information."
                  }}
                  {...props}
                />
              )}
            </Stack.Screen>

            <Stack.Screen
              name="OrderDetails"
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
            >
              {(props) => (
                <RoleGuardedScreen
                  allowedRoles={["Community Member", "Service Provider", "Service Provider Applicant"]}
                  component={OrderDetails}
                  fallbackMessage={{
                    title: "Authentication Required",
                    message: "Please login to view order details."
                  }}
                  {...props}
                />
              )}
            </Stack.Screen>

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
              name="Notification"
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
            >
              {(props) => (
                <RoleGuardedScreen
                  allowedRoles={["Community Member", "Service Provider", "Service Provider Applicant"]}
                  component={Notification}
                  fallbackMessage={{
                    title: "Authentication Required",
                    message: "Please login to view notifications."
                  }}
                  {...props}
                />
              )}
            </Stack.Screen>

            <Stack.Screen
              name="Favourites"
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
            >
              {(props) => (
                <RoleGuardedScreen
                  allowedRoles={["Community Member", "Service Provider", "Service Provider Applicant"]}
                  component={Favourites}
                  fallbackMessage={{
                    title: "Authentication Required",
                    message: "Please login to view your favourites."
                  }}
                  {...props}
                />
              )}
            </Stack.Screen>

            <Stack.Screen
              name="Blocked"
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
            >
              {(props) => (
                <RoleGuardedScreen
                  allowedRoles={["Community Member", "Service Provider", "Service Provider Applicant"]}
                  component={Blocked}
                  fallbackMessage={{
                    title: "Authentication Required",
                    message: "Please login to view blocked users."
                  }}
                  {...props}
                />
              )}
            </Stack.Screen>

            <Stack.Screen
              name="BlockedWorker"
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
            >
              {(props) => (
                <RoleGuardedScreen
                  allowedRoles={["Community Member", "Service Provider", "Service Provider Applicant"]}
                  component={BlockedWorker}
                  fallbackMessage={{
                    title: "Authentication Required",
                    message: "Please login to view blocked workers."
                  }}
                  {...props}
                />
              )}
            </Stack.Screen>
          </Stack.Navigator>
        )}
      </CustomDrawer>
    </NavigationContainer>
    </MainProvider>
  );
}
