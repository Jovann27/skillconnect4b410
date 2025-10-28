import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FaShoppingCart,
  FaClipboardList,
  FaQuestionCircle,
  FaPlus,
  FaTools,
  FaUser,
  FaTimes,
} from "react-icons/fa";
import api from "../../api";
import "./user-dashboard.css";


const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get('/user/me');
        if (response.data.success) {
          const userData = response.data.user;
          setUser({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            username: userData.username || '',
            role: userData.role || 'Community Member',
            occupation: userData.occupation || '',
            profilePic: userData.profilePic || '/default-avatar.png',
            verified: userData.verified || false,
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to fetch profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 320) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user && user.role === "Service Provider" && !user.verified && location.pathname !== "/user/records") {
      navigate("/user/request-service");
    }
  }, [user, navigate, location.pathname]);

  if (loading) {
    return <div className="loading">Loading user dashboard...</div>;
  }

  if (error || !user) {
    return <div className="error">{error || 'User not found'}</div>;
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  
  return (
    <div className="user-dashboard">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
            <FaTimes />
          </button>
        </div>
        <div className="logo">
          <img
            src={user.profilePic || "/default-avatar.png"}
            alt="User Avatar"
            className="avatar"
          />
          <h2>{user.firstName || ''} {user.lastName || ''}</h2>
          <p>{user.occupation || "No occupation listed"} </p>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <ul className="links">
            {user.role === "Service Provider" && user.verified && (
              <li>
                <Link to="/user/my-service" className="sidebar-link">
                  <span className="icon"><FaTools /></span>
                  <span className="text">My Service</span>
                </Link>
              </li>
            )}
            <li>
              <Link to="/user/manage-profile" className="sidebar-link">
                <span className="icon"><FaPlus /></span>
                <span className="text">Manage Profile</span>
              </Link>
            </li>
            <li>
              <Link to="/user/request-service" className="sidebar-link">
                <span className="icon"><FaShoppingCart /></span>
                <span className="text">Book Service</span>
              </Link>
            </li>
            <li>
              <Link to="/user/records" className="sidebar-link">
                <span className="icon"><FaClipboardList /></span>
                <span className="text">My Records</span>
              </Link>
            </li>
            <li>
              <Link to="/user/help" className="sidebar-link">
                <span className="icon"><FaQuestionCircle /></span>
                <span className="text">Help</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      <div className={`content-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <button className="mobile-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
          <FaUser />
        </button>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;
