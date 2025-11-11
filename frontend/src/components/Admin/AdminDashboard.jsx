import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import api from "../../api";
import { useMainContext } from "../../mainContext";
import {
  FaHome,
  FaCalendarAlt,
  FaClipboardList,
  FaUsers,
  FaTools,
  FaSignOutAlt
} from "react-icons/fa";


const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboardHome = location.pathname === "/admin/analytics";
  const isJobFairs = location.pathname === "/admin/jobfairs";
  const isServiceRequests = location.pathname === "/admin/service-requests";
  const isUsers = location.pathname === "/admin/users";
  const isServiceProviders = location.pathname === "/admin/service-providers";
  const isAdminSettings = location.pathname === "/admin/admin-settings";
  const isBookedService = location.pathname === "/admin/booked-service";
  const isAdminRegister = location.pathname === "/admin/admin-register";
  const isTopSkilledUsers = location.pathname === "/admin/top-skilled-users";
  const {
    setAdmin,
    setIsAuthorized,
    setTokenType,
    logout,
    admin
  } = useMainContext();




  // Store current path in localStorage
  useEffect(() => {
    if (location.pathname.startsWith("/admin/")) {
      localStorage.setItem("adminLastPath", location.pathname);
    }
  }, [location.pathname]);


  const handleLogout = async () => {
    try {
      await logout();
      navigate("/admin/login");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/admin/analytics");
    }
  };


  const displayName = admin?.name || "Admin";


  // ✅ fallback avatar
  const defaultAvatar =
    "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
  const profilePic = admin?.profilePic || "default-avatar.png";
  const avatarSrc = profilePic.startsWith('http') ? profilePic : `http://192.168.1.13:4000/uploads/${profilePic}`;


  return (
    <>
      {/* === Embedded CSS === */}
      <style>{`
       
        /* === SIDEBAR === */
        .admin-sidebar {
          position: fixed;
          top: 90px;
          left: 0;
          width: 180px;
          height: calc(100vh - 70px);
          background: #ffffff;
          box-shadow: 2px 0 6px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
        }


        .admin-sidebar-header {
          text-align: center;
          padding: 15px;
          border-bottom: 1px solid #f0f0f0;
        }


        .admin-avatar-container {
          position: relative;
          width: 50px;
          height: 50px;
          margin: 0 auto 8px;
        }


        .admin-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #0a84ff;
          background: #f0f0f0;
        }


        .admin-status-indicator {
          position: absolute;
          bottom: -3px;
          right: 1px;
          width: 10px;
          height: 10px;
          background: #4caf50;
          border-radius: 50%;
          border: 2px solid #fff;
        }


        .admin-name {
          font-size: 0.9rem;
          font-weight: 600;
          margin: 5px 0 2px;
        }


        .admin-role {
          font-size: 0.75rem;
          color: #888;
        }


        .admin-sidebar-nav {
          flex: 1;
          overflow-y: auto; /* ✅ Scrollable */
          overflow-x: hidden;
          padding-bottom: 15px;
        }


        .admin-sidebar-nav::-webkit-scrollbar {
          width: 4px;
        }


        .admin-sidebar-nav::-webkit-scrollbar-thumb {
          background-color: #d0d0d0;
          border-radius: 4px;
        }


        .admin-sidebar-nav::-webkit-scrollbar-thumb:hover {
          background-color: #a8a8a8;
        }


        .admin-sidebar-nav ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }


        .admin-nav-link {
          display: flex;
          align-items: center;
          padding: 10px 15px;
          color: #444;
          text-decoration: none;
          font-weight: 500;
          font-size: 0.7rem;
          transition: all 0.3s;
          position: relative;
        }


        .admin-nav-link:hover {
          background: #f1f3f7;
        }


        .admin-nav-link.active {
          background: #0a84ff;
          color: #fff;
        }


        .nav-icon {
          font-size: 0.8rem;
          margin-right: 8px;
        }


        .nav-indicator {
          position: absolute;
          right: 8px;
          width: 5px;
          height: 5px;
          background: white;
          border-radius: 50%;
        }


        .admin-sidebar-footer {
          padding: 15px;
          border-top: 1px solid #f0f0f0;
        }
        /* === CONTENT AREA === */
        .admin-content-wrapper {
          margin-left: 180px;
          flex: 1;
          background: #f5f6fa;
          overflow-y: auto;
        }

      `}</style>


      {/* === Layout === */}
      <div className="analytics-container">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-header">
            <div className="admin-avatar-container">
              <img
                src={avatarSrc}
                alt="Administrator Profile"
                className="admin-avatar"
              />
              <div className="admin-status-indicator"></div>
            </div>
            <h2 className="admin-name">{displayName}</h2>
            <p className="admin-role">System Administrator</p>
          </div>


          <nav
            className="admin-sidebar-nav"
            role="navigation"
            aria-label="Admin navigation"
          >
            <ul className="admin-nav-links">
              <li>
                <Link
                  to="/admin/analytics"
                  className={`admin-nav-link ${isDashboardHome ? "active" : ""}`}
                >
                  <FaHome className="nav-icon" />
                  <span className="nav-text">Dashboard Home</span>
                  {isDashboardHome && <div className="nav-indicator"></div>}
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/jobfairs"
                  className={`admin-nav-link ${isJobFairs ? "active" : ""}`}
                >
                  <FaCalendarAlt className="nav-icon" />
                  <span className="nav-text">Job Fairs</span>
                  {isJobFairs && <div className="nav-indicator"></div>}
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/service-requests"
                  className={`admin-nav-link ${isServiceRequests ? "active" : ""}`}
                >
                  <FaClipboardList className="nav-icon" />
                  <span className="nav-text">Service Requests</span>
                  {isServiceRequests && <div className="nav-indicator"></div>}
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/users"
                  className={`admin-nav-link ${isUsers ? "active" : ""}`}
                >
                  <FaUsers className="nav-icon" />
                  <span className="nav-text">User Management</span>
                  {isUsers && <div className="nav-indicator"></div>}
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/admin-settings"
                  className={`admin-nav-link ${isAdminSettings ? "active" : ""}`}
                >
                  <FaTools className="nav-icon" />
                  <span className="nav-text">Admin Settings</span>
                  {isAdminSettings && <div className="nav-indicator"></div>}
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/service-providers"
                  className={`admin-nav-link ${isServiceProviders ? "active" : ""}`}
                >
                  <FaTools className="nav-icon" />
                  <span className="nav-text">Service Providers</span>
                  {isServiceProviders && <div className="nav-indicator"></div>}
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/booked-service"
                  className={`admin-nav-link ${isBookedService ? "active" : ""}`}
                >
                  <FaTools className="nav-icon" />
                  <span className="nav-text">Booked Service</span>
                  {isBookedService && <div className="nav-indicator"></div>}
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/admin-register"
                  className={`admin-nav-link ${isAdminRegister ? "active" : ""}`}
                >
                  <FaTools className="nav-icon" />
                  <span className="nav-text">Admin Register</span>
                  {isAdminRegister && <div className="nav-indicator"></div>}
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/top-skilled-users"
                  className={`admin-nav-link ${isTopSkilledUsers ? "active" : ""}`}
                >
                  <FaTools className="nav-icon" />
                  <span className="nav-text">Top Skilled Users</span>
                  {isTopSkilledUsers && <div className="nav-indicator"></div>}
                </Link>
              </li>
            </ul>
          </nav>

          <div className="admin-sidebar-footer">
            <button onClick={handleLogout} className="export-btn">
              <FaSignOutAlt />
              Logout
            </button>
          </div>
        </aside>


        <div className="admin-content-wrapper">
          <Outlet />
        </div>
      </div>
    </>
  );
};


export default AdminDashboard;