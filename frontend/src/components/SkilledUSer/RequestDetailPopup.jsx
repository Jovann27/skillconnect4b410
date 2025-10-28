import './RequestDetailPopup.css';

const RequestDetailPopup = ({ request, isOpen, onClose, onChat, onDelete }) => {
  if (!isOpen || !request) return null;

  const getStatusClass = (status) => {
    switch (status) {
      case "Available":
      case "Waiting":
      case "Open":
        return "status-open";
      case "Working":
        return "status-working";
      case "Complete":
      case "Completed":
        return "status-completed";
      case "Cancelled":
        return "status-cancelled";
      default:
        return "status-default";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString) => {
    if (!timeString) return "Not specified";
    return timeString;
  };

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h2>Request Details</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="popup-body">
          <div className="request-info-section">
            {/* First Row - Basic Info */}
            <div className="info-row">
              <div className="info-group">
                <label>Status:</label>
                <span className={`status-badge ${getStatusClass(request.status)}`}>
                  {request.status === "Waiting" ? "Available" : request.status === "Completed" ? "Complete" : request.status === "Open" ? "Available" : request.status}
                </span>
              </div>
              <div className="info-group">
                <label>Date:</label>
                <span>{formatDate(request.createdAt)}</span>
              </div>
              <div className="info-group">
                <label>Time:</label>
                <span>{formatTime(request.time)}</span>
              </div>
            </div>

            {/* Second Row - Service Details */}
            <div className="info-row">
              <div className="info-group">
                <label>Service Needed:</label>
                <span className="service-title">{request.typeOfWork}</span>
              </div>
              <div className="info-group">
                <label>Budget:</label>
                <span className="budget">₱{request.budget || "0"}</span>
              </div>
            </div>

            {/* Third Row - Client Information */}
            <div className="info-row">
              <div className="info-group">
                <label>Client:</label>
                <span>
                  {request.requester ?
                    `${request.requester.firstName || ""} ${request.requester.lastName || ""}`.trim() ||
                    request.requester.username ||
                    "Unknown Client" :
                    "N/A"
                  }
                </span>
              </div>
              <div className="info-group">
                <label>Phone:</label>
                <span>{request.phone || "Not provided"}</span>
              </div>
            </div>

            {/* Service Provider Information */}
            {request.acceptedBy && (
              <div className="info-row">
                <div className="info-group">
                  <label>Service Provider:</label>
                  <span>
                    {request.acceptedBy.firstName && request.acceptedBy.lastName ?
                      `${request.acceptedBy.firstName} ${request.acceptedBy.lastName}` :
                      request.acceptedBy.username || "Unknown Provider"
                    }
                  </span>
                </div>
                <div className="info-group">
                  <label>Contact:</label>
                  <span>{request.acceptedBy.phone || "Not provided"}</span>
                </div>
              </div>
            )}

            {/* Fourth Row - Location and Time */}
            <div className="info-row">
              <div className="info-group">
                <label>Address:</label>
                <span>{request.address || "Not specified"}</span>
              </div>
              <div className="info-group">
                <label>Preferred Time:</label>
                <span>{request.time || "Not specified"}</span>
              </div>
            </div>

            {/* Notes Section */}
            {request.notes && (
              <div className="info-row">
                <div className="info-group full-width">
                  <label>Notes:</label>
                  <span className="notes">{request.notes}</span>
                </div>
              </div>
            )}

            {/* Cost Information */}
            <div className="info-row">
              <div className="info-group">
                <label>Estimated Service Cost:</label>
                <span>₱{request.budget || "0"}</span>
              </div>
              <div className="info-group">
                <label>Matched Rate:</label>
                <span className="match-rate">₱80</span>
              </div>
            </div>
          </div>

          <div className="popup-actions">
            <button className="chat-button" onClick={() => onChat && onChat(request)}>
              💬 Chat with Provider
            </button>
            <button className="delete-button" onClick={() => onDelete && onDelete(request)}>
              Delete
            </button>
            <button className="back-button" onClick={onClose}>
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailPopup;
