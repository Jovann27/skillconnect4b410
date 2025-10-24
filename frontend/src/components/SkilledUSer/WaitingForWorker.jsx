import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import './WaitingForWorker.css';

const WaitingForWorker = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const requestData = location.state?.requestData;

  const [status, setStatus] = useState('Open');
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
          if (currentRequest.status === 'Assigned') {
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

  // Prevent rendering if requestData is undefined
  if (!requestData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="waiting-container">
      <div className="waiting-header">
        <h1>WaitingForWorker</h1>
      </div>
      <div className="waiting-content">
        <div className="finding-worker">
          <div className="icon-container">
            <div className="clock-icon">⏰</div>
          </div>
          <h2>Finding the Best Worker...</h2>
          <p>Please wait while we locate a nearby worker.</p>
        </div>
        <div className="searching-worker">
          <div className="arrow-icon">↻</div>
          <h3>Searching for an available worker...</h3>
          <p>This may take a few moments.</p>
        </div>
        <div className="customer-details">
          <h3>Customer Details</h3>
          <div className="detail-item">
            <span className="label">Name:</span>
            <span className="value">{requestData.name}</span>
          </div>
          <div className="detail-item">
            <span className="label">Address:</span>
            <span className="value">{requestData.address}</span>
          </div>
          <div className="detail-item">
            <span className="label">Phone:</span>
            <span className="value">{requestData.phone}</span>
          </div>
        </div>
        <div className="order-details">
          <h3>Order Details</h3>
          <div className="detail-item">
            <span className="label">Type:</span>
            <span className="value">{requestData.typeOfWork}</span>
          </div>
          <div className="detail-item">
            <span className="label">Priority:</span>
            <span className="value">Any Worker</span>
          </div>
          <div className="detail-item">
            <span className="label">Budget:</span>
            <span className="value">P{requestData.budget}</span>
          </div>
          <div className="detail-item">
            <span className="label">Note:</span>
            <span className="value">{requestData.notes}</span>
          </div>
        </div>
        <div className="cancel-section">
          <button
            className="cancel-button"
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
