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
  const isDashboardHome = location.pathname === '/admin/dashboard';
  const { setAdmin, setIsAuthorized, setTokenType, tokenType, authLoaded, logout } = useMainContext();
 
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const { data } = await api.get("/admin/auth/me");
        setAdmin(data.admin);
        setIsAuthorized(true);
        setTokenType("admin");
        return;
      } catch (error) {
        setIsAuthorized(false);
        setAdmin(null);
        setTokenType(null);
        navigate("/admin/login");
        console.error("Failed to fetch admin data:", error);
      }
    };

    if (!authLoaded) return; // wait until mainContext finishes restoring

    if (tokenType !== "admin") {
      return;
    }

    fetchAdminData();
  }, [navigate, setAdmin, setIsAuthorized, setTokenType, tokenType, authLoaded]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/");
    }
  };

  const displayName = "Admin";
  const profilePic = "default-avatar.png";

  return (
    <div className="analytics-container">
      <header className="admin-top-header">
        <div className="admin-logo">
          <img src="https://via.placeholder.com/40" alt="Logo" />
          SkillConnect4B410
        </div>
        <nav className="admin-nav-menu">
          <li><Link to="/" className="admin-nav-menu-link">HOME</Link></li>
          <li><Link to="/about" className="admin-nav-menu-link">ABOUT</Link></li>
          <li><Link to="/admin/dashboard" className={`admin-nav-menu-link ${isDashboardHome ? 'active' : ''}`}>DASHBOARD</Link></li>
        </nav>
        <button className="logout-header-btn" onClick={handleLogout}>
          <FaSignOutAlt /> LOGOUT
        </button>
      </header>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-avatar-container">
            <img
              src={`http://localhost:4000/uploads/${profilePic}`}
              alt="Administrator Profile"
              className="admin-avatar"
            />
            <div className="admin-status-indicator"></div>
          </div>
          <h2 className="admin-name">{displayName}</h2>
          <p className="admin-role">System Administrator</p>
        </div>

        <nav className="admin-sidebar-nav" role="navigation" aria-label="Admin navigation">
          <ul className="admin-nav-links">
            <li>
              <Link to="/admin/dashboard" className={`admin-nav-link ${isDashboardHome ? 'active' : ''}`}>
                <FaHome className="nav-icon" />
                <span className="nav-text">Dashboard Home</span>
                {isDashboardHome && <div className="nav-indicator"></div>}
              </Link>
            </li>
            <li>
              <Link to="/admin/jobfairs" className="admin-nav-link">
                <FaCalendarAlt className="nav-icon" />
                <span className="nav-text">Job Fairs</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/service-requests" className="admin-nav-link">
                <FaClipboardList className="nav-icon" />
                <span className="nav-text">Service Requests</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/users" className="admin-nav-link">
                <FaUsers className="nav-icon" />
                <span className="nav-text">User Management</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/service-providers" className="admin-nav-link">
                <FaTools className="nav-icon" />
                <span className="nav-text">Service Providers</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-logout-btn" onClick={handleLogout}>
            <FaSignOutAlt className="logout-icon" />
            Logout
          </button>
        </div>
      </aside>

      <div className="admin-content-wrapper">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminDashboard;
