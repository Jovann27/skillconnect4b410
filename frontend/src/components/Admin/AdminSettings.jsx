import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaCog,
  FaUserShield,
  FaBell,
  FaRobot,
  FaTools,
  FaInfoCircle,
  FaFileContract,
  FaUsers,
  FaLock,
  FaDatabase,
  FaPalette,
  FaChartLine,
  FaHistory,
  FaServer,
  FaSave,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaSync,
  FaDownload,
  FaUpload
} from 'react-icons/fa';


const AdminSettings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      siteName: 'SkillConnect4B410',
      siteEmail: 'admin@skillconnect.com',
      maintenanceMode: false,
      debugMode: false
    },
    admin: {
      sessionTimeout: 30,
      passwordMinLength: 8,
      requireTwoFactor: false,
      maxLoginAttempts: 5
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      notificationFrequency: 'daily'
    },
    automation: {
      autoBackup: true,
      backupFrequency: 'weekly',
      autoCleanup: true,
      cleanupDays: 30
    },
    maintenance: {
      scheduledMaintenance: false,
      maintenanceMessage: 'System is under maintenance. Please try again later.',
      maintenanceStartTime: '',
      maintenanceEndTime: ''
    },
    security: {
      ipWhitelist: '',
      allowedOrigins: 'localhost:3000',
      rateLimitEnabled: true,
      rateLimitRequests: 100
    },
    api: {
      apiKeyEnabled: false,
      apiKeyExpiry: 30,
      apiRateLimit: 1000
    },
    theme: {
      primaryColor: '#0a84ff',
      secondaryColor: '#d6355d',
      darkMode: false
    }
  });
  const [saveStatus, setSaveStatus] = useState('');
  const [systemInfo, setSystemInfo] = useState({
    version: '1.0.0',
    uptime: '0 days, 0 hours, 0 minutes',
    lastBackup: 'Never',
    dbSize: '0 MB',
    activeUsers: 0,
    totalBookings: 0
  });


  useEffect(() => {
    // Fetch system information
    const fetchSystemInfo = async () => {
      try {
        // In a real app, this would be an API call
        const mockSystemInfo = {
          version: '1.0.0',
          uptime: '15 days, 7 hours, 32 minutes',
          lastBackup: '2023-06-15 02:30:00',
          dbSize: '245.7 MB',
          activeUsers: 1247,
          totalBookings: 3842
        };
        setSystemInfo(mockSystemInfo);
      } catch (error) {
        console.error('Failed to fetch system info:', error);
      }
    };


    fetchSystemInfo();
  }, []);


  const handleSettingChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };


  const saveSettings = async () => {
    setSaveStatus('saving');
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };


  const handleBackup = async () => {
    try {
      // In a real app, this would trigger a backup API call
      setSaveStatus('backup');
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSaveStatus('backup-success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Backup failed:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };


  const renderSettingsContent = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="settings-content">
            <h2 className="section-title">General Settings</h2>
            <div className="settings-form">
              <div className="form-group">
                <label htmlFor="siteName">Site Name</label>
                <input
                  type="text"
                  id="siteName"
                  value={settings.general.siteName}
                  onChange={(e) => handleSettingChange('general', 'siteName', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="siteEmail">Site Email</label>
                <input
                  type="email"
                  id="siteEmail"
                  value={settings.general.siteEmail}
                  onChange={(e) => handleSettingChange('general', 'siteEmail', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.general.maintenanceMode}
                    onChange={(e) => handleSettingChange('general', 'maintenanceMode', e.target.checked)}
                  />
                  Maintenance Mode
                </label>
                <p className="form-help">When enabled, the site will display a maintenance message to all users except administrators.</p>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.general.debugMode}
                    onChange={(e) => handleSettingChange('general', 'debugMode', e.target.checked)}
                  />
                  Debug Mode
                </label>
                <p className="form-help">Enable detailed error logging and debugging information.</p>
              </div>
            </div>
          </div>
        );
     
      case 'admin':
        return (
          <div className="settings-content">
            <h2 className="section-title">Admin Account Management</h2>
            <div className="settings-form">
              <div className="form-group">
                <label htmlFor="sessionTimeout">Session Timeout (minutes)</label>
                <input
                  type="number"
                  id="sessionTimeout"
                  min="5"
                  max="120"
                  value={settings.admin.sessionTimeout}
                  onChange={(e) => handleSettingChange('admin', 'sessionTimeout', parseInt(e.target.value))}
                />
                <p className="form-help">Administrators will be automatically logged out after this period of inactivity.</p>
              </div>
              <div className="form-group">
                <label htmlFor="passwordMinLength">Minimum Password Length</label>
                <input
                  type="number"
                  id="passwordMinLength"
                  min="6"
                  max="20"
                  value={settings.admin.passwordMinLength}
                  onChange={(e) => handleSettingChange('admin', 'passwordMinLength', parseInt(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.admin.requireTwoFactor}
                    onChange={(e) => handleSettingChange('admin', 'requireTwoFactor', e.target.checked)}
                  />
                  Require Two-Factor Authentication
                </label>
                <p className="form-help">Require administrators to use two-factor authentication for enhanced security.</p>
              </div>
              <div className="form-group">
                <label htmlFor="maxLoginAttempts">Maximum Login Attempts</label>
                <input
                  type="number"
                  id="maxLoginAttempts"
                  min="3"
                  max="10"
                  value={settings.admin.maxLoginAttempts}
                  onChange={(e) => handleSettingChange('admin', 'maxLoginAttempts', parseInt(e.target.value))}
                />
                <p className="form-help">Number of failed login attempts before account is temporarily locked.</p>
              </div>
            </div>
          </div>
        );
     
      case 'notifications':
        return (
          <div className="settings-content">
            <h2 className="section-title">Notification Settings</h2>
            <div className="settings-form">
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.notifications.emailNotifications}
                    onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                  />
                  Email Notifications
                </label>
                <p className="form-help">Receive important system notifications via email.</p>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.notifications.smsNotifications}
                    onChange={(e) => handleSettingChange('notifications', 'smsNotifications', e.target.checked)}
                  />
                  SMS Notifications
                </label>
                <p className="form-help">Receive critical alerts via SMS message.</p>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.notifications.pushNotifications}
                    onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                  />
                  Push Notifications
                </label>
                <p className="form-help">Receive browser push notifications when logged in.</p>
              </div>
              <div className="form-group">
                <label htmlFor="notificationFrequency">Notification Frequency</label>
                <select
                  id="notificationFrequency"
                  value={settings.notifications.notificationFrequency}
                  onChange={(e) => handleSettingChange('notifications', 'notificationFrequency', e.target.value)}
                >
                  <option value="immediate">Immediate</option>
                  <option value="hourly">Hourly Digest</option>
                  <option value="daily">Daily Digest</option>
                  <option value="weekly">Weekly Digest</option>
                </select>
              </div>
            </div>
          </div>
        );
     
      case 'automation':
        return (
          <div className="settings-content">
            <h2 className="section-title">Automation Settings</h2>
            <div className="settings-form">
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.automation.autoBackup}
                    onChange={(e) => handleSettingChange('automation', 'autoBackup', e.target.checked)}
                  />
                  Automatic Backups
                </label>
                <p className="form-help">Automatically create system backups at regular intervals.</p>
              </div>
              <div className="form-group">
                <label htmlFor="backupFrequency">Backup Frequency</label>
                <select
                  id="backupFrequency"
                  value={settings.automation.backupFrequency}
                  onChange={(e) => handleSettingChange('automation', 'backupFrequency', e.target.value)}
                  disabled={!settings.automation.autoBackup}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.automation.autoCleanup}
                    onChange={(e) => handleSettingChange('automation', 'autoCleanup', e.target.checked)}
                  />
                  Automatic Cleanup
                </label>
                <p className="form-help">Automatically remove old logs and temporary files.</p>
              </div>
              <div className="form-group">
                <label htmlFor="cleanupDays">Cleanup Retention (days)</label>
                <input
                  type="number"
                  id="cleanupDays"
                  min="7"
                  max="365"
                  value={settings.automation.cleanupDays}
                  onChange={(e) => handleSettingChange('automation', 'cleanupDays', parseInt(e.target.value))}
                  disabled={!settings.automation.autoCleanup}
                />
                <p className="form-help">Keep logs and temporary files for this many days before cleanup.</p>
              </div>
              <div className="form-group">
                <button className="btn btn-primary" onClick={handleBackup}>
                  <FaDownload /> Create Backup Now
                </button>
              </div>
            </div>
          </div>
        );
     
      case 'maintenance':
        return (
          <div className="settings-content">
            <h2 className="section-title">System Maintenance</h2>
            <div className="settings-form">
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.maintenance.scheduledMaintenance}
                    onChange={(e) => handleSettingChange('maintenance', 'scheduledMaintenance', e.target.checked)}
                  />
                  Scheduled Maintenance
                </label>
                <p className="form-help">Schedule a maintenance window for system updates.</p>
              </div>
              <div className="form-group">
                <label htmlFor="maintenanceMessage">Maintenance Message</label>
                <textarea
                  id="maintenanceMessage"
                  rows="3"
                  value={settings.maintenance.maintenanceMessage}
                  onChange={(e) => handleSettingChange('maintenance', 'maintenanceMessage', e.target.value)}
                  disabled={!settings.maintenance.scheduledMaintenance}
                ></textarea>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="maintenanceStartTime">Start Time</label>
                  <input
                    type="datetime-local"
                    id="maintenanceStartTime"
                    value={settings.maintenance.maintenanceStartTime}
                    onChange={(e) => handleSettingChange('maintenance', 'maintenanceStartTime', e.target.value)}
                    disabled={!settings.maintenance.scheduledMaintenance}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="maintenanceEndTime">End Time</label>
                  <input
                    type="datetime-local"
                    id="maintenanceEndTime"
                    value={settings.maintenance.maintenanceEndTime}
                    onChange={(e) => handleSettingChange('maintenance', 'maintenanceEndTime', e.target.value)}
                    disabled={!settings.maintenance.scheduledMaintenance}
                  />
                </div>
              </div>
              <div className="system-info">
                <h3>System Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Version:</span>
                    <span className="info-value">{systemInfo.version}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Uptime:</span>
                    <span className="info-value">{systemInfo.uptime}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Last Backup:</span>
                    <span className="info-value">{systemInfo.lastBackup}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Database Size:</span>
                    <span className="info-value">{systemInfo.dbSize}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Active Users:</span>
                    <span className="info-value">{systemInfo.activeUsers}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Total Bookings:</span>
                    <span className="info-value">{systemInfo.totalBookings}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
     
      case 'terms':
        return (
          <div className="settings-content">
            <h2 className="section-title">Terms & Policies</h2>
            <div className="policy-container">
              <div className="policy-section">
                <h3>Terms of Service</h3>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl.</p>
              </div>
              <div className="policy-section">
                <h3>Privacy Policy</h3>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl.</p>
              </div>
              <div className="policy-section">
                <h3>Cookie Policy</h3>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl.</p>
              </div>
              <div className="policy-section">
                <h3>Refund Policy</h3>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl.</p>
              </div>
            </div>
          </div>
        );
     
      case 'about':
        return (
          <div className="settings-content">
            <h2 className="section-title">About Us</h2>
            <div className="about-container">
              <div className="about-section">
                <h3>Our Mission</h3>
                <p>SkillConnect4B410 is dedicated to connecting skilled service providers with community members who need their expertise. Our platform makes it easy to find, book, and review services in your local area.</p>
              </div>
              <div className="about-section">
                <h3>Our Team</h3>
                <p>Our team consists of passionate developers, designers, and community organizers who believe in the power of local connections and skill sharing.</p>
              </div>
              <div className="about-section">
                <h3>Contact Information</h3>
                <div className="contact-info">
                  <p><strong>Email:</strong> admin@skillconnect.com</p>
                  <p><strong>Phone:</strong> (123) 456-7890</p>
                  <p><strong>Address:</strong> 123 Main Street, Anytown, USA 12345</p>
                </div>
              </div>
              <div className="about-section">
                <h3>Version History</h3>
                <div className="version-history">
                  <div className="version-item">
                    <span className="version-number">v1.0.0</span>
                    <span className="version-date">June 15, 2023</span>
                    <span className="version-desc">Initial release with core functionality</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
     
      default:
        return <div className="settings-content">Select a settings section</div>;
    }
  };


  return (
    <>
      <style>{`
        .admin-settings-container {
          display: flex;
          height: calc(100vh - 90px);
        }
       
        .settings-sidebar {
          width: 250px;
          background: #fff;
          box-shadow: 2px 0 6px rgba(0, 0, 0, 0.05);
          overflow-y: auto;
        }
       
        .settings-header {
          padding: 20px;
          border-bottom: 1px solid #f0f0f0;
        }
       
        .settings-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #333;
          margin: 0;
          display: flex;
          align-items: center;
        }
       
        .settings-title .icon {
          margin-right: 10px;
          color: #0a84ff;
        }
       
        .settings-nav {
          padding: 15px 0;
        }
       
        .nav-section {
          margin-bottom: 20px;
        }
       
        .nav-section-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: #888;
          text-transform: uppercase;
          padding: 0 20px;
          margin-bottom: 10px;
        }
       
        .nav-link {
          display: flex;
          align-items: center;
          padding: 12px 20px;
          color: #444;
          text-decoration: none;
          font-weight: 500;
          font-size: 0.9rem;
          transition: all 0.3s;
          position: relative;
        }
       
        .nav-link:hover {
          background: #f1f3f7;
        }
       
        .nav-link.active {
          background: #0a84ff;
          color: #fff;
        }
       
        .nav-icon {
          font-size: 1rem;
          margin-right: 10px;
        }
       
        .settings-content-wrapper {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          background: #f5f6fa;
        }
       
        .settings-content {
          background: #fff;
          border-radius: 10px;
          padding: 25px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
       
        .section-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #333;
          margin: 0 0 20px 0;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }
       
        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
       
        .form-group {
          display: flex;
          flex-direction: column;
        }
       
        .form-row {
          display: flex;
          gap: 20px;
        }
       
        .form-row .form-group {
          flex: 1;
        }
       
        label {
          font-weight: 500;
          margin-bottom: 8px;
          color: #333;
        }
       
        input[type="text"],
        input[type="email"],
        input[type="number"],
        input[type="datetime-local"],
        select,
        textarea {
          padding: 10px 15px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.9rem;
        }
       
        .checkbox-label {
          display: flex;
          align-items: center;
          font-weight: 500;
          cursor: pointer;
        }
       
        .checkbox-label input {
          margin-right: 10px;
        }
       
        .form-help {
          font-size: 0.8rem;
          color: #666;
          margin-top: 5px;
        }
       
        .btn {
          padding: 10px 15px;
          border: none;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
       
        .btn-primary {
          background: #0a84ff;
          color: white;
        }
       
        .btn-primary:hover {
          background: #0077e6;
        }
       
        .save-status {
          position: fixed;
          top: 100px;
          right: 20px;
          padding: 10px 15px;
          border-radius: 6px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 1000;
        }
       
        .save-status.saving {
          background: #f8f9fa;
          color: #333;
          border: 1px solid #ddd;
        }
       
        .save-status.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
       
        .save-status.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
       
        .save-status.backup {
          background: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        }
       
        .save-status.backup-success {
          background: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        }
       
        .system-info {
          margin-top: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }
       
        .system-info h3 {
          margin: 0 0 15px 0;
          font-size: 1.1rem;
          color: #333;
        }
       
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 15px;
        }
       
        .info-item {
          display: flex;
          justify-content: space-between;
        }
       
        .info-label {
          font-weight: 500;
          color: #555;
        }
       
        .info-value {
          font-weight: 600;
          color: #333;
        }
       
        .policy-container,
        .about-container {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }
       
        .policy-section,
        .about-section {
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
       
        .policy-section:last-child,
        .about-section:last-child {
          border-bottom: none;
        }
       
        .policy-section h3,
        .about-section h3 {
          margin: 0 0 10px 0;
          font-size: 1.1rem;
          color: #333;
        }
       
        .contact-info p {
          margin: 5px 0;
        }
       
        .version-history {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
       
        .version-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
       
        .version-number {
          font-weight: 600;
          color: #0a84ff;
        }
       
        .version-date {
          font-size: 0.8rem;
          color: #666;
        }
       
        .version-desc {
          font-size: 0.9rem;
          color: #555;
        }
       
        .back-button {
          margin-bottom: 20px;
        }
       
        @media (max-width: 768px) {
          .admin-settings-container {
            flex-direction: column;
          }
         
          .settings-sidebar {
            width: 100%;
          }
         
          .form-row {
            flex-direction: column;
            gap: 0;
          }
        }
      `}</style>


      <div className="admin-settings-container">
        <aside className="settings-sidebar">
          <div className="settings-header">
            <h1 className="settings-title">
              <FaCog className="icon" />
              Settings
            </h1>
          </div>
         
          <nav className="settings-nav">
            <div className="nav-section">
              <div className="nav-section-title">Settings</div>
              <Link
                to="#"
                className={`nav-link ${activeSection === 'general' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection('general');
                }}
              >
                <FaCog className="nav-icon" />
                General Settings
              </Link>
              <Link
                to="#"
                className={`nav-link ${activeSection === 'admin' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection('admin');
                }}
              >
                <FaUserShield className="nav-icon" />
                Admin Account Management
              </Link>
              <Link
                to="#"
                className={`nav-link ${activeSection === 'notifications' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection('notifications');
                }}
              >
                <FaBell className="nav-icon" />
                Notifications
              </Link>
              <Link
                to="#"
                className={`nav-link ${activeSection === 'automation' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection('automation');
                }}
              >
                <FaRobot className="nav-icon" />
                Automation
              </Link>
              <Link
                to="#"
                className={`nav-link ${activeSection === 'maintenance' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection('maintenance');
                }}
              >
                <FaTools className="nav-icon" />
                System Maintenance
              </Link>
            </div>
           
            <div className="nav-section">
              <div className="nav-section-title">About</div>
              <Link
                to="#"
                className={`nav-link ${activeSection === 'terms' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection('terms');
                }}
              >
                <FaFileContract className="nav-icon" />
                Terms & Policies
              </Link>
              <Link
                to="#"
                className={`nav-link ${activeSection === 'about' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection('about');
                }}
              >
                <FaInfoCircle className="nav-icon" />
                About Us
              </Link>
            </div>
          </nav>
        </aside>


        <div className="settings-content-wrapper">
          <div className="back-button">
            <button className="btn btn-primary" onClick={() => navigate('/admin/dashboard')}>
              <FaTimes /> Back to Dashboard
            </button>
          </div>
         
          {renderSettingsContent()}
         
          {activeSection !== 'terms' && activeSection !== 'about' && (
            <div className="form-group" style={{ marginTop: '30px' }}>
              <button className="btn btn-primary" onClick={saveSettings}>
                <FaSave /> Save Settings
              </button>
            </div>
          )}
        </div>
      </div>


      {saveStatus && (
        <div className={`save-status ${saveStatus}`}>
          {saveStatus === 'saving' && <><FaSync className="spin" /> Saving settings...</>}
          {saveStatus === 'success' && <><FaCheck /> Settings saved successfully!</>}
          {saveStatus === 'error' && <><FaExclamationTriangle /> Error saving settings!</>}
          {saveStatus === 'backup' && <><FaSync className="spin" /> Creating backup...</>}
          {saveStatus === 'backup-success' && <><FaCheck /> Backup created successfully!</>}
        </div>
      )}
    </>
  );
};


export default AdminSettings;