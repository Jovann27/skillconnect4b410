import { Link, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FaShoppingCart,
  FaClipboardList,
  FaUsers,
  FaCog,
  FaQuestionCircle,
  FaPlus,
  FaTools,
} from "react-icons/fa";
import api from "../../api";
import "./user-dashboard.css";


const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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


  if (!user) {
    return <div className="loading">Loading user dashboard...</div>;
  }

  return (
    <div className="user-dashboard">
      <aside className="sidebar">
        <div className="logo">
          <img
            src={user.profilePic || "/default-avatar.png"}
            alt="User Avatar"
            className="avatar"
          />
          <h2>{user.firstName || ''} {user.lastName || ''}</h2>
          <p>{user.occupation || "No occupation listed"}</p>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <ul className="links">
            <li>
              <Link to="/user/my-service" className="sidebar-link">
                <span className="icon"><FaTools /></span>
                <span className="text">My Service</span>
              </Link>
            </li>
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
              <Link to="/user/settings" className="sidebar-link">
                <span className="icon"><FaCog /></span>
                <span className="text">Settings</span>
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

      <div className="content-wrapper">
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;
