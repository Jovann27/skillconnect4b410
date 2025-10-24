import { createContext, useContext, useState, useEffect, useRef } from "react";
import api from "./api";
import toast from "react-hot-toast";

const MainContext = createContext({
  isAuthorized: false,
  setIsAuthorized: () => {},
  authLoaded: false,
  tokenType: null,
  setTokenType: () => {},
  user: null,
  setUser: () => {},
  admin: null,
  setAdmin: () => {},
  fetchProfile: () => {},
  logout: () => {},
});

export const MainProvider = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [tokenType, setTokenType] = useState(null);
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const initialized = useRef(false);
  const debounceTimer = useRef(null);

  const fetchProfile = async (navigate = null) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await api.get("/user/me", { withCredentials: true });
      if (response.data && response.data.success && response.data.user) {
        console.log("MainContext - User data from API:", response.data.user);
        setUser({
          ...response.data.user,
          role: response.data.user.role || 'Community Member'
        });
        setIsAuthorized(true);
        setTokenType("user");
        setAdmin(null);

        // Store navigation function for later use if not provided immediately
        if (navigate && typeof navigate === 'function') {
          navigate("/");
        } else if (window.userNavigateFunction) {
          window.userNavigateFunction("/");
        }
        return;
      }
    } catch (err) {
      if (err.response?.status !== 429) {
        try {
          const { data } = await api.get("/admin/auth/me", { withCredentials: true });
          if (data && data.admin) {
            setAdmin(data.admin);
            setIsAuthorized(true);
            setTokenType("admin");
            setUser(null);
            return;
          }
        } catch (adminErr) {
          if (adminErr.response?.status !== 429) {
            setIsAuthorized(false);
            setUser(null);
            setAdmin(null);
            setTokenType(null);
          }
        }
      } else {
        console.warn("Rate limited while fetching user profile");
      }
    } finally {
      setIsLoading(false);
      setAuthLoaded(true);
    }
  };

  const logout = async () => {
    try {
      await api.get("/user/logout", { withCredentials: true });
    } catch (_) {}
    try {
      await api.get("/admin/auth/logout", { withCredentials: true });
    } catch (_) {}

    // Clear localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthorized");
    localStorage.removeItem("tokenType");

    setUser(null);
    setAdmin(null);
    setIsAuthorized(false);
    setTokenType(null);
    toast.success("Logged out successfully");
  };

  useEffect(() => {
    if (!isAuthorized && authLoaded) {
      initialized.current = false;
    }
  }, [isAuthorized, authLoaded]);

  useEffect(() => {
    if (initialized.current) return;

    initialized.current = true;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      // First check if user data exists in localStorage
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      const isAuth = localStorage.getItem("isAuthorized") === "true";
      const type = localStorage.getItem("tokenType");
      if (storedUser && isAuth && type === "user") {
        console.log("MainContext: Using stored user data");
        setUser({
          ...storedUser,
          role: storedUser.role || 'Community Member'
        });
        setIsAuthorized(true);
        setTokenType("user");
        setAdmin(null);
        setAuthLoaded(true);
        return;
      }

      console.log("MainContext: No stored data, fetching from API");
      // If no stored data, try to fetch from API
      fetchProfile();
    }, 100);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const value = {
    isAuthorized,
    setIsAuthorized,
    authLoaded,
    tokenType,
    setTokenType,
    user,
    setUser,
    admin,
    setAdmin,
    fetchProfile,
    logout,
  };

  return <MainContext.Provider value={value}>{children}</MainContext.Provider>;
};

export const useMainContext = () => useContext(MainContext);
