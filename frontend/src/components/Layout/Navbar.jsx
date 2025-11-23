import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GiHamburgerMenu } from "react-icons/gi";
import { useMainContext } from "../../mainContext";
import { FaUser, FaFileAlt, FaCartPlus, FaSignOutAlt, FaSuitcase } from "react-icons/fa";
import { IoNotificationsOutline, IoSettingsOutline } from "react-icons/io5";
import ChatIcon from "../ChatIcon";
import api from "../../api";
import "./layout-styles.css";

const Navbar = () => {
  const { user, admin, isAuthorized, tokenType, logout } = useMainContext();
  const [show, setShow] = useState(false);
  const [dashboardDropdown, setDashboardDropdown] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setShow(false);
      setDashboardDropdown(false);
    }
  };
  const handleClickOutside = (event) => {
    if (!event.target.closest('.dropdown')) {
      setDashboardDropdown(false);
    }
  };

  useEffect(() => {
    if (show || dashboardDropdown) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [show, dashboardDropdown]);

  useEffect(() => {
    if (isAuthorized) {
      fetchUnreadCount();
    } else {
      setUnreadCount(0);
    }
  }, [isAuthorized]);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logout();
      localStorage.removeItem("user");
      localStorage.removeItem("admin");
      localStorage.removeItem("isAuthorized");
      localStorage.removeItem("tokenType");
      localStorage.removeItem("rememberedEmail");
      navigate(tokenType === 'admin' ? "/admin/login" : "/login");
    } catch (err) {
      console.error("Logout failed:", err.message);
      localStorage.removeItem("user");
      localStorage.removeItem("admin");
      localStorage.removeItem("isAuthorized");
      localStorage.removeItem("tokenType");
      localStorage.removeItem("rememberedEmail");
      navigate(tokenType === 'admin' ? "/admin/login" : "/user/my-service");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const fetchNotifications = async () => {
    // Only fetch if user is authorized and has a valid token
    if (!isAuthorized || !localStorage.getItem("token")) {
      setNotifications([]);
      setLoadingNotifications(false);
      return;
    }

    setLoadingNotifications(true);
    try {
      const { data } = await api.get("/user/notifications");
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      // If authentication fails, clear notifications
      if (err.response?.status === 401) {
        setNotifications([]);
      }
    } finally {
      setLoadingNotifications(false);
    }
  };

  const fetchUnreadCount = async () => {
    // Only fetch if user is authorized and has a valid token
    if (!isAuthorized || !localStorage.getItem("token")) {
      setUnreadCount(0);
      return;
    }

    try {
      const { data } = await api.get("/user/notifications/unread-count");
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Error fetching unread count:", err);
      // If authentication fails, reset count and let the api interceptor handle logout
      if (err.response?.status === 401) {
        setUnreadCount(0);
      }
    }
  };

  const toggleNotifications = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      fetchNotifications();
    }
    // Reset unread count when clicking the notification icon
    await markAllAsRead();
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      await api.put(`/user/notifications/${notification._id}/read`);
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notification._id ? { ...notif, read: true } : notif
        )
      );

      setUnreadCount(prev => Math.max(0, prev - 1));

      // Navigate based on notification type
      const { meta } = notification;

      if (meta) {
        if (meta.type === "apply-provider") {
          navigate("/user/manage-profile");
        } else if ((meta.type === "service-request" || meta.type === "service-request-posted") && meta.requestId) {
          navigate("/user/my-service");
        } else if (meta.bookingId) {
          navigate("/user/chat");
        } else if (meta.apptId) {
          if (admin) {
            navigate("/admin/verification");
          }
        } else if (meta.type === "verification_appointment") {
          navigate("/user/manage-profile");
        }
      }

      // Close notification popup
      setShowNotifications(false);
    } catch (err) {
      console.error("Error handling notification click:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/user/notifications/mark-all-read");
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-container">
        <Link to="/home" className="navbar-logo">
          <img
            src="https://i.ibb.co/MxKr7FVx/1000205778-removebg-preview.png"
            alt="SkillConnect4B410 logo"
            className="navbar-logo-image"
          />
          <span className="navbar-logo-text">SkillConnect4B410</span>
        </Link>

        <div className={`navbar-menu ${show ? 'mobile-menu show' : ''}`}>
          <ul className="navbar-menu-list">
            {!isAuthorized && (
              <>
                <li role="none">
                  <Link to="/home" className="navbar-link" role="menuitem" aria-label="Go to home page">
                    HOME
                  </Link>
                </li>
                <li role="none">
                  <Link to="/about" className="navbar-link" role="menuitem" aria-label="About SkillConnect4B410">
                    ABOUT
                  </Link>
                </li>
              </>
            )}

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


            {isAuthorized && tokenType !== 'admin' && (<li role="none">
              <button onClick={toggleNotifications} className="navbar-icon-btn" aria-label="View notifications">
                <IoNotificationsOutline size={24} />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </button>
            </li>
            )}


            {isAuthorized && tokenType !== 'admin' && (<li role="none">
              <ChatIcon />
            </li>
            )}

            {user?.role === 'Service Provider' && tokenType !== 'admin' && (
            <li role="none">
              <Link to="/user/my-service" className="navbar-icon-btn" aria-label="My Service">
                <FaCartPlus size={24} />
              </Link>
            </li>
            )}

            {/* User Dashboard Dropdown */}
            {user && tokenType !== 'admin' && (
              <li role="none" className="dropdown">

                <button
                  className="dashboard-toggle"
                  onClick={() => setDashboardDropdown(!dashboardDropdown)}
                  aria-label="User dashboard menu"
                  aria-expanded={dashboardDropdown}
                >
                  <FaUser size={24} />
                </button>
                {dashboardDropdown && (
                  <ul className="dropdown-menu">
                    {/* Profile section */}
                    <li className="dropdown-profile">
                      <Link to="/user/manage-profile" style={{ display: 'flex', alignItems: 'center', width: '100%', textDecoration: 'none' }}>
                        <img src={user.profilePic} alt="User" />
                        <div className="dropdown-profile-info">
                          <strong>{user.firstName} {user.lastName}</strong>
                          <small>{user.role}</small>
                        </div>
                      </Link>
                    </li>

                    <li>
                      <Link to="/user/manage-profile">
                        <FaUser />Manage Profile
                      </Link>
                    </li>
                    {user?.role === "Service Provider" && (
                      <li>
                        
                      </li>
                    )}
                    <li><Link to="/user/service-request"><FaCartPlus />Request Service</Link></li>
                    <li><Link to="/user/records"><FaFileAlt/>My Records</Link></li>
                    <li><Link to="/user/general-settings"><IoSettingsOutline />General Settings </Link></li>

                    <div className="dropdown-divider"></div>

                    <li className="logout-item">
                      <button onClick={handleLogout}>
                        <FaSignOutAlt />Log Out
                      </button>
                    </li>
                  </ul>
                )}
              </li>
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

      {/* Notification Popup */}
      {showNotifications && (
        <div className="notification-popup-overlay" onClick={() => setShowNotifications(false)}>
          <div className="notification-popup" onClick={(e) => e.stopPropagation()}>
            <div className="notification-popup-header">
              <h3>Notifications</h3>
              <button className="notification-popup-close" onClick={() => setShowNotifications(false)}>×</button>
            </div>
            <div className="notification-popup-content">
              {loadingNotifications ? (
                <p>Loading...</p>
              ) : notifications.length === 0 ? (
                <div className="notification-empty">
                  <p>No notifications yet</p>
                </div>
              ) : (
                <>
                  {notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`notification-item ${!notif.read ? 'notification-item-unread' : ''}`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="notification-item-content">
                        <div className="notification-item-title">{notif.title}</div>
                        <div className="notification-item-message">{notif.message}</div>
                        <div className="notification-item-time">{formatTime(notif.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
