import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useMainContext } from "./mainContext";

// Layout
import Navbar from "./components/Layout/Navbar";
import Footer from "./components/Layout/Footer";

// Home pages
import Home from "./components/Home/Home";
import About from "./components/About/About";

// Auth pages
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import ForgotPassword from "./components/Auth/ForgotPassword";
import AdminLogin from "./components/Auth/AdminLogin";
import AdminRegister from "./components/Admin/AdminRegister";

// Admin pages
import AdminDashboard from "./components/Admin/AdminDashboard";
import ServiceProviders from "./components/Admin/WorkersData";
import JobFairs from "./components/Admin/JobFairs";
import ReviewServiceRequest from "./components/Admin/ReviewServiceRequest";
import UserVerification from "./components/Admin/UserVerification";
import SytemAnalytics from "./components/Admin/SytemAnalytics";

// User pages
import MyService from "./components/SkilledUSer/MyService";
import UserDashboard from "./components/SkilledUSer/UserDashboard";
import ServiceRequest from "./components/SkilledUSer/ServiceRequest";
import UserWorkRecords from "./components/SkilledUSer/UserRecords";
import UserSettings from "./components/SkilledUSer/UserSettings";
import Help from "./components/SkilledUSer/Help";
import UserRequest from "./components/SkilledUSer/UsersRequest";
import ManageProfile from "./components/SkilledUSer/ManageProfile";
import WaitingForWorker from "./components/SkilledUSer/WaitingForWorker";
import AcceptedRequest from "./components/SkilledUSer/AcceptedRequest";

import ErrorBoundary from "./components/Layout/ErrorBoundary";
import { PopupProvider } from "./components/Layout/PopupContext";

const AppContent = () => {
  const { isAuthorized, tokenType, authLoaded } = useMainContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const isAdmin = isAuthorized && tokenType === "admin";
  const isUser = isAuthorized && tokenType === "user";



  useEffect(() => {
    if (
      isAuthorized &&
      !location.pathname.includes("/login") &&
      !location.pathname.includes("/register") &&
      location.pathname !== "/"
    ) {
      sessionStorage.setItem("lastPath", location.pathname);
    }
  }, [location.pathname, isAuthorized]);

  useEffect(() => {
    if (isAuthorized && location.pathname === "/") {
      const lastPath = sessionStorage.getItem("lastPath");
      if (lastPath) navigate(lastPath);
      else navigate(isAdmin ? "/admin/dashboard" : "/user/my-service");
    }
  }, [isAuthorized, location.pathname, navigate, isAdmin]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [location]);

  // Set up navigation function for context to use
  useEffect(() => {
    window.userNavigateFunction = navigate;
    return () => {
      delete window.userNavigateFunction;
    };
  }, [navigate]);


  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/register"
          element={
            isAuthorized && isAdmin ? (
              <Navigate to="/admin/dashboard" />
            ) : (
              <AdminRegister />
            )
          }
        />

        {/* User Routes */}
        <Route
          path="/user/*"
          element={isUser ? <UserDashboard /> : <Navigate to="/login" />}
        >
          <Route index element={<MyService />} />
          <Route path="my-service" element={<MyService />} />
          <Route path="request-service" element={<ServiceRequest />} />
          <Route path="records" element={<UserWorkRecords />} />
          <Route path="settings" element={<UserSettings />} />
          <Route path="help" element={<Help />} />
          <Route path="users-request" element={<UserRequest />} />
          <Route path="manage-profile" element={<ManageProfile />} />
          <Route path="waiting-for-worker" element={<WaitingForWorker />} />
          <Route path="accepted-request" element={<AcceptedRequest />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={isAdmin ? <AdminDashboard /> : <Navigate to="/admin/login" />}
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="service-providers" element={<ServiceProviders />} />
          <Route path="jobfairs" element={<JobFairs />} />
          <Route path="service-requests" element={<ReviewServiceRequest />} />
          <Route path="users" element={<UserVerification />} />
          <Route path="analytics" element={<SytemAnalytics />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {/* Hide main footer for user dashboard */}
      {!isAdmin && !isUser && <Footer />}
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <PopupProvider>
      <Router>
        <AppContent />
      </Router>
    </PopupProvider>
  </ErrorBoundary>
);

export default App;
