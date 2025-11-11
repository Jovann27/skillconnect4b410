import { useState, useEffect } from 'react';
import api from '../../api';
import './dashboard-content.css';
const ManageProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    otherContact: '',
    address: '',
    birthdate: '',
    occupation: '',
    employed: false,
    role: 'Community Member',
    isApplyingProvider: false,
    skills: '',
    profilePic: null,
    validId: null,
    certificates: null,
    availability: 'Not Available',
    acceptedWork: false
  });
  useEffect(() => {
    const loadProfile = async () => {
      await fetchUserProfile();
    };
    loadProfile();
  }, []);

  // Removed signed URL fetching since validId is now only images
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
          otherContact: userData.otherContact || '',
          address: userData.address || '',
          birthdate: userData.birthdate ? userData.birthdate.split('T')[0] : '',
          occupation: userData.occupation || '',
          employed: userData.employed || false,
          role: userData.role || 'Community Member',
          isApplyingProvider: userData.isApplyingProvider || false,
          skills: Array.isArray(userData.skills) ? userData.skills.join(', ') : (typeof userData.skills === 'string' ? userData.skills.split(',').map(s => s.trim()).join(', ') : ''),
          profilePic: null,
          validId: null,
          certificates: null,
          availability: userData.availability || 'Not Available',
          acceptedWork: userData.acceptedWork || false
        });
      }
    } catch (err) {
      setError('Failed to fetch profile data');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'certificates' ? files : files[0]
    }));
  };
  // Removed unused function

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updateData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'profilePic' && key !== 'validId' && key !== 'certificates') {
          if (key === 'skills') {
            const skillsArray = formData[key].split(',').map(skill => skill.trim()).filter(Boolean);
            updateData.append(key, JSON.stringify(skillsArray));
          } else if (key === 'employed') {
            updateData.append(key, formData[key].toString());
          } else {
            updateData.append(key, formData[key]);
          }
        }
      });
      if (formData.profilePic) {
        updateData.append('profilePic', formData.profilePic);
      }
      if (formData.validId) {
        updateData.append('validId', formData.validId);
      }
      if (formData.certificates) {
        updateData.append('certificates', formData.certificates);
      }
      const response = await api.put('/user/update-profile', updateData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.success) {
        setSuccess('Profile updated successfully!');
        fetchUserProfile();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2"></div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Profile Not Found</h2>
          <p className="text-gray-600">Unable to load your profile data.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="main-content">
      <div className="profile-wrapper">
        <h1 className="page-title">Account Management</h1>
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        {success && (
          <div className="success-message">
            {success}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="profile-header">
            <div className="profile-avatar-section">
              <div className="avatar-container">
                <img
                  src={user.profilePic || '/default-avatar.png'}
                  alt="Profile"
                  className="profile-avatar"
                />
                <label htmlFor="profilePicInput" className="avatar-edit-overlay">
                  <span className="edit-icon">📷</span>
                </label>
                <input
                  type="file"
                  id="profilePicInput"
                  name="profilePic"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled
                  style={{ display: 'none' }}
                />
              </div>
              <div className="profile-info">
                <h3>{user.firstName} {user.lastName}</h3>
                <p>{user.occupation}</p>
              </div>
              <div className="form-group form-group-center">
                <button
                  type="submit"
                  className="btn-primary btn-save"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>
          <div className="form-sections">
            <div className="form-section">
              <h2 className="section-title">Personal Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    disabled
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    disabled
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    disabled
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    disabled
                    className="form-textarea"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Birth Date
                  </label>
                  <input
                    type="date"
                    id="birthdate"
                    name="birthdate"
                    value={formData.birthdate}
                    onChange={handleInputChange}
                    required
                    disabled
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Occupation
                  </label>
                  <input
                    type="text"
                    id="occupation"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                    placeholder="e.g., Software Developer, Electrician, etc."
                    disabled
                    className="form-input"
                  />
                </div>
              </div>
            </div>
            <div className="form-section">
              <h2 className="section-title">Contact Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    disabled
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Other Contact
                  </label>
                  <input
                    type="text"
                    id="otherContact"
                    name="otherContact"
                    value={formData.otherContact}
                    onChange={handleInputChange}
                    placeholder="Alternative phone or contact method"
                    disabled
                    className="form-input"
                  />
                </div>
              </div>
            </div>
            <div className="form-section">
              <h2 className="section-title">Documents</h2>
              <div className="form-group">
                <label className="form-label">
                  Valid ID
                </label>
                {user.validId && (
                  <div className="document-preview">
                    <p>Current ID:</p>
                    <img src={user.validId} alt="Valid ID" className="document-image" />
                  </div>
                )}
                
              </div>
              <div className="form-group">
                <label className="form-label">
                  Certificates
                </label>
                {user.certificates && user.certificates.length > 0 && (
                  <div className="document-preview">
                    <p>Current Certificates:</p>
                    <div className="certificate-grid">
                      {user.certificates.map((cert, index) => (
                        cert.endsWith('.pdf') ? (
                          <iframe
                            key={index}
                            src={cert}
                            width="100%"
                            height="200"
                            title={`Certificate ${index + 1}`}
                          />
                        ) : (
                          <img key={index} src={cert} alt={`Certificate ${index + 1}`} className="document-image" />
                        )
                      ))}
                    </div>
                  </div>
                )}
                
              </div>
            </div>
            
          </div>
        </form>
      </div>
    </div>
  );
};
export default ManageProfile;
