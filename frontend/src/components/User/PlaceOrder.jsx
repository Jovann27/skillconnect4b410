import React, { useState, useEffect } from 'react';
import { useMainContext } from '../../mainContext';
import api from '../../api';
import './PlaceOrder.css';

const PlaceOrder = () => {
  const { user } = useMainContext();

  const [formData, setFormData] = useState({
    name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
    address: '',
    phone: user?.phone || '',
    typeOfWork: '',
    time: '',
    favWorker: false,
    budget: '',
    note: ''
  });

  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Request location permissions on component mount
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    if (navigator.geolocation) {
      // For web, we'll handle permissions when getting location
      console.log('Geolocation is available');
    }
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });

        // Reverse geocode to get address
        await reverseGeocode(latitude, longitude);
        setLocationLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Failed to get your location. Please enter your address manually.');
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      // Using a free geocoding service (you might want to use Google Maps API or similar)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      const data = await response.json();

      if (data) {
        const formattedAddress = [
          data.localityInfo?.administrative?.[2]?.name,
          data.city,
          data.principalSubdivision,
          data.countryName
        ].filter(Boolean).join(', ');

        setFormData(prev => ({ ...prev, address: formattedAddress }));
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      alert('Failed to get address from location. Please enter your address manually.');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      alert('Please enter your full name');
      return false;
    }
    if (!formData.address.trim()) {
      alert('Please enter your address');
      return false;
    }
    if (!formData.phone.trim()) {
      alert('Please enter your phone number');
      return false;
    }
    if (!formData.typeOfWork) {
      alert('Please select type of work');
      return false;
    }
    if (!formData.time) {
      alert('Please select preferred time');
      return false;
    }
    return true;
  };

  const handleOrder = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const requestData = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        typeOfWork: formData.typeOfWork,
        time: formData.time,
        budget: formData.budget ? parseFloat(formData.budget) : 0,
        notes: formData.note.trim(),
        location: location, // Send location coordinates if available
      };

      const response = await api.post('/post-service-request', requestData);

      if (response.data.success) {
        alert('Service request posted successfully!');
        // Reset form
        setFormData({
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
          address: '',
          phone: user?.phone || '',
          typeOfWork: '',
          time: '',
          favWorker: false,
          budget: '',
          note: ''
        });
        setLocation(null);
      } else {
        alert(response.data.message || 'Failed to post service request');
      }
    } catch (error) {
      console.error('Error posting service request:', error);
      const errorMessage = error.response?.data?.message || 'Network error. Please check your connection and try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="place-order-container">
      <div className="place-order-header">
        <h1>Place Service Request</h1>
        <p>Fill in the details for your service request</p>
      </div>

      <div className="place-order-form">
        {/* Full Name */}
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            className="form-input"
            value={formData.name}
            placeholder="Enter your full name"
            onChange={(e) => handleInputChange('name', e.target.value)}
          />
        </div>

        {/* Address */}
        <div className="form-group">
          <label className="form-label">Address</label>
          <div className="address-input-group">
            <input
              type="text"
              className="form-input address-input"
              value={formData.address}
              placeholder="Enter your address"
              onChange={(e) => handleInputChange('address', e.target.value)}
            />
            <button
              type="button"
              className="location-btn"
              onClick={getCurrentLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <div className="spinner"></div>
              ) : (
                <i className="fas fa-map-marker-alt"></i>
              )}
            </button>
          </div>
          {location && (
            <div className="location-info">
              <small>Location detected: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}</small>
            </div>
          )}
        </div>

        {/* Phone Number */}
        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input
            type="tel"
            className="form-input"
            value={formData.phone}
            placeholder="09xxxxxxxxx"
            onChange={(e) => handleInputChange('phone', e.target.value)}
            maxLength="11"
          />
        </div>

        {/* Type of Work */}
        <div className="form-group">
          <label className="form-label">Type of Work</label>
          <select
            className="form-select"
            value={formData.typeOfWork}
            onChange={(e) => handleInputChange('typeOfWork', e.target.value)}
          >
            <option value="">Select work type</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Electrical">Electrical</option>
            <option value="Carpentry">Carpentry</option>
            <option value="Painting">Painting</option>
            <option value="Cleaning">Cleaning</option>
          </select>
        </div>

        {/* Preferred Time */}
        <div className="form-group">
          <label className="form-label">Preferred Time</label>
          <select
            className="form-select"
            value={formData.time}
            onChange={(e) => handleInputChange('time', e.target.value)}
          >
            <option value="">Select time</option>
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
            <option value="Evening">Evening</option>
          </select>
        </div>

        {/* Favorite Worker Toggle */}
        <div className="form-group">
          <div className="switch-group">
            <label className="form-label">Assign to favourite worker first</label>
            <label className="switch">
              <input
                type="checkbox"
                checked={formData.favWorker}
                onChange={(e) => handleInputChange('favWorker', e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {/* Budget */}
        <div className="form-group">
          <label className="form-label">Budget (₱)</label>
          <input
            type="number"
            className="form-input"
            value={formData.budget}
            placeholder="Enter budget amount"
            onChange={(e) => handleInputChange('budget', e.target.value)}
            min="0"
          />
        </div>

        {/* Note to Worker */}
        <div className="form-group">
          <label className="form-label">Note to Worker</label>
          <textarea
            className="form-textarea"
            placeholder="Additional instructions (optional)"
            value={formData.note}
            onChange={(e) => handleInputChange('note', e.target.value)}
            rows="4"
          />
        </div>

        {/* Submit Button */}
        <button
          className={`submit-btn ${loading ? 'loading' : ''}`}
          onClick={handleOrder}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              Placing Order...
            </>
          ) : (
            <>
              <i className="fas fa-paper-plane"></i>
              Place Order
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PlaceOrder;
