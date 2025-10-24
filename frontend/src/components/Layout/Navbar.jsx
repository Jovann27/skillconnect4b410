import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GiHamburgerMenu } from "react-icons/gi";
import { useMainContext } from "../../mainContext";
import "./layout-styles.css";

const Navbar = () => {
  const { user, admin, isAuthorized, logout } = useMainContext();
  const [show, setShow] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  // Keyboard navigation handler
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setShow(false);
    }
  };

  // Focus management for mobile menu
  useEffect(() => {
    if (show) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus first menu item when mobile menu opens
      const firstMenuItem = document.querySelector('.menu-wrapper.active .navbar-link');
      if (firstMenuItem) {
        firstMenuItem.focus();
      }
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [show]);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks

    setIsLoggingOut(true);
    try {
      await logout();
      localStorage.removeItem("user");
      localStorage.removeItem("isAuthorized");
      localStorage.removeItem("tokenType");
      localStorage.removeItem("rememberedEmail");
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err.message);
      localStorage.removeItem("user");
      localStorage.removeItem("isAuthorized");
      localStorage.removeItem("tokenType");
      localStorage.removeItem("rememberedEmail");
      navigate("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <img
            src="https://i.ibb.co/MxKr7FVx/1000205778-removebg-preview.png"
            alt="SkillConnect4B410 logo"
            className="navbar-logo-image"
          />
          <span className="navbar-logo-text">SkillConnect4B410</span>
        </Link>

        {/* Navigation Menu */}
        <div className={`navbar-menu ${show ? 'mobile-menu show' : ''}`}>
          <ul className="navbar-menu-list">
            {/* Public links */}
            <li role="none">
              <Link to="/" className="navbar-link" role="menuitem" aria-label="Go to home page">
                HOME
              </Link>
            </li>
            <li role="none">
              <Link to="/about" className="navbar-link" role="menuitem" aria-label="About SkillConnect4B410">
                ABOUT
              </Link>
            </li>

            {/* Auth-dependent links */}
            {!isAuthorized && (
              <>
                <li role="none">
                  <Link to="/login" className="navbar-link" role="menuitem" aria-label="Login to your account">
                    LOGIN
                  </Link>
                </li>
                <li role="none">
                  <Link to="/register" className="navbar-link" role="menuitem" aria-label="Create a new account">
                    REGISTER
                  </Link>
                </li>
              </>
            )}

            {/* User Dashboard */}
            {user && (
              <>
                <li role="none">
                  <Link to="/user/my-service" className="navbar-link" role="menuitem" aria-label="Go to statistics">
                    DASHBOARD
                  </Link>
                </li>
                <li role="none">
                  <div className="navbar-user">
                    <button
                      className="navbar-logout-btn"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      aria-label={isLoggingOut ? "Logging out, please wait" : "Logout from your account"}
                    >
                      {isLoggingOut ? (
                        <>
                          <span className="loading-spinner" aria-hidden="true"></span>
                          <span>Logging out...</span>
                        </>
                      ) : (
                        'LOGOUT'
                      )}
                    </button>
                  </div>
                </li>
              </>
            )}

            {/* Admin Dashboard */}
            {admin && (
              <>
                <li role="none">
                  <Link to="/admin/dashboard" className="navbar-link" role="menuitem" aria-label="Go to admin dashboard">
                    DASHBOARD
                  </Link>
                </li>
                <li role="none">
                  <Link to="/admin/service-providers" className="navbar-link" role="menuitem" aria-label="Manage service providers">
                    SERVICE PROVIDERS
                  </Link>
                </li>
                <li role="none">
                  <Link to="/admin/users" className="navbar-link" role="menuitem" aria-label="Manage users">
                    USERS
                  </Link>
                </li>
                <li role="none">
                  <Link to="/admin/analytics" className="navbar-link" role="menuitem" aria-label="View system analytics">
                    ANALYTICS
                  </Link>
                </li>
                <li role="none">
                  <div className="navbar-user">
                    <button
                      className="navbar-logout-btn"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      aria-label={isLoggingOut ? "Logging out, please wait" : "Logout from admin account"}
                    >
                      {isLoggingOut ? (
                        <>
                          <span className="loading-spinner" aria-hidden="true"></span>
                          <span>Logging out...</span>
                        </>
                      ) : (
                        'LOGOUT'
                      )}
                    </button>
                  </div>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Hamburger Menu */}
        <button
          className="hamburger"
          onClick={() => setShow(!show)}
          aria-label={show ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={show}
          aria-controls="navigation-menu"
        >
          <GiHamburgerMenu />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
