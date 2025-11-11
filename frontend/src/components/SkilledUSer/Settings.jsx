import { useState, useEffect } from 'react';
import api from '../../api.js';
import { useMainContext } from '../../mainContext';
import './settings.css';

const Settings = () => {
  const { user, setUser } = useMainContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [disabledFields, setDisabledFields] = useState({});
  const [passwordLength, setPasswordLength] = useState(0);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    fetchUserProfile();
    fetchPasswordLength();
  }, []);

    const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/me');
      if (response.data.success) {
        const userData = response.data.user;
        setUser(userData);
        setFormData({
          username: userData.username || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
        });
      }
    } catch (err) {
      setError('Failed to fetch profile data');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }; 

    const fetchPasswordLength = async () => {
        try {
        const res = await api.get("/user/me/password");
        if (res.data.success) setPasswordLength(res.data.length);
        } catch (err) {
        console.error("Failed to fetch password length:", err);
        }
    };


  const toggleField = (field) => {
    setDisabledFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({    
        ...prevData,
        [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.put('/userupdate-profile', formData);
        if (response.data.success) {
            setSuccess('Profile updated successfully');
            setUser(response.data.user);
        } else {
            setError('Failed to update profile');
        }
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    try {
      const res = await api.put('/user/password/update', { newPassword });
      if (res.data.success) {
        setSuccess('Password updated successfully');
        setIsEditingPassword(false);
        setPasswordLength(newPassword.length);
        setNewPassword('');
      } else {
        setError('Failed to update password');
      }
    } catch (err) {
      console.error('Error updating password:', err);
      setError('Error updating password');
    }
  };
  
  const maskPassword = (length) => '*'.repeat(length || 0);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="general-settings-container">
        <div className="settings-container-title">
            <h2>General Settings</h2>
        </div>

        {error && <p className="error-text">{error}</p>}
        {success && <p className="success-text">{success}</p>}

        <form onSubmit={handleSubmit}>
            <div className="setting-form-container">
                <div className="settings-input">
                    <label>Username:</label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        disabled={disabledFields['username']}
                        required
                    />
                    <button type="button" onClick={() => toggleField('username')}>
                        {disabledFields['username'] ? "EDIT" : "CANCEL"}
                    </button>
                </div>

                <div className="settings-input">
                    <label>Firstname:</label>
                    <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        disabled
                        required
                    />
                </div>
                <div className="settings-input">
                    <label>Password:</label>
                    <input
                    type={isEditingPassword ? "password" : "text"}
                    name="password"
                    value={
                        isEditingPassword ? newPassword : maskPassword(passwordLength)
                    }
                    onChange={(e) => setNewPassword(e.target.value)}
                    readOnly={!isEditingPassword}
                    placeholder={isEditingPassword ? "Enter new password" : ""}
                    />
                    <button
                    type="button"
                    onClick={() => {
                        setIsEditingPassword(!isEditingPassword);
                        setNewPassword('');
                    }}
                    >
                    {isEditingPassword ? "Cancel" : "Edit"}
                    </button>

                    {isEditingPassword && (
                    <button
                        type="button"
                        onClick={handlePasswordUpdate}
                        disabled={!newPassword}
                    >
                        Save
                    </button>
                    )}
                </div>
                
            </div>
        </form>

    </div>
  );
};

export default Settings;
