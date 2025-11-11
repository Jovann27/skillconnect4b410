import { useState, useEffect, useRef } from "react";
import { Platform, Alert, TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

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
            {/* Regular Screens */}
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="Login">
              {(props) => <Login {...props} setIsLoggedIn={setIsLoggedIn} />}
            </Stack.Screen>
            <Stack.Screen name="Register" component={Register} />
            <Stack.Screen name="Settings">
              {(props) => <Settings {...props} setIsLoggedIn={setIsLoggedIn} />}
            </Stack.Screen>

            <Stack.Screen
              name="EditFirstName"
              component={EditFirstName}
              options={{
                presentation: "transparentModal",
                headerShown: false,
                animation: "fade",
                animationDuration: 200,
              }}
            />
            <Stack.Screen
              name="EditLastName"
              component={EditLastName}
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
              component={PlaceOrder}
              options={{ headerTitle: "Place Order", headerTitleStyle: { fontSize: 17 } }}
            />
            <Stack.Screen
              name="ProfileReviews"
              component={ProfileReviews}
              options={{ headerTitle: "Profile", headerTitleStyle: { fontSize: 17 } }}
            />
            <Stack.Screen
              name="Service"
              component={Service}
              options={{ headerTitle: "My Service", headerTitleStyle: { fontSize: 17 } }}
            />
            <Stack.Screen name="Records" component={RecordsScreen} />
           
            <Stack.Screen
              name="Workers"
              component={Workers}
              options={{ headerTitle: "Workers", headerTitleStyle: { fontSize: 17 } }}
            />
            <Stack.Screen name="WaitingForWorker" component={WaitingForWorker} />
            <Stack.Screen name="Chat" component={Chat} options={{ headerShown: false }} />

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
              {(props) => <Profile {...props} setIsLoggedIn={setIsLoggedIn} />}
            </Stack.Screen>

            <Stack.Screen
              name="ClientAccepted"
              component={ClientAccepted}
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
              component={EditEmail}
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
              component={PhoneVerification}
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
              component={Clients}
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
              component={OrderDetails}
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
              name="Notification"
              component={Notification}
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
              component={Favourites}
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
              component={Blocked}
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
              component={BlockedWorker}
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
          </Stack.Navigator>
        )}
      </CustomDrawer>
    </NavigationContainer>
    </MainProvider>
  );
}
