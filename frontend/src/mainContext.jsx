import { createContext, useContext, useState, useEffect, useRef } from "react";
import api from "./api";
import toast from "react-hot-toast";
import { updateSocketToken } from "./utils/socket";

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
  isUserVerified: false,
  setIsUserVerified: () => {},
  fetchProfile: () => {},
  logout: () => {},
});

export const MainProvider = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [tokenType, setTokenType] = useState(null);
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [isUserVerified, setIsUserVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const initialized = useRef(false);
  const debounceTimer = useRef(null);

  const fetchProfile = async (navigate = null) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await api.get("/user/me", { withCredentials: true });
      if (response.data && response.data.success && response.data.user) {
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        setIsUserVerified(userData.isVerified || false);
        setIsAuthorized(true);
        setTokenType("user");
        setAdmin(null);

        // Update socket token for real-time chat
        const token = localStorage.getItem("token");
        if (token) {
          updateSocketToken(token);
        }

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
            localStorage.setItem("admin", JSON.stringify(data.admin));
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
    await Promise.all([
      api.get("/user/logout", { withCredentials: true }),
      api.get("/admin/auth/logout", { withCredentials: true })
    ]);
  } catch (_) {
    console.warn("Logout requests failed, proceeding with local clear.");
  }

  localStorage.clear();

  if (updateSocketToken) updateSocketToken("");

  setUser(null);
  setAdmin(null);
  setIsUserVerified(false);
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
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      const storedAdmin = JSON.parse(localStorage.getItem("admin") || "null");
      const isAuth = localStorage.getItem("isAuthorized") === "true";
      const type = localStorage.getItem("tokenType");

      if (storedUser && isAuth && type === "user") {
        setUser(storedUser);
        setIsUserVerified(storedUser.isVerified || false);
        setIsAuthorized(true);
        setTokenType("user");
        setAdmin(null);
        setAuthLoaded(true);

        const token = localStorage.getItem("token");
        if (token) {
          updateSocketToken(token);
        }
        return;
      }

      if (storedAdmin && isAuth && type === "admin") {
        setAdmin(storedAdmin);
        setIsAuthorized(true);
        setTokenType("admin");
        setUser(null);
        setAuthLoaded(true);
        return;
      }

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
    isUserVerified,
    setIsUserVerified,
    fetchProfile,
    logout,
  };

  return <MainContext.Provider value={value}>{children}</MainContext.Provider>;
};

export const useMainContext = () => useContext(MainContext);
