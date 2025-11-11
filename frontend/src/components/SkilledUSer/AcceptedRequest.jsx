import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import { useMainContext } from '../../mainContext';
import './AcceptedRequest.css';

const AcceptedRequest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const requestId = location.state?.requestId;
  const { isAuthorized, user } = useMainContext();

  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);

  // Check if user is a service provider
  useEffect(() => {
    if (isAuthorized && user && user.role !== "Service Provider") {
      toast.error("Access denied. Only service providers can view accepted requests.", "error", 4000, "Access Denied");
      navigate("/user/");
      return;
    }
  }, [isAuthorized, user, navigate]);

  useEffect(() => {
    if (isAuthorized && user && user.role === "Service Provider") {
      if (!requestId) {
        toast.error('No request ID found.');
        navigate('/user/users-request');
        return;
      }

      const fetchRequest = async () => {
        try {
          const response = await api.get(`/user/service-requests`, { withCredentials: true });
          const requests = response.data.requests;
          const currentRequest = requests.find(req => req._id === requestId);
          if (currentRequest) {
            setRequestData(currentRequest);
          } else {
            toast.error('Request not found.');
            navigate('/user/users-request');
          }
        } catch (error) {
          console.error('Error fetching request:', error);
          toast.error('Failed to fetch request details.');
          navigate('/user/users-request');
        }
      };

      fetchRequest();
    }
  }, [isAuthorized, user, requestId, navigate]);

  const handleAccept = async () => {
    if (!requestData) return;
    setAccepting(true);
    try {
      await api.post(`/user/service-request/${requestData._id}/accept`, {}, { withCredentials: true });
      toast.success('Request accepted successfully!');
      navigate('/user/dashboard');
    } catch (error) {
      toast.error('Failed to accept request.');
    } finally {
      setAccepting(false);
    }
  };

  const handleCancel = async () => {
    if (!requestData) return;
    setLoading(true);
    try {
      await api.put(`/user/service-request/${requestData._id}/cancel`, {}, { withCredentials: true });
      toast.success('Request cancelled successfully.');
      navigate('/user/service-requests');
    } catch (error) {
      toast.error('Failed to cancel request.');
    } finally {
      setLoading(false);
    }
  };

  if (!requestData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="accepted-request-container">
      <div className="header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ←
        </button>
        <h1>Client</h1>
      </div>

      <div className="profile-section">
        <div className="profile-avatar">
          <div className="avatar-placeholder"></div>
        </div>
        <div className="profile-info">
          <h2>{requestData.name}</h2>
          <p>📧 {requestData.requester?.email || 'N/A'}</p>
          <p>📞 {requestData.phone}</p>
        </div>
      </div>

      <div className="details-section">
        <h3>Client Details</h3>
        <div className="detail-item">
          <span className="icon">👤</span>
          <span className="label">Name:</span>
          <span className="value">{requestData.name}</span>
        </div>
        <div className="detail-item">
          <span className="icon">📧</span>
          <span className="label">Email:</span>
          <span className="value">{requestData.requester?.email || 'N/A'}</span>
        </div>
        <div className="detail-item">
          <span className="icon">📞</span>
          <span className="label">Phone:</span>
          <span className="value">{requestData.phone}</span>
        </div>
      </div>

      <div className="service-details">
        <div className="detail-row">
          <span className="label">Service Needed:</span>
          <span className="value">{requestData.typeOfWork}</span>
        </div>
        <div className="detail-row">
          <span className="label">Budget:</span>
          <span className="value">P{requestData.budget}</span>
        </div>
        <div className="detail-row">
          <span className="label">Date Required:</span>
          <span className="value">10-18-2025</span> {/* Placeholder */}
        </div>
        <div className="detail-row">
          <span className="label">Preferred Time:</span>
          <span className="value">9:00AM - 12:00PM</span> {/* Placeholder */}
        </div>
        <div className="detail-row">
          <span className="label">Location:</span>
          <span className="value">{requestData.address}</span>
        </div>
        <div className="detail-row">
          <span className="label">Estimated Service Cost:</span>
          <span className="value">P{requestData.budget}</span>
        </div>
        <div className="detail-row">
          <span className="label">Match Rate:</span>
          <span className="value">P{requestData.budget}</span> {/* Placeholder */}
        </div>
      </div>

      <div className="note-section">
        <h3>Note:</h3>
        <p>{requestData.notes}</p>
      </div>

      <div className="button-group">
        <button
          className="accept-button"
          onClick={handleAccept}
          disabled={accepting}
        >
          {accepting ? 'Accepting...' : 'Accept'}
        </button>
        <button
          className="cancel-button"
          onClick={handleCancel}
          disabled={loading}
        >
          {loading ? 'Cancelling...' : 'Cancel'}
        </button>
      </div>
    </div>
  );
};

export default AcceptedRequest;
