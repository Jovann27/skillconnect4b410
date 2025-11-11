import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import './WaitingForWorker.css';

const WaitingForWorker = ({ isOpen = true, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const requestData = location.state?.requestData;

  const [status, setStatus] = useState('Available');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!requestData) {
      toast.error('No request data found.');
      navigate('/user/service-request');
      return;
    }

    const checkStatus = async () => {
      try {
        const response = await api.get('/user/user-service-requests', { withCredentials: true });
        const requests = response.data.requests;
        const currentRequest = requests.find(req => req._id === requestData._id);
        if (currentRequest) {
          setStatus(currentRequest.status);
          if (currentRequest.status === 'Working') {
            toast.success('A service provider has accepted your request!');
            navigate('/user/dashboard'); // Or to a booking page
          } else if (currentRequest.status === 'Cancelled') {
            toast.error('Your request has been cancelled.');
            navigate('/user/service-request');
          }
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    };

    const interval = setInterval(checkStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [requestData, navigate]);

  const handleCancel = async () => {
    if (!requestData) return;
    setLoading(true);
    try {
      await api.put(`/user/service-request/${requestData._id}/cancel`, {}, { withCredentials: true });
      toast.success('Request cancelled successfully.');
      navigate('/user/service-request');
    } catch (error) {
      toast.error('Failed to cancel request.');
    } finally {
      setLoading(false);
    }
  };

  // Prevent rendering if not open or no requestData
  if (!isOpen || !requestData) {
    return null;
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div className="popup-overlay" onClick={handleBackdropClick}>
      <div className="popup-content waiting-popup">
        <div className="popup-header">
          <h1>Waiting for Worker</h1>
          {onClose && (
            <button className="popup-close" onClick={onClose}>
              ×
            </button>
          )}
        </div>
        <div className="popup-body">
          <div className="waiting-status">
            <span className="status-icon clock-icon">⏰</span>
            <h2>Finding the Best Worker...</h2>
            <p>Please wait while we locate a nearby worker.</p>
          </div>

          <div className="request-summary">
            <h3>Request Summary</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Service Type</span>
                <span className="detail-value">{requestData.typeOfWork}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Budget</span>
                <span className="detail-value">P{requestData.budget}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Customer</span>
                <span className="detail-value">{requestData.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Location</span>
                <span className="detail-value">{requestData.address}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Phone</span>
                <span className="detail-value">{requestData.phone}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Notes</span>
                <span className="detail-value">{requestData.notes || 'None'}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="popup-footer">
          <button
            className="popup-button cancel-button"
            onClick={handleCancel}
            disabled={loading}
          >
            {loading ? 'Cancelling...' : 'Cancel Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaitingForWorker;
