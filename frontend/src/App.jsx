import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  Outlet,
} from "react-router-dom";
import { useMainContext } from "./mainContext";
import NotificationListener from "./components/NotificationListener";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
import VerifyEmail from "./components/Auth/VerifyEmail";
import ResetPassword from "./components/Auth/ResetPassword";
import AdminLogin from "./components/Auth/AdminLogin";

// Admin pages
import AdminDashboard from "./components/Admin/AdminDashboard";
import ServiceProviders from "./components/Admin/WorkersData";
import JobFairs from "./components/Admin/JobFairs";
import ReviewServiceRequest from "./components/Admin/ReviewServiceRequest";
import UserManagement from "./components/Admin/UserManagement";
import SystemAnalytics from "./components/Admin/SystemAnalytics";
import BookedService from "./components/Admin/BookedService";
import SkillCategories from "./components/Admin/SkillCategories"
import AdminSettings from "./components/Admin/AdminSettings";
import AdminRegister from "./components/Admin/AdminRegister";


// User pages
import MyService from "./components/SkilledUSer/MyService";
import ServiceRequest from "./components/SkilledUSer/ServiceRequest";
import UserWorkRecords from "./components/SkilledUSer/UserRecords";
import UserRequest from "./components/SkilledUSer/UsersRequest";
import ManageProfile from "./components/SkilledUSer/ManageProfile";
import WaitingForWorker from "./components/SkilledUSer/WaitingForWorker";
import AcceptedRequest from "./components/SkilledUSer/AcceptedRequest";
import Settings from "./components/SkilledUSer/Settings";

import ErrorBoundary from "./components/Layout/ErrorBoundary";
import { PopupProvider } from "./components/Layout/PopupContext";
import TopSkilledUsers from "./components/Admin/TopSkilledUsers";

const AppContent = () => {
  const { isAuthorized, tokenType, authLoaded, user, admin } = useMainContext();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = isAuthorized && tokenType === "admin";
  const isUser = isAuthorized && tokenType === "user";



  useEffect(() => {
    if (!authLoaded) return;

    // Don't redirect if user is on login/register pages
    const isOnAuthPage = location.pathname === "/login" ||
                        location.pathname === "/register" ||
                        location.pathname === "/admin/login" ||
                        location.pathname === "/forgot-password" ||
                        location.pathname === "/verify-email" ||
                        location.pathname === "/reset-password";

    if (isAuthorized && !isOnAuthPage) {
      if (isAdmin && !location.pathname.startsWith("/admin")) {
        const lastPath = localStorage.getItem("adminLastPath");
        if (lastPath && lastPath.startsWith("/admin/")) {
          navigate(lastPath, { replace: true });
        } else {
          navigate("/admin/analytics", { replace: true });
        }
      } else if (isUser && location.pathname === "/") {
        const lastPath = localStorage.getItem("userLastPath");
        if (lastPath && lastPath.startsWith("/user/")) {
          navigate(lastPath, { replace: true });
        } else {
          navigate("/user/my-service", { replace: true });
        }
      }
    }
  }, [isAuthorized, location.pathname, navigate, isAdmin, isUser, authLoaded]);

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin/login" element={<AdminLogin />} />
      

        {/* User Routes */}
        <Route
          path="/user/*"
          element={isUser ? <Outlet /> : <Navigate to="/login" />}
        >
          <Route index element={<MyService />} />
          <Route path="dashboard" element={<MyService />} />
          <Route path="my-service" element={<MyService />} />
          <Route path="request-service" element={<ServiceRequest />} />
          <Route path="records" element={<UserWorkRecords />} />
          <Route path="users-request" element={<UserRequest />} />
          <Route path="manage-profile" element={<ManageProfile />} />
          <Route path="waiting-for-worker" element={<WaitingForWorker />} />
          <Route path="accepted-request" element={<AcceptedRequest />} />
          <Route path="general-settings" element={<Settings />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={isAdmin ? <AdminDashboard /> : <Navigate to="/admin/login" />}
        >
          <Route index element={<Navigate to="/admin/analytics" />} />
          <Route path="analytics" element={<SystemAnalytics />} />
          <Route path="service-providers" element={<ServiceProviders />} />
          <Route path="jobfairs" element={<JobFairs />} />
          <Route path="service-requests" element={<ReviewServiceRequest />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="admin-register" element={<AdminRegister />} />
          <Route path="admin-settings" element={<AdminSettings />} />
          <Route path="top-skilled-users" element={<TopSkilledUsers />} />
          <Route path="booked-service" element={<BookedService />} />
          <Route path="skill-category" element={<SkillCategories />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {/* Hide main footer for user dashboard */}
      {!isAdmin && !isUser && <Footer />}

      {/* Real-time notification listener */}
      <NotificationListener user={isUser ? user : admin} />
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <PopupProvider>
      <Router>
        <AppContent />
        <ToastContainer />
      </Router>
    </PopupProvider>
  </ErrorBoundary>
);

export default App;
