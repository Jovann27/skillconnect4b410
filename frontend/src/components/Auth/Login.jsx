import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useMainContext } from "../../mainContext";
import api from "../../api";
import { updateSocketToken } from "../../utils/socket";
import "./auth-styles.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { setIsAuthorized, setUser, setTokenType } = useMainContext();
  const navigate = useNavigate();

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    const storedToken = localStorage.getItem("token");
    const isAuth = localStorage.getItem("isAuthorized") === "true";
    const type = localStorage.getItem("tokenType");

    if (storedUser && isAuth && storedToken) {
      setUser(storedUser);
      setIsAuthorized(true);
      setTokenType(type);

      // Update socket token for real-time chat
      updateSocketToken(storedToken);

      navigate("/");
    }
  }, [navigate, setUser, setIsAuthorized, setTokenType]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { data } = await api.post("/user/login", {
        email: formData.email,
        password: formData.password
      });

      console.log("Login successful - user data:", data.user);

      setUser(data.user);
      setIsAuthorized(true);
      setTokenType("user");

      // Update localStorage with user data and token
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      localStorage.setItem("isAuthorized", "true");
      localStorage.setItem("tokenType", "user");

      console.log("Login: localStorage set - user:", localStorage.getItem("user"));
      console.log("Login: localStorage set - token:", localStorage.getItem("token"));
      console.log("Login: localStorage set - isAuthorized:", localStorage.getItem("isAuthorized"));
      console.log("Login: localStorage set - tokenType:", localStorage.getItem("tokenType"));

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", formData.email);
      }

      // Update socket token for real-time chat
      const token = localStorage.getItem("token");
      if (token) {
        updateSocketToken(token);
      }

      toast.success(data.message || "Login successful!");

      // Clear form
      setFormData({ email: "", password: "" });
      setErrors({});

      navigate("/");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed. Please try again.";
      toast.error(errorMessage);

      // Set specific error if email/password related
      if (errorMessage.toLowerCase().includes("email") || errorMessage.toLowerCase().includes("password")) {
        setErrors({ general: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-banner">
          <img
            src="https://i.ibb.co/MxKr7FVx/1000205778-removebg-preview.png"
            alt="SkillConnect4B410 Logo"
          />
          <h2>Welcome Back</h2>
          <p>Sign in to your account</p>
        </div>

        {/* General Error Message */}
        {errors.general && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            {errors.general}
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          {/* Email Field */}
          <div className="input-container">
            <div className="icon-input">
              <i className="fas fa-envelope"></i>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleInputChange}
                className={`auth-input ${errors.email ? 'error' : ''}`}
                disabled={isLoading}
                aria-describedby={errors.email ? "email-error" : "email-help"}
                aria-invalid={!!errors.email}
                autoComplete="email"
                required
              />
            </div>
            {errors.email && (
              <span id="email-error" className="field-error">
                <i className="fas fa-exclamation-circle"></i>
                {errors.email}
              </span>
            )}
            <small id="email-help" className="form-help">
              We'll use this email to send you important updates about your account
            </small>
          </div>

          {/* Password Field */}
          <div className="input-container">
            <div className="icon-input">
              <i className="fas fa-lock"></i>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                className={`auth-input ${errors.password ? 'error' : ''}`}
                disabled={isLoading}
                aria-describedby={errors.password ? "password-error" : "password-help"}
                aria-invalid={!!errors.password}
                autoComplete="current-password"
                required
              />
            </div>
            {errors.password && (
              <span id="password-error" className="field-error">
                <i className="fas fa-exclamation-circle"></i>
                {errors.password}
              </span>
            )}
            <small id="password-help" className="form-help">
              Your password must be at least 6 characters long
            </small>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="form-options">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="forgot-password">
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="auth-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Sign Up Link */}
          <div className="auth-links">
            <p>
              Don't have an account?{" "}
              <Link to="/register" className="auth-link-text">
                Create one here
              </Link>
            </p>
            <p className="admin-link">
              Admin?{" "}
              <Link to="/admin/login" className="admin-link-text">
                Login as Administrator
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
