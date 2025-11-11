import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useMainContext } from "../../mainContext";
import api from "../../api";
import { FaEye, FaEyeSlash, FaCheck, FaTimes, FaUpload } from "react-icons/fa";
import "./auth-styles.css";

const Register = () => {
  const [formData, setFormData] = useState({
    role: "",
    skills: "",
    profilePic: null,
    username: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    birthdate: "",
    employed: "",
    isApplyingProvider: false,
    certificates: [],
    validId: null,
  });

  const [showPopup, setShowPopup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthorized, setIsAuthorized, setUser, setTokenType } = useMainContext();
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {};

    if (!formData.username || formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters long";
    }

    // Password validation
    if (!formData.password || formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Phone validation
    const phoneRegex = /^[\+]?[0-9\-\(\)\s]+$/;
    if (!formData.phone || !phoneRegex.test(formData.phone)) {
      errors.phone = "Please enter a valid phone number";
    }

    // Required fields validation
    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    if (!formData.address.trim()) errors.address = "Address is required";
    if (!formData.birthdate) errors.birthdate = "Birthdate is required";
    if (!formData.employed || !["employed", "unemployed"].includes(formData.employed)) {
      errors.employed = "Employment status must be Employed or Unemployed";
    }

    // Service Provider specific validation
    if (formData.role === "Service Provider") {
      if (!formData.skills || formData.skills.trim() === "") {
        errors.skills = "Skills are required for Service Providers";
      }
      if (formData.certificates.length === 0) {
        errors.certificates = "Certificates are required for Service Providers";
      }
      if (!formData.validId) {
        errors.validId = "Valid ID is required for Service Providers";
      } else if (!formData.validId.type.startsWith("image/")) {
        errors.validId = "Valid ID must be an image file (JPG, PNG, etc.)";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Track if user has attempted to submit
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (!hasSubmitted) return;

    const timer = setTimeout(() => {
      validateForm();
    }, 500);

    return () => clearTimeout(timer);
  }, [formData, hasSubmitted]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      if (name === "certificates") {
        setFormData({ ...formData, certificates: Array.from(files) });
      } else {
        setFormData({ ...formData, [name]: files[0] });
      }
    } else {
    const updatedData = { ...formData, [name]: value };
      if (name === "role") {
        updatedData.isApplyingProvider = value === "Service Provider";
      }
      setFormData(updatedData);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setHasSubmitted(true); // Mark that user has attempted to submit

    if (!validateForm()) {
      toast.error("Please fix the errors in the form before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key]) {
          if (key === "certificates") {
            formData[key].forEach((file) => submitData.append(key, file));
          } else if (key === "validId" && formData.role !== "Service Provider") {
            return;
          } else {
            submitData.append(key, formData[key]);
          }
        }
      });

      const { data } = await api.post(
        "/user/register",
        submitData,
        {
          headers: { "Content-Type": "multipart/form-data" }
        }
      );

      toast.success(data.message);
      setShowPopup(true);
      setUser(data.user);
      setIsAuthorized(true);
      setTokenType("user");
      if (data.user.isVerified) {
        navigate("/user/my-service");
      } else {
        navigate("/user/request-service");
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("isAuthorized", "true");
      localStorage.setItem("tokenType", "user");


      setTimeout(() => setShowPopup(false), 5000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, label: "" };
    if (password.length < 6) return { strength: 1, label: "Weak" };
    if (password.length < 10) return { strength: 2, label: "Medium" };
    return { strength: 3, label: "Strong" };
  };

  const passwordStrength = getPasswordStrength(formData.password);
  

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        {/* Banner */}
        <div className="auth-banner">
          <img
            src="https://i.ibb.co/MxKr7FVx/1000205778-removebg-preview.png"
            alt="Logo"
          />
          <h2>SkillConnect4B410</h2>
          <p>Create your account to book or offer services in the community.</p>
        </div>

        <form onSubmit={handleRegister} className="auth-form register-form" noValidate>
          {/* Profile Picture */}
          <div className="form-group file-upload register-file">
            <label htmlFor="profilePic" className="register-label">
              Upload Profile Picture:
            </label>
            <input
              type="file"
              id="profilePic"
              name="profilePic"
              accept="image/*"
              onChange={handleChange}
              className={`register-input ${formData.profilePic ? 'has-file' : ''}`}
              aria-describedby="profilePic-help"
            />
            <div className="preview-box" aria-live="polite">
              {formData.profilePic ? (
                <img
                  src={URL.createObjectURL(formData.profilePic)}
                  alt="Profile preview"
                />
              ) : (
                <span>No file selected</span>
              )}
            </div>
            <small id="profilePic-help" className="form-help">
              Optional: Upload a profile picture (JPG, PNG only)
            </small>
          </div>

          {/* Username */}
          <div className="input-container icon-input">
            <i className="fas fa-user" aria-hidden="true"></i>
            <input
              type="text"
              name="username"
              placeholder="Choose a unique username"
              value={formData.username}
              onChange={handleChange}
              required
              className={`auth-input ${validationErrors.username ? 'error' : formData.username ? 'success' : ''}`}
              aria-describedby={validationErrors.username ? 'username-error' : 'username-help'}
              aria-invalid={!!validationErrors.username}
              autoComplete="username"
            />
            {formData.username && !validationErrors.username && (
              <FaCheck className="validation-icon success" aria-hidden="true" />
            )}
            {validationErrors.username && (
              <FaTimes className="validation-icon error" aria-hidden="true" />
            )}
          </div>
          {validationErrors.username && (
            <small id="username-error" className="field-error" role="alert">
              {validationErrors.username}
            </small>
          )}
          <small id="username-help" className="form-help">
            Choose a unique username (minimum 3 characters) - this will be visible to other users
          </small>

          {/* Password */}
          <div className="input-container icon-input password-field">
            <i className="fas fa-lock" aria-hidden="true"></i>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter Password"
              value={formData.password}
              onChange={handleChange}
              required
              className={`register-input ${validationErrors.password ? 'error' : formData.password && passwordStrength.strength >= 2 ? 'success' : ''}`}
              aria-describedby={validationErrors.password ? 'password-error' : 'password-help'}
              aria-invalid={!!validationErrors.password}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
            {formData.password && !validationErrors.password && (
              <FaCheck className="validation-icon success" aria-hidden="true" />
            )}
            {validationErrors.password && (
              <FaTimes className="validation-icon error" aria-hidden="true" />
            )}
          </div>
          {validationErrors.password && (
            <small id="password-error" className="field-error" role="alert">
              {validationErrors.password}
            </small>
          )}
          {formData.password && (
            <div className="password-strength" aria-live="polite">
              <div className={`strength-bar strength-${passwordStrength.strength}`}>
                <span className="strength-label">{passwordStrength.label}</span>
              </div>
            </div>
          )}
          <small id="password-help" className="form-help">
            Password must be at least 6 characters long
          </small>

          {/* Confirm Password */}
          <div className="input-container icon-input password-field">
            <i className="fas fa-lock" aria-hidden="true"></i>
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className={`register-input ${validationErrors.confirmPassword ? 'error' : formData.confirmPassword && formData.password === formData.confirmPassword ? 'success' : ''}`}
              aria-describedby={validationErrors.confirmPassword ? 'confirmPassword-error' : 'confirmPassword-help'}
              aria-invalid={!!validationErrors.confirmPassword}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
            {formData.confirmPassword && formData.password === formData.confirmPassword && !validationErrors.confirmPassword && (
              <FaCheck className="validation-icon success" aria-hidden="true" />
            )}
            {validationErrors.confirmPassword && (
              <FaTimes className="validation-icon error" aria-hidden="true" />
            )}
          </div>
          {validationErrors.confirmPassword && (
            <small id="confirmPassword-error" className="field-error" role="alert">
              {validationErrors.confirmPassword}
            </small>
          )}
          <small id="confirmPassword-help" className="form-help">
            Re-enter your password to confirm
          </small>

          {/* Email */}
          <div className="input-container icon-input">
            <i className="fas fa-envelope" aria-hidden="true"></i>
            <input
              type="email"
              name="email"
              placeholder="Enter Email"
              value={formData.email}
              onChange={handleChange}
              required
              className={`register-input ${validationErrors.email ? 'error' : formData.email ? 'success' : ''}`}
              aria-describedby={validationErrors.email ? 'email-error' : 'email-help'}
              aria-invalid={!!validationErrors.email}
            />
            {formData.email && !validationErrors.email && (
              <FaCheck className="validation-icon success" aria-hidden="true" />
            )}
            {validationErrors.email && (
              <FaTimes className="validation-icon error" aria-hidden="true" />
            )}
          </div>
          {validationErrors.email && (
            <small id="email-error" className="field-error" role="alert">
              {validationErrors.email}
            </small>
          )}
          <small id="email-help" className="form-help">
            We'll use this to send you important updates
          </small>

          {/* First Name */}
          <div className="input-container icon-input">
            <i className="fas fa-id-card" aria-hidden="true"></i>
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              required
              className={`register-input ${validationErrors.firstName ? 'error' : formData.firstName ? 'success' : ''}`}
              aria-describedby={validationErrors.firstName ? 'firstName-error' : 'firstName-help'}
              aria-invalid={!!validationErrors.firstName}
            />
            {formData.firstName && !validationErrors.firstName && (
              <FaCheck className="validation-icon success" aria-hidden="true" />
            )}
            {validationErrors.firstName && (
              <FaTimes className="validation-icon error" aria-hidden="true" />
            )}
          </div>
          {validationErrors.firstName && (
            <small id="firstName-error" className="field-error" role="alert">
              {validationErrors.firstName}
            </small>
          )}

          {/* Last Name */}
          <div className="input-container icon-input">
            <i className="fas fa-id-card" aria-hidden="true"></i>
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              required
              className={`register-input ${validationErrors.lastName ? 'error' : formData.lastName ? 'success' : ''}`}
              aria-describedby={validationErrors.lastName ? 'lastName-error' : 'lastName-help'}
              aria-invalid={!!validationErrors.lastName}
            />
            {formData.lastName && !validationErrors.lastName && (
              <FaCheck className="validation-icon success" aria-hidden="true" />
            )}
            {validationErrors.lastName && (
              <FaTimes className="validation-icon error" aria-hidden="true" />
            )}
          </div>
          {validationErrors.lastName && (
            <small id="lastName-error" className="field-error" role="alert">
              {validationErrors.lastName}
            </small>
          )}

          {/* Phone */}
          <div className="input-container icon-input">
            <i className="fas fa-phone" aria-hidden="true"></i>
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              required
              className={`register-input ${validationErrors.phone ? 'error' : formData.phone ? 'success' : ''}`}
              aria-describedby={validationErrors.phone ? 'phone-error' : 'phone-help'}
              aria-invalid={!!validationErrors.phone}
            />
            {formData.phone && !validationErrors.phone && (
              <FaCheck className="validation-icon success" aria-hidden="true" />
            )}
            {validationErrors.phone && (
              <FaTimes className="validation-icon error" aria-hidden="true" />
            )}
          </div>
          {validationErrors.phone && (
            <small id="phone-error" className="field-error" role="alert">
              {validationErrors.phone}
            </small>
          )}
          <small id="phone-help" className="form-help">
            Include country code for international numbers
          </small>

          {/* Address */}
          <div className="input-container icon-input">
            <i className="fas fa-map-marker-alt" aria-hidden="true"></i>
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
              required
              className={`register-input ${validationErrors.address ? 'error' : formData.address ? 'success' : ''}`}
              aria-describedby={validationErrors.address ? 'address-error' : 'address-help'}
              aria-invalid={!!validationErrors.address}
            />
            {formData.address && !validationErrors.address && (
              <FaCheck className="validation-icon success" aria-hidden="true" />
            )}
            {validationErrors.address && (
              <FaTimes className="validation-icon error" aria-hidden="true" />
            )}
          </div>
          {validationErrors.address && (
            <small id="address-error" className="field-error" role="alert">
              {validationErrors.address}
            </small>
          )}

          {/* Role */}
          <div className="input-container icon-input">
            <i className="fas fa-user-tag" aria-hidden="true"></i>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className={`register-input ${formData.role ? 'success' : ''}`}
              aria-describedby="role-help"
              aria-label="Select your role in the community"
            >
              <option value="Community Member">Community Member</option>
              <option value="Service Provider">Service Provider</option>
            </select>
          </div>
          <small id="role-help" className="form-help">
            Community Members can request services, Service Providers can offer services
          </small>

          {formData.role === "Service Provider" && (
            <>
              {/* Skills */}
              <div className="input-container icon-input">
                <i className="fas fa-tools" aria-hidden="true"></i>
                <input
                  type="text"
                  name="skills"
                  placeholder="Enter skills (comma-separated)"
                  value={formData.skills}
                  onChange={handleChange}
                  required
                  className={`register-input ${validationErrors.skills ? 'error' : formData.skills ? 'success' : ''}`}
                  aria-describedby={validationErrors.skills ? 'skills-error' : 'skills-help'}
                  aria-invalid={!!validationErrors.skills}
                />
                {formData.skills && !validationErrors.skills && (
                  <FaCheck className="validation-icon success" aria-hidden="true" />
                )}
                {validationErrors.skills && (
                  <FaTimes className="validation-icon error" aria-hidden="true" />
                )}
              </div>
              {validationErrors.skills && (
                <small id="skills-error" className="field-error" role="alert">
                  {validationErrors.skills}
                </small>
              )}
              <small id="skills-help" className="form-help">
                Example: Plumbing, Electrical, Carpentry, Cleaning
              </small>
            </>
          )}

          {/* Birthdate */}
          <div className="input-container icon-input">
            <i className="fas fa-calendar" aria-hidden="true"></i>
            <label htmlFor="BirthDate">Birth Date:</label>
            <input
              type="date"
              name="birthdate"
              value={formData.birthdate}
              onChange={handleChange}
              required
              className={`register-input ${validationErrors.birthdate ? 'error' : formData.birthdate ? 'success' : ''}`}
              aria-describedby={validationErrors.birthdate ? 'birthdate-error' : 'birthdate-help'}
              aria-invalid={!!validationErrors.birthdate}
              max={new Date().toISOString().split('T')[0]}
            />
            {formData.birthdate && !validationErrors.birthdate && (
              <FaCheck className="validation-icon success" aria-hidden="true" />
            )}
            {validationErrors.birthdate && (
              <FaTimes className="validation-icon error" aria-hidden="true" />
            )}
          </div>
          {validationErrors.birthdate && (
            <small id="birthdate-error" className="field-error" role="alert">
              {validationErrors.birthdate}
            </small>
          )}

          {/* Employment Status */}
          <div className="input-container icon-input">
            <i className="fas fa-briefcase" aria-hidden="true"></i>
            <select
              name="employed"
              value={formData.employed}
              onChange={handleChange}
              required
              className={`register-input ${validationErrors.employed ? 'error' : formData.employed ? 'success' : ''}`}
              aria-describedby={validationErrors.employed ? 'employed-error' : 'employed-help'}
              aria-invalid={!!validationErrors.employed}
              aria-label="Select your employment status"
            >
              <option value="">Select Employment Status</option>
              <option value="employed">Employed</option>
              <option value="unemployed">Unemployed</option>
            </select>
            {formData.employed && !validationErrors.employed && (
              <FaCheck className="validation-icon success" aria-hidden="true" />
            )}
            {validationErrors.employed && (
              <FaTimes className="validation-icon error" aria-hidden="true" />
            )}
          </div>
          {validationErrors.employed && (
            <small id="employed-error" className="field-error" role="alert">
              {validationErrors.employed}
            </small>
          )}

          {/* Service Provider Documents */}
          {formData.role === "Service Provider" && (
            <>
              {/* Certificates */}
              <div className="form-group file-upload">
                <label htmlFor="certificates" className="register-label">
                  Upload Certificates *
                </label>
                <input
                  type="file"
                  id="certificates"
                  name="certificates"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={handleChange}
                  className={`register-input ${validationErrors.certificates ? 'error' : formData.certificates.length > 0 ? 'success' : ''}`}
                  aria-describedby={validationErrors.certificates ? 'certificates-error' : 'certificates-help'}
                  aria-invalid={!!validationErrors.certificates}
                />
                <div className="file-list" aria-live="polite">
                  {formData.certificates.length > 0 ? (
                    formData.certificates.map((file, index) => (
                      <div key={index} className="file-item">
                        {file.type.startsWith("image/") ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Certificate ${index + 1}`}
                          />
                        ) : (
                          <span className="file-name">{file.name}</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <span className="no-files">No files selected</span>
                  )}
                </div>
                {validationErrors.certificates && (
                  <small id="certificates-error" className="field-error" role="alert">
                    {validationErrors.certificates}
                  </small>
                )}
                <small id="certificates-help" className="form-help">
                  Upload certificates or licenses that prove your skills
                </small>
              </div>

              {/* Valid ID */}
              <div className="form-group file-upload">
                <label htmlFor="validId" className="register-label">
                  Upload Valid ID *
                </label>
                <input
                  type="file"
                  id="validId"
                  name="validId"
                  accept="image/*"
                  onChange={handleChange}
                  className={`register-input ${validationErrors.validId ? 'error' : formData.validId ? 'success' : ''}`}
                  aria-describedby={validationErrors.validId ? 'validId-error' : 'validId-help'}
                  aria-invalid={!!validationErrors.validId}
                />
                <div className="file-preview" aria-live="polite">
                  {formData.validId ? (
                    formData.validId.type.startsWith("image/") ? (
                      <img
                        src={URL.createObjectURL(formData.validId)}
                        alt="Valid ID preview"
                      />
                    ) : (
                      <span className="file-name">Invalid file type. Please select an image.</span>
                    )
                  ) : (
                    <span className="no-file">No file selected</span>
                  )}
                </div>
                {validationErrors.validId && (
                  <small id="validId-error" className="field-error" role="alert">
                    {validationErrors.validId}
                  </small>
                )}
                <small id="validId-help" className="form-help">
                  Upload a government-issued ID (images only: JPG, PNG, etc.)
                </small>
              </div>
            </>
          )}

          <button
            type="submit"
            className="auth-btn register-btn"
            disabled={isSubmitting || Object.keys(validationErrors).length > 0}
            aria-describedby="submit-help"
          >
            {isSubmitting ? (
              <>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
          <small id="submit-help" className="form-help">
            By creating an account, you agree to our terms of service
          </small>

          <div className="auth-links">
            <p>
              Already have an account? <Link to="/login">Login</Link> |{" "}
              <Link to="/admin/login">Admin Login</Link>
            </p>
          </div>
        </form>
      </div>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h3>
              Registration successful! Welcome to SkillConnect.
            </h3>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
