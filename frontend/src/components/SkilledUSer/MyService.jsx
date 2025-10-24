import React, { useState, useEffect, useRef } from 'react';
import api from '../../api.js';
import { useMainContext } from '../../mainContext';
import toast from 'react-hot-toast';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './dashboard-content.css';
import './user-dashboard.css';
import './MyService.css';

const MyService = () => {
  const { user, isAuthorized } = useMainContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [services, setServices] = useState([
    { id: 1, name: 'Plumbing', rate: 90, description: 'Ako ay magaling mag ayos ng tubo' }
  ]);
  const [clientData, setClientData] = useState({
    name: '',
    phone: '',
    service: '',
    cost: 0,
    date: '',
    address: ''
  });
  const [currentRequest, setCurrentRequest] = useState(null);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    const fetchServiceData = async () => {
      try {

        if (!isAuthorized || !user) {
          console.log('MyService - User not authenticated or no user data');
          setLoading(false);
          return;
        }

        // Try to fetch existing service data
        const response = await api.get('/user/service-profile');
        if (response.data.success) {
          const data = response.data.data;
          setFormData({
            service: data.service || '',
            rate: data.rate || '',
            description: data.description || ''
          });
          setIsOnline(data.isOnline !== false); // Default to true
        }
      } catch (error) {
       
        setIsOnline(true);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceData();
  }, [user, isAuthorized]);

  useEffect(() => {
    const fetchMatchingRequests = async () => {
      if (!isAuthorized || !user) return;

      setLoadingRequests(true);
      try {
        const response = await api.get('/user/matching-requests');
        if (response.data.success && response.data.requests.length > 0) {
          const request = response.data.requests[0]; // Take the first matching request
          setCurrentRequest(request);
          setClientData({
            name: request.requester?.firstName + ' ' + request.requester?.lastName || request.name,
            phone: request.requester?.phone || request.phone,
            service: request.typeOfWork,
            cost: request.budget,
            date: request.time,
            address: request.address
          });
        }
      } catch (error) {
        console.log('No matching requests found');
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchMatchingRequests();
  }, [user, isAuthorized]);

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationLoading(false);
        },
        (error) => {
          console.log('Error getting location:', error);
          toast.error('Unable to access your location. Using default map view.');
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      setLocationLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mapContainer.current && !map.current && !locationLoading) {
      const initialCenter = userLocation ? [userLocation.lng, userLocation.lat] : [121.0, 14.0];

      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'osm': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              maxzoom: 19
            }
          },
          layers: [{
            id: 'osm',
            type: 'raster',
            source: 'osm'
          }]
        },
        center: initialCenter,
        zoom: userLocation ? 15 : 12
      });

      // Add marker for current location if available
      if (userLocation) {
        new maplibregl.Marker({ color: '#FF0000' })
          .setLngLat([userLocation.lng, userLocation.lat])
          .addTo(map.current);
      }
    }
  }, [userLocation, locationLoading]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStatusToggle = async () => {
    try {
      const response = await api.put('/user/service-status', {
        isOnline: !isOnline
      });
      if (response.data.success) {
        setIsOnline(!isOnline);
        toast.success(`Status updated to ${!isOnline ? 'Online' : 'Offline'}`);
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await api.post('/user/service-profile', formData);
      if (response.data.success) {
        toast.success('Service profile updated successfully!');
      }
    } catch (error) {
      toast.error('Failed to save service profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAccept = async () => {
    if (!currentRequest) return;

    try {
      const response = await api.post(`/user/service-request/${currentRequest._id}/accept`);
      if (response.data.success) {
        toast.success('Request accepted successfully!');
        // Clear the current request
        setCurrentRequest(null);
        setClientData({
          name: '',
          phone: '',
          service: '',
          cost: 0,
          date: '',
          address: ''
        });
      }
    } catch (error) {
      toast.error('Failed to accept request');
    }
  };

  const handleDecline = async () => {
    if (!currentRequest) return;

    try {
      // For now, just clear the request. In a real app, you might want to mark it as declined
      setCurrentRequest(null);
      setClientData({
        name: '',
        phone: '',
        service: '',
        cost: 0,
        date: '',
        address: ''
      });
      toast.success('Request declined');
    } catch (error) {
      toast.error('Failed to decline request');
    }
  };



  if (loading) {
    return (
      <div className="main-content">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!isAuthorized || !user) {
    return (
      <div className="main-content">
        <div className="auth-required-container">
          <i className="fas fa-user-lock auth-icon"></i>
          <h3 className="auth-title">Authentication Required</h3>
          <p className="auth-message">Please log in to access your service statistics.</p>
          <button onClick={() => window.location.href = '/login'} className="login-button">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Debug user data
  console.log('MyService - Rendering with user:', user);
  console.log('MyService - User properties:', {
    firstName: user?.firstName,
    lastName: user?.lastName,
    username: user?.username,
    email: user?.email,
    phone: user?.phone,
    profilePic: user?.profilePic
  });

  return (
    <div className="main-content">


      <div className="content-layout">
        {/* Left Column: Services and Status */}
        <div className="left-column">
          {/* Your Services */}
          <div className="services-section">
            <h3>Your Services:</h3>
            <div className="services-list">
              {services.map((service) => (
                <div key={service.id} className="service-item">
                  <div className="service-header">
                    <span className="service-name">{service.name}</span>
                    <span className="service-rate">₱{service.rate}</span>
                  </div>
                  <p className="service-description">{service.description}</p>
                  <button className="edit-button">EDIT</button>
                </div>
              ))}
            </div>
            <button className="add-service-button">ADD SERVICE</button>
            <button className="save-changes-button">SAVE CHANGES</button>
          </div>

          {/* Online/Offline Toggle */}
          <div className="status-toggle-section">
            <div className={`status-toggle ${isOnline ? 'online' : 'offline'}`}>
              <span className="status-text">{isOnline ? 'Online' : 'Offline'}</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={isOnline}
                  onChange={handleStatusToggle}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Map */}
        <div className="right-column">
          {locationLoading ? (
            <div className="map-loading">
              <div className="spinner"></div>
              <p>Getting your current location...</p>
            </div>
          ) : (
            <div ref={mapContainer} className="map-container" />
          )}
        </div>
      </div>



      {/* Client Information */}
      <div className="client-section">
        {loadingRequests ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading matching requests...</p>
          </div>
        ) : currentRequest ? (
          <div className="client-form">
            <div className="client-header">
              <span className="client-label">Client</span>
              <span className="place-order-text">"place order by the client"</span>
            </div>
            <div className="client-details">
              <div className="client-field">
                <label>Name</label>
                <input type="text" value={clientData.name} readOnly />
              </div>
              <div className="client-field">
                <label>Phone</label>
                <input type="text" value={clientData.phone} readOnly />
              </div>
              <div className="client-field">
                <label>Service Needed</label>
                <input type="text" value={clientData.service} readOnly />
              </div>
              <div className="client-field">
                <label>Estimated Service Cost</label>
                <input type="number" value={clientData.cost} readOnly />
              </div>
              <div className="client-field">
                <label>Date</label>
                <input type="text" value={clientData.date} readOnly />
              </div>
              <div className="client-field">
                <label>Address</label>
                <input type="text" value={clientData.address} readOnly />
              </div>
            </div>
            <div className="client-actions">
              <button className="accept-button" onClick={handleAccept}>Accept</button>
              <button className="decline-button" onClick={handleDecline}>Decline</button>
            </div>
          </div>
        ) : (
          <div className="no-requests">
            <p>No matching requests found. Requests will appear here when a client's budget matches your service rate.</p>
          </div>
        )}
        <div className="note">
          <p>*Every order will show below the service provider info - Scrollable so you can see if there's a lot of booking*</p>
        </div>
      </div>
    </div>
  );
};

export default MyService;
