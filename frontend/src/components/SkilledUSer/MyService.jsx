import { useState, useEffect, useRef } from 'react';
import api from '../../api.js';
import { useMainContext } from '../../mainContext';
import toast from 'react-hot-toast';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import socket from '../../utils/socket';
import './MyService.css';

const MyService = () => {
  const { user, isAuthorized } = useMainContext();
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [formData, setFormData] = useState({
    service: '',
    rate: '',
    description: ''
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [predefinedServices, setPredefinedServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [clientData, setClientData] = useState({
    name: '',
    phone: '',
    service: '',
    cost: 0,
    date: '',
    address: ''
  });
  const [currentRequests, setCurrentRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestsError, setRequestsError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [clientLocations, setClientLocations] = useState([]);
  const [locationLoading, setLocationLoading] = useState(true);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const userMarker = useRef(null);
  const clientMarkers = useRef({});

  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        if (!isAuthorized || !user) {
          console.log('MyService - User not authenticated or no user data');
          setLoading(false);
          return;
        }
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
    if (!isAuthorized || !user || user.role !== "Service Provider") return;

    const fetchMatchingRequests = async () => {
      setLoadingRequests(true);
      try {
        const response = await api.get('/user/matching-requests');
        if (response.data.success && response.data.requests.length > 0) {
          // Filter out requests from the current user
          const filteredRequests = response.data.requests.filter(request => request.requester?._id !== user._id);
          setCurrentRequests(filteredRequests);
          setRequestsError('');
        } else {
          setCurrentRequests([]);
          setRequestsError('No matching requests found.');
        }
      } catch (error) {
        console.log('User ID:', user._id); // Log user ID for debugging
        if (error.response && error.response.status === 403) {
          setRequestsError('Access denied. You must be a Service Provider.');
        } else {
          setRequestsError('No matching requests found.');
        }
        setCurrentRequests([]);
      } finally {
        setLoadingRequests(false);
      }
    };
    fetchMatchingRequests();
    socket.on("service-request-updated", (data) => {
      console.log("Service request updated:", data);
      fetchMatchingRequests();
    });
    return () => {
      socket.off("service-request-updated");
    };
  }, [user, isAuthorized]);

  useEffect(() => {
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

  // Use location from service requests
  useEffect(() => {
    if (currentRequests.length > 0) {
      const locations = [];
      for (const request of currentRequests) {
        if (request.location && request.location.lat && request.location.lng) {
          locations.push({
            requestId: request._id,
            coords: { lat: request.location.lat, lng: request.location.lng }
          });
        }
      }
      setClientLocations(locations);
    } else {
      setClientLocations([]);
    }
  }, [currentRequests]);

  useEffect(() => {
    if (mapContainer.current && !map.current && !locationLoading) {
      try {
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
          zoom: userLocation ? 15 : 12,
          attributionControl: true,
          failIfMajorPerformanceCaveat: false
        });

        // Add marker for current location if available
        if (userLocation) {
          userMarker.current = new maplibregl.Marker({
            color: '#FF0000',
            title: 'Your Location'
          })
          .setLngLat([userLocation.lng, userLocation.lat])
          .addTo(map.current);
        }

        // Handle map resize
        const handleResize = () => {
          if (map.current) {
            map.current.resize();
          }
        };

        window.addEventListener('resize', handleResize);

        // Handle map load event
        map.current.on('load', () => {
          console.log('Map loaded successfully');
        });

        // Handle map errors
        map.current.on('error', (e) => {
          console.error('Map error:', e);
        });

        // Cleanup
        return () => {
          window.removeEventListener('resize', handleResize);
          if (map.current) {
            map.current.remove();
            map.current = null;
          }
          // Clear client markers
          Object.values(clientMarkers.current).forEach(marker => marker.remove());
          clientMarkers.current = {};
        };
      } catch (error) {
        console.error('Error initializing map:', error);
        // Set locationLoading to false to prevent infinite loading
        setLocationLoading(false);
      }
    }
  }, [userLocation, locationLoading]);

  // Update user marker if userLocation changes
  useEffect(() => {
    if (map.current && userLocation) {
      if (userMarker.current) {
        userMarker.current.setLngLat([userLocation.lng, userLocation.lat]);
      } else {
        userMarker.current = new maplibregl.Marker({ color: '#FF0000' })
          .setLngLat([userLocation.lng, userLocation.lat])
          .addTo(map.current);
      }
    }
  }, [userLocation]);

  // Update map when clientLocations changes
  useEffect(() => {
    if (map.current) {
      // Clear existing client markers
      Object.values(clientMarkers.current).forEach(marker => marker.remove());
      clientMarkers.current = {};

      // Add new client markers
      if (clientLocations.length > 0) {
        const bounds = new maplibregl.LngLatBounds();

        // Add user location to bounds if available
        if (userLocation) {
          bounds.extend([userLocation.lng, userLocation.lat]);
        }

        clientLocations.forEach((location) => {
          // Find the corresponding request to get additional info
          const request = currentRequests.find(req => req._id === location.requestId);
          if (request) {
            const marker = new maplibregl.Marker({
              color: '#007bff',
              title: `${request.requester?.firstName} ${request.requester?.lastName} - ${request.typeOfWork}`
            })
            .setLngLat([location.coords.lng, location.coords.lat])
            .addTo(map.current);

            clientMarkers.current[location.requestId] = marker;
            bounds.extend([location.coords.lng, location.coords.lat]);
          }
        });

        // Fit map to show all markers
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15
        });
      }
    }
  }, [clientLocations, userLocation, currentRequests]);

  useEffect(() => {
    const fetchPredefinedServices = async () => {
      if (!isAuthorized || !user) return;
      try {
        const response = await api.get('/user/predefined-services');
        if (response.data.success) {
          setPredefinedServices(response.data.services);
        }
      } catch (error) {
        console.error('Error fetching predefined services:', error);
      }
    };
    fetchPredefinedServices();
  }, [user, isAuthorized]);

  useEffect(() => {
    if (selectedService && predefinedServices.length > 0) {
      // Find the selected predefined service
      const selectedPredefinedService = predefinedServices.find(service => service.name === selectedService);
      if (selectedPredefinedService) {
        setFormData({
          service: selectedService,
          rate: selectedPredefinedService.rate,
          description: selectedPredefinedService.description
        });
        // Update service profile with the predefined values
        const updateServiceProfile = async () => {
          try {
            await api.post('/user/service-profile', {
              service: selectedService,
              rate: selectedPredefinedService.rate,
              description: selectedPredefinedService.description
            });
          } catch (error) {
            console.error('Error updating service profile:', error);
          }
        };
        updateServiceProfile();
      }
    }
  }, [selectedService, predefinedServices]);

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



  const handleAccept = async (requestId) => {
    try {
      const response = await api.post(`/user/service-request/${requestId}/accept`);
      if (response.data.success) {
        toast.success('Request accepted successfully!');
        setCurrentRequests(prev => prev.filter(req => req._id !== requestId));
        // Remove marker from map
        if (clientMarkers.current[requestId]) {
          clientMarkers.current[requestId].remove();
          delete clientMarkers.current[requestId];
        }
      }
    } catch (error) {
      toast.error('Failed to accept request');
    }
  };

  const handleDecline = async (requestId) => {
    try {
      setCurrentRequests(prev => prev.filter(req => req._id !== requestId));
      // Remove marker from map
      if (clientMarkers.current[requestId]) {
        clientMarkers.current[requestId].remove();
        delete clientMarkers.current[requestId];
      }
      toast.success('Request declined');
    } catch (error) {
      toast.error('Failed to decline request');
    }
  };

  const handleSaveService = async () => {
    try {
      const response = await api.post('/user/service-profile', editFormData);
      if (response.data.success) {
        setFormData({ ...editFormData });
        setShowEditModal(false);
        toast.success('Service profile updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update service profile');
    }
  };

  if (!isAuthorized || !user) {
    return (
      <div className="my-service-container">
        <div className="auth-required">
          <div className="auth-icon">🔒</div>
          <h3>Authentication Required</h3>
          <p>Please log in to access your service statistics.</p>
          <button className="btn-primary" onClick={() => window.location.href = '/login'}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (user.role !== "Service Provider") {
    return (
      <div className="my-service-container">
        <div className="auth-required">
          <div className="auth-icon">🚫</div>
          <h3>Access Denied</h3>
          <p>You must be a Service Provider to access this page.</p>
          <button className="btn-primary" onClick={() => window.location.href = '/user/manage-profile'}>
            Go to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-service-container">
      <div className="main-layout">
        <div className="left-column">
          <div className="services-section">
            <h3>Your Services:</h3>
            <div className="service-controls">
              <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)} className="form-input">
                <option value="">Select a service</option>
                {predefinedServices.map((service) => (
                  <option key={service._id} value={service.name}>{service.name}</option>
                ))}
              </select>
              <div className="status-toggle">
                <span className={`status-text ${isOnline ? 'online' : 'offline'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
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
            <div className="service-info">
              <p><strong>Service:</strong> {formData.service}</p>
              <p><strong>Rate:</strong> {formData.rate}</p>
              <p><strong>Description:</strong> {formData.description}</p>
            </div>
            <button className="btn-primary" onClick={() => {
              setEditFormData({ ...formData });
              setShowEditModal(true);
            }}>EDIT</button>
          </div>

          <div className="client-request-section">
            {loadingRequests ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading matching requests...</p>
              </div>
            ) : !isOnline ? (
              <div className="offline-message">
                <p>You are currently offline and cannot receive new requests. Please go online to start receiving requests.</p>
              </div>
            ) : currentRequests.length > 0 ? (
              <div className="requests-list">
                <h4>Matching Requests ({currentRequests.length})</h4>
                {currentRequests.map((request) => (
                  <div key={request._id} className="request-card">
                    <div className="request-header">
                      <span>Client Request</span>
                      <span>{new Date(request.time).toLocaleDateString()}</span>
                    </div>
                    <div className="request-details">
                      <p><strong>Name:</strong> {request.requester?.firstName} {request.requester?.lastName}</p>
                      <p><strong>Phone:</strong> {request.requester?.phone}</p>
                      <p><strong>Service Needed:</strong> {request.typeOfWork}</p>
                      <p><strong>Budget:</strong> ₱{request.budget}</p>
                      <p><strong>Address:</strong> {request.address}</p>
                    </div>
                    <div className="request-actions">
                      <button className="btn-primary" onClick={() => handleAccept(request._id)}>Accept</button>
                      <button className="btn-primary" onClick={() => handleDecline(request._id)}>Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-requests">
                <p>{requestsError || 'No matching requests found. Requests will appear here when a client\'s budget matches your service rate.'}</p>
              </div>
            )}
            <div className="orders-note">
              <p>*Every order will show below the service provider info - Scrollable so you can see if there's a lot of booking*</p>
            </div>
          </div>
        </div>

        <div className="right-column">
          <div className="map-section">
            {locationLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Getting your current location...</p>
              </div>
            ) : (
              <div ref={mapContainer} className="map-container">
                {!map.current && !locationLoading && (
                  <div className="map-loading-overlay">
                    <div className="map-loading-content">
                      <div>🗺️</div>
                      <p>Map loading...</p>
                      <p>If map doesn't load, please refresh the page.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Service Information</h2>
              <button className="close-modal" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Service:</label>
                <input
                  type="text"
                  value={editFormData.service}
                  onChange={(e) => setEditFormData({ ...editFormData, service: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Rate:</label>
                <input
                  type="number"
                  value={editFormData.rate}
                  onChange={(e) => setEditFormData({ ...editFormData, rate: parseFloat(e.target.value) || '' })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="form-input"
                  rows="4"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveService}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyService;
