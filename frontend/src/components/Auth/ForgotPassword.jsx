import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FaArrowLeft, FaEnvelope, FaCheck, FaTimes } from "react-icons/fa";
import api from "../../api";
import "./auth-styles.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return "Email address is required";
    }
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setValidationErrors({
      ...validationErrors,
      email: validateEmail(value)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    if (emailError) {
      setValidationErrors({ email: emailError });
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data } = await api.post("/user/forgot-password", { email });

      if (data.success) {
        setIsEmailSent(true);
        toast.success("Password reset email sent successfully!");
      } else {
        toast.error(data.message || "Failed to send reset email");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Failed to send reset email. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="auth-container">
        <div className="auth-card forgot-password-card">
          <div className="forgot-password-success">
            <div className="success-icon">
              <FaCheck />
            </div>
            <h2>Email Sent Successfully!</h2>
            <p>
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="success-message">
              Please check your email and follow the instructions to reset your password.
              The link will expire in 1 hour for security reasons.
            </p>

            <div className="success-actions">
              <Link to="/login" className="auth-btn primary">
                <FaArrowLeft className="btn-icon" />
                Back to Login
              </Link>
              <button
                type="button"
                className="auth-btn secondary"
                onClick={() => {
                  setIsEmailSent(false);
                  setEmail("");
                }}
              >
                Send Another Email
              </button>
            </div>

            <div className="email-help">
              <p>Didn't receive the email? Check your:</p>
              <ul>
                <li>Spam or junk folder</li>
                <li>Email address for typos</li>
                <li>Email server issues</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card forgot-password-card">
        {/* Header */}
        <div className="auth-banner">
          <h2>Forgot Password?</h2>
          <p>Enter your email address and we'll send you a link to reset your password.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Email Field */}
          <div className="input-container icon-input">
            <i className="fas fa-envelope" aria-hidden="true"></i>
            <input
              type="email"
              name="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={handleEmailChange}
              className={`auth-input ${validationErrors.email ? 'error' : email ? 'success' : ''}`}
              aria-describedby={validationErrors.email ? 'email-error' : 'email-help'}
              aria-invalid={!!validationErrors.email}
              autoComplete="email"
              required
            />
            {email && !validationErrors.email && (
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
            Enter the email address associated with your account - we'll send you a password reset link
          </small>

          {/* Submit Button */}
          <button
            type="submit"
            className="auth-btn primary"
            disabled={isSubmitting || !!validationErrors.email}
            aria-describedby="submit-help"
          >
            {isSubmitting ? (
              <>
                <span className="loading-spinner" aria-hidden="true"></span>
                Sending Reset Email...
              </>
            ) : (
              <>
                <FaEnvelope className="btn-icon" />
                Send Reset Email
              </>
            )}
          </button>

          <small id="submit-help" className="form-help">
            We'll send you an email with instructions to reset your password
          </small>

          {/* Back to Login */}
          <div className="forgot-password-footer">
            <Link to="/login" className="back-to-login">
              <FaArrowLeft className="btn-icon" />
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
