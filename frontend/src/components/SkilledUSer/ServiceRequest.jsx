import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { useMainContext } from "../../mainContext";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./dashboard-content.css";

const ServiceRequestForm = () => {
  const { isAuthorized, user } = useMainContext();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    typeOfWork: "",
    time: "",
    budget: "",
    notes: "",
  });


  const [markerPosition, setMarkerPosition] = useState({ lat: 14.5995, lng: 120.9842 }); // Default to Manila
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [currentAddress, setCurrentAddress] = useState("");

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });


  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMarkerPosition({ lat: latitude, lng: longitude });

        if (map) {
          map.flyTo({
            center: [longitude, latitude],
            zoom: 15,
          });
        }

        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'SkillConnect/1.0'
              }
            }
          );
          const data = await response.json();

          if (data && data.display_name) {
            setCurrentAddress(data.display_name);
            setFormData(prev => ({
              ...prev,
              address: data.display_name
            }));
          }
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
          // Don't show error to user, just use coordinates
        }
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location access denied by user.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out.");
            break;
          default:
            setLocationError("An unknown error occurred.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  useEffect(() => {
    if (mapRef.current && !map) {
      const newMap = new maplibregl.Map({
        container: mapRef.current,
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
        center: [markerPosition.lng, markerPosition.lat],
        zoom: 15,
      });
      newMap.on('load', () => {
        setMap(newMap);
        // Add initial marker
        newMap.addSource('marker', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [markerPosition.lng, markerPosition.lat] },
          },
        });
        newMap.addLayer({
          id: 'marker',
          type: 'circle',
          source: 'marker',
          paint: {
            'circle-radius': 8,
            'circle-color': '#ff0000',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        });
      });
      newMap.on('click', async (e) => {
        const { lng, lat } = e.lngLat;
        setMarkerPosition({ lat, lng });

        // Update marker
        newMap.getSource('marker').setData({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lng, lat] },
        });

        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'SkillConnect/1.0'
              }
            }
          );
          const data = await response.json();

          if (data && data.display_name) {
            setCurrentAddress(data.display_name);
            setFormData(prev => ({
              ...prev,
              address: data.display_name
            }));
          }
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
          // Don't show error to user, just use coordinates
        }
      });
    }
    return () => {
      if (map) {
        map.remove();
        setMap(null);
      }
    };
  }, []); // Only run once on mount

  // Separate effect to update marker when markerPosition changes
  useEffect(() => {
    if (map && map.getSource('marker')) {
      map.getSource('marker').setData({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [markerPosition.lng, markerPosition.lat] },
      });
    }
  }, [markerPosition, map]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthorized)
      return toast.error("You must log in to submit a service request");

    try {
      const payload = {
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        typeOfWork: formData.typeOfWork === "other" ? formData.otherType : formData.typeOfWork,
        time: formData.time,
        budget: formData.budget,
        notes: formData.notes,
        location: markerPosition,
      };

      const response = await api.post("/user/post-service-request", payload, { withCredentials: true });

      // Create request data from the response and form data
      const requestData = {
        _id: response.data.request._id,
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        typeOfWork: formData.typeOfWork === "other" ? formData.otherType : formData.typeOfWork,
        time: formData.time,
        budget: formData.budget,
        notes: formData.notes,
        location: markerPosition,
        status: 'Available'
      };

      navigate('/user/waiting-for-worker', { state: { requestData } });

      // Reset form data
      setFormData({
        name: "",
        address: "",
        phone: "",
        typeOfWork: "",
        time: "",
        budget: "",
        notes: "",
        otherType: "",
      });
      setMarkerPosition({ lat: 14.5995, lng: 120.9842 });
      // Update map marker
      if (map && map.getSource('marker')) {
        map.getSource('marker').setData({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [120.9842, 14.5995] },
        });
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to submit service request."
      );
    }
  };

  return (
    <section className="requestForm-container">
      <h2 className="requestForm-title">Submit a Service Request</h2>

      <div className="request-form-layout">
        <div>
          <form onSubmit={handleSubmit} className="requestForm-form">
        <div className="requestForm-group">
          <label>Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
            required
          />
        </div>

        <div className="requestForm-group">
          <label>Type of work</label>
          <select
            name="typeOfWork"
            value={formData.typeOfWork}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Type of Work --</option>
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="cleaning">Cleaning</option>
            <option value="delivery">Delivery</option>
            <option value="other">Other</option>
          </select>
        </div>

        {formData.typeOfWork === "other" && (
          <div className="requestForm-group fade-in">
            <label>Specify Other Type</label>
            <input
              type="text"
              name="otherType"
              value={formData.otherType || ""}
              onChange={handleChange}
              placeholder="Enter your custom type..."
              required
            />
          </div>
        )}

        <div className="requestForm-group">
          <label>Notes to worker</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            placeholder="Notes to worker..."
            required
          ></textarea>
        </div>

        <div className="requestForm-group">
          <label>Budget (₱)</label>
          <input
            type="number"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            min="0"
          />
        </div>

        <div className="requestForm-group">
          <label>Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Your address"
            required
          />
        </div>

        <div className="requestForm-group">
          <label>Phone No.</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+63"
            required
          />
        </div>

        <div className="requestForm-group">
          <label>Time</label>
          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="requestForm-submitBtn">
          Place Order
        </button>
      </form>


          </div>

          <div className="map-section">
            <div className="location-controls">
              <button
                type="button"
                onClick={getCurrentLocation}
                className="location-button"
              >
                📍 Use My Location
              </button>
              {locationError && (
                <div className="location-error">
                  {locationError}
                </div>
              )}
              {currentAddress && (
                <div className="address-detected">
                  <strong>Detected Address:</strong> {currentAddress}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        address: currentAddress
                      }));
                      setCurrentAddress("");
                    }}
                    className="use-address-button"
                  >
                    Use This Address
                  </button>
                </div>
              )}
            </div>
            <div ref={mapRef} className="map-container"></div>
          </div>
        </div>
      </section>
  );
};

export default ServiceRequestForm;
