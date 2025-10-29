import { useEffect, useState } from "react";
import api from "../../api";
import { useMainContext } from "../../mainContext";
import { usePopup } from "../../components/Layout/PopupContext";
import RequestDetailPopup from "./RequestDetailPopup";
import socket from "../../utils/socket";
import "./UserRecords.css";

const UserWorkRecord = () => {
  const { user } = useMainContext();
  const { showNotification } = usePopup();
  const [records, setRecords] = useState([]);
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterServiceType, setFilterServiceType] = useState("All");
  const [filterBudgetRange, setFilterBudgetRange] = useState({ min: "", max: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("my-requests");
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRequest, setEditRequest] = useState(null);

  const fetchWorkRecords = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/user/bookings");
      setRecords(data.bookings || []);
    } catch (err) {
      console.error("Error fetching records:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentRequests = async () => {
    try {
      const { data } = await api.get("/user/service-requests", { withCredentials: true });
      setRequests(data.requests || []);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError(err.message);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const { data } = await api.get("/user/user-service-requests", { withCredentials: true });
      setMyRequests(data.requests || []);
    } catch (err) {
      console.error("Error fetching my requests:", err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchWorkRecords();
    fetchCurrentRequests();
    fetchMyRequests();

    // Listen for real-time updates
    socket.on("service-request-updated", (data) => {
      console.log("Service request updated:", data);
      fetchCurrentRequests();
      fetchMyRequests();
    });

    socket.on("booking-updated", (data) => {
      console.log("Booking updated:", data);
      fetchWorkRecords();
    });

    return () => {
      socket.off("service-request-updated");
      socket.off("booking-updated");
    };
  }, []);

  // Get unique service types for filter dropdown
  const getServiceTypes = () => {
    const allRequests = [...requests, ...myRequests, ...records.map(r => r.serviceRequest).filter(Boolean)];
    const serviceTypes = [...new Set(allRequests.map(req => req?.typeOfWork).filter(Boolean))];
    return serviceTypes.sort();
  };

  const filteredRecords = records.filter((record) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = record.serviceRequest?.typeOfWork?.toLowerCase().includes(searchLower) ||
                          record.requester?.firstName?.toLowerCase().includes(searchLower) ||
                          record.requester?.lastName?.toLowerCase().includes(searchLower) ||
                          record.serviceRequest?.budget?.toString().includes(searchTerm) ||
                          record.serviceRequest?.address?.toLowerCase().includes(searchLower) ||
                          record.serviceRequest?.time?.toLowerCase().includes(searchLower);
    const normalizedStatus = record.status === "Waiting" ? "Available" : record.status === "Completed" ? "Complete" : record.status;
    const matchesStatus = filterStatus === "All" || normalizedStatus === filterStatus;
    const matchesServiceType = filterServiceType === "All" || record.serviceRequest?.typeOfWork === filterServiceType;
    const matchesBudget = (!filterBudgetRange.min || record.serviceRequest?.budget >= parseFloat(filterBudgetRange.min)) &&
                         (!filterBudgetRange.max || record.serviceRequest?.budget <= parseFloat(filterBudgetRange.max));
    return matchesSearch && matchesStatus && matchesServiceType && matchesBudget;
  });

  const filteredRequests = requests.filter((request) => {
    // Only show requests that are available (status: "Available", "Waiting", "Open")
    const isAvailableRequest = request.status === "Available" || request.status === "Waiting" || request.status === "Open";
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = request.typeOfWork?.toLowerCase().includes(searchLower) ||
                          request.requester?.firstName?.toLowerCase().includes(searchLower) ||
                          request.requester?.lastName?.toLowerCase().includes(searchLower) ||
                          request.name?.toLowerCase().includes(searchLower) ||
                          request.budget?.toString().includes(searchTerm) ||
                          request.address?.toLowerCase().includes(searchLower) ||
                          request.phone?.toLowerCase().includes(searchLower) ||
                          request.notes?.toLowerCase().includes(searchLower);
    const normalizedStatus = request.status === "Waiting" ? "Available" : request.status === "Completed" ? "Complete" : request.status;
    const matchesStatus = filterStatus === "All" || normalizedStatus === filterStatus;
    const matchesServiceType = filterServiceType === "All" || request.typeOfWork === filterServiceType;
    const matchesBudget = (!filterBudgetRange.min || request.budget >= parseFloat(filterBudgetRange.min)) &&
                         (!filterBudgetRange.max || request.budget <= parseFloat(filterBudgetRange.max));
    return isAvailableRequest && matchesSearch && matchesStatus && matchesServiceType && matchesBudget;
  });

  const filteredMyRequests = myRequests.filter((request) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = request.typeOfWork?.toLowerCase().includes(searchLower) ||
                          request.name?.toLowerCase().includes(searchLower) ||
                          request.budget?.toString().includes(searchTerm) ||
                          request.address?.toLowerCase().includes(searchLower) ||
                          request.phone?.toLowerCase().includes(searchLower) ||
                          request.notes?.toLowerCase().includes(searchLower);
    const normalizedStatus = request.status === "Waiting" ? "Available" : request.status === "Completed" ? "Complete" : request.status;
    const matchesStatus = filterStatus === "All" || normalizedStatus === filterStatus;
    const matchesServiceType = filterServiceType === "All" || request.typeOfWork === filterServiceType;
    const matchesBudget = (!filterBudgetRange.min || request.budget >= parseFloat(filterBudgetRange.min)) &&
                         (!filterBudgetRange.max || request.budget <= parseFloat(filterBudgetRange.max));
    return matchesSearch && matchesStatus && matchesServiceType && matchesBudget;
  });

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

  // Popup handlers
  const handleRequestClick = (request) => {
    setSelectedRequest(request);
    setPopupOpen(true);
  };

  const handleClosePopup = () => {
    setPopupOpen(false);
    setSelectedRequest(null);
  };

  const handleChatClick = (request) => {
    // TODO: Implement chat functionality with the service provider
    if (request.acceptedBy) {
      showNotification(`Chat with ${request.acceptedBy.firstName || request.acceptedBy.username} coming soon!`, "info", 3000, "Info");
    } else {
      showNotification("No service provider assigned for chat.", "info", 3000, "Info");
    }
    handleClosePopup();
  };

  const handleChatRequest = (request, e) => {
    e.stopPropagation();
    console.log("Chat button clicked for request:", request._id, "Provider:", request.serviceProvider);
    if (request.serviceProvider) {
      showNotification(`Chat with ${request.serviceProvider.firstName || request.serviceProvider.username} coming soon!`, "info", 3000, "Info");
    } else {
      showNotification("No service provider assigned for chat.", "info", 3000, "Info");
    }
  };

  const handleEditRequest = async (request, e) => {
    e.stopPropagation();
    setEditRequest(request);
    setEditModalOpen(true);
  };

  const handleCancelRequest = async (request, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to cancel this request?")) return;

    try {
      await api.cancel(`/user/service-request/${request._id}/cancel`);
      showNotification("Request cancelled successfully!", "success", 3000, "Success");
      fetchMyRequests();
    } catch (err) {
      console.error(err);
      showNotification("Failed to cancel request. Please try again.", "error", 4000, "Error");
    }
  };

  const handleAcceptRequest = async (request, e) => {
    e.stopPropagation();
    try {
      const response = await api.post(`/user/service-request/${request._id}/accept`);
      if (response.data.success) {
        showNotification("Request accepted successfully!", "success", 3000, "Success");
        fetchCurrentRequests(); // refresh
        handleClosePopup();
      }
    } catch (err) {
      console.error(err);
      showNotification("Failed to accept request. Please try again.", "error", 4000, "Error");
    }
  };

  const handleDeclineRequest = async (request, e) => {
    e.stopPropagation();
    // For decline, just close the popup or remove from view
    showNotification("Request declined.", "info", 3000, "Info");
    handleClosePopup();
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditRequest(null);
  };

  const handleSaveEdit = async () => {
    try {
      const response = await api.put(`/user/service-request/${editRequest._id}/update`, editRequest);
      if (response.data.success) {
        showNotification("Request updated successfully!", "success", 3000, "Success");
        fetchMyRequests();
        handleCloseEditModal();
      }
    } catch (err) {
      console.error(err);
      showNotification("Failed to update request. Please try again.", "error", 4000, "Error");
    }
  };

  const handleDeleteRequest = async (request) => {
    if (myRequests.find(r => r._id === request._id)) {
      // My request, cancel
      if (!window.confirm("Are you sure you want to cancel this request?")) return;
      try {
        await api.cancel(`/user/service-request/${request._id}/cancel`);
        showNotification("Request cancelled successfully!", "success", 3000, "Success");
        fetchMyRequests();
        handleClosePopup();
      } catch (err) {
        console.error(err);
        showNotification("Failed to cancel request. Please try again.", "error", 4000, "Error");
      }
    } else {
      // Available request, decline
      showNotification("Request declined.", "info", 3000, "Info");
      handleClosePopup();
    }
  };

  if (loading) return <div className="records-loading">Loading records...</div>;
  if (error) return <div className="records-error">{error}</div>;

  return (
    <div className="records-page">
      <div className="records-header">
        <h2>Records & Requests</h2>

        <div className="records-controls">
          <input
            type="text"
            placeholder="Search by service, client, budget, address, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="records-search"
          />
          <button
            className={`records-filter-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>



        {/* Advanced Filters */}
        {showFilters && (
          <div className="records-filters">
            <div className="filter-row">
              <div className="filter-group">
                <label>Status:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="All">All Status</option>
                  <option value="Available">Available</option>
                  <option value="Working">Working</option>
                  <option value="Complete">Complete</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Service Type:</label>
                <select
                  value={filterServiceType}
                  onChange={(e) => setFilterServiceType(e.target.value)}
                  className="filter-select"
                >
                  <option value="All">All Services</option>
                  {getServiceTypes().map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Min Budget (₱):</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filterBudgetRange.min}
                  onChange={(e) => setFilterBudgetRange(prev => ({ ...prev, min: e.target.value }))}
                  className="filter-input"
                  min="0"
                />
              </div>

              <div className="filter-group">
                <label>Max Budget (₱):</label>
                <input
                  type="number"
                  placeholder="No limit"
                  value={filterBudgetRange.max}
                  onChange={(e) => setFilterBudgetRange(prev => ({ ...prev, max: e.target.value }))}
                  className="filter-input"
                  min="0"
                />
              </div>

              <div className="filter-group">
                <button
                  className="clear-filters-btn"
                  onClick={() => {
                    setFilterStatus("All");
                    setFilterServiceType("All");
                    setFilterBudgetRange({ min: "", max: "" });
                    setSearchTerm("");
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="records-tabs">
        <button
          className={`tab-button ${activeTab === "my-requests" ? "active" : ""}`}
          onClick={() => setActiveTab("my-requests")}
        >
          My Request ({filteredMyRequests.length})
        </button>
        <button
          className={`tab-button ${activeTab === "available-requests" ? "active" : ""} ${user.role !== "Service Provider" ? "disabled" : ""}`}
          onClick={user.role === "Service Provider" ? () => setActiveTab("available-requests") : undefined}
          disabled={user.role !== "Service Provider"}
        >
          Available Request ({filteredRequests.length})
        </button>
        <button
          className={`tab-button ${activeTab === "work-records" ? "active" : ""} ${user.role !== "Service Provider" ? "disabled" : ""}`}
          onClick={user.role === "Service Provider" ? () => setActiveTab("work-records") : undefined}
          disabled={user.role !== "Service Provider"}
        >
          My Work records ({filteredRecords.length})
        </button>
      </div>

      <div className="records-content">
        {activeTab === "my-requests" ? (
          filteredMyRequests.length === 0 ? (
            <div className="no-results">
              <p>No My Requests Found</p>
              <p className="no-results-subtitle">*This will be shown if no results found, but search bar and filter will stay*</p>
            </div>
          ) : (
            <table className="records-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Request Date</th>
                  <th>Service Needed</th>
                  <th>Budget</th>
                  <th>Preferred Time</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMyRequests.map((request) => (
                  <tr key={request._id} onClick={() => handleRequestClick(request)} style={{ cursor: 'pointer' }}>
                    <td>
                      <span className={`status-tag ${getStatusClass(request.status)}`}>
                        {request.status === "Waiting" ? "Available" : request.status === "Completed" ? "Complete" : request.status === "Open" ? "Available" : request.status}
                      </span>
                    </td>
                    <td>
                      <div className="date">
                        {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : "-"}
                      </div>
                    </td>
                    <td>{request.typeOfWork}</td>
                    <td>₱{request.budget || "0"}</td>
                    <td>{request.time || "Not specified"}</td>
                    <td>{request.address || "Not specified"}</td>
                    <td>
                      <div className="request-actions">
                        {request.status === "Working" || request.status === "Complete" ? (
                          <button className="action-btn chat" onClick={(e) => handleChatRequest(request, e)}>Chat</button>
                        ) : (
                          <button className="action-btn edit" onClick={(e) => handleEditRequest(request, e)}>Edit</button>
                        )}
                        <button className="action-btn delete" onClick={(e) => handleCancelRequest(request, e)}>Cancel</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : activeTab === "available-requests" ? (
          filteredRequests.length === 0 ? (
            <div className="no-results">
              <p>No Available Requests Found</p>
              <p className="no-results-subtitle">*This will be shown if no results found, but search bar and filter will stay*</p>
            </div>
          ) : (
            <table className="records-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Request Date</th>
                  <th>Client</th>
                  <th>Service Needed</th>
                  <th>Budget</th>
                  <th>Preferred Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request._id} onClick={() => handleRequestClick(request)} style={{ cursor: 'pointer' }}>
                    <td>
                      <span className={`status-tag ${getStatusClass(request.status)}`}>
                        {request.status === "Waiting" ? "Available" : request.status === "Completed" ? "Complete" : request.status === "Open" ? "Available" : request.status}
                      </span>
                    </td>
                    <td>
                      <div className="date">
                        {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : "-"}
                      </div>
                    </td>
                    <td>
                      {request.requester ?
                        `${request.requester.firstName || ""} ${request.requester.lastName || ""}`.trim() ||
                        request.requester.username ||
                        "Unknown Client" :
                        "N/A"
                      }
                    </td>
                    <td>{request.typeOfWork}</td>
                    <td>₱{request.budget || "0"}</td>
                    <td>{request.time || "Not specified"}</td>
                    <td>
                      <div className="request-actions">
                        <button className="action-btn accept" onClick={(e) => handleAcceptRequest(request, e)}>Accept</button>
                        <button className="action-btn decline" onClick={(e) => handleDeclineRequest(request, e)}>Decline</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          filteredRecords.length === 0 ? (
            <div className="no-results">
              <p>No Work Records Found</p>
              <p className="no-results-subtitle">*This will be shown if no results found, but search bar and filter will stay*</p>
            </div>
          ) : (
            <table className="records-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Work Time</th>
                  <th>Order Address</th>
                  <th>Client</th>
                  <th>Service Needed</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record._id}>
                    <td>
                      <span className={`status-tag ${getStatusClass(record.status)}`}>
                        {record.status === "Waiting" ? "Available" : record.status === "Completed" ? "Complete" : record.status === "Open" ? "Available" : record.status}
                      </span>
                    </td>
                    <td>
                      <div>{record.serviceRequest?.time || "-"}</div>
                      <div className="date">{record.createdAt ? new Date(record.createdAt).toLocaleDateString() : "-"}</div>
                    </td>
                    <td>{record.serviceRequest?.address || "N/A"}</td>
                    <td>{record.requester ? `${record.requester.firstName} ${record.requester.lastName}` : "N/A"}</td>
                    <td>{record.serviceRequest?.typeOfWork || "N/A"}</td>
                    <td>₱{record.serviceRequest?.budget || "0.00"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      {/* Request Detail Popup */}
      <RequestDetailPopup
        request={selectedRequest}
        isOpen={popupOpen}
        onClose={handleClosePopup}
        onChat={handleChatClick}
        onDelete={handleDeleteRequest}
      />

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="edit-modal">
          <div className="edit-modal-content">
            <h3>Edit Request</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={editRequest.name}
                  onChange={(e) => setEditRequest({ ...editRequest, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Address:</label>
                <input
                  type="text"
                  value={editRequest.address}
                  onChange={(e) => setEditRequest({ ...editRequest, address: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone:</label>
                <input
                  type="text"
                  value={editRequest.phone}
                  onChange={(e) => setEditRequest({ ...editRequest, phone: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Service Type:</label>
                <input
                  type="text"
                  value={editRequest.typeOfWork}
                  onChange={(e) => setEditRequest({ ...editRequest, typeOfWork: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Preferred Time:</label>
                <input
                  type="text"
                  value={editRequest.time}
                  onChange={(e) => setEditRequest({ ...editRequest, time: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Budget (₱):</label>
                <input
                  type="number"
                  value={editRequest.budget}
                  onChange={(e) => setEditRequest({ ...editRequest, budget: e.target.value })}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Notes:</label>
                <textarea
                  value={editRequest.notes}
                  onChange={(e) => setEditRequest({ ...editRequest, notes: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="save-btn">Save</button>
                <button type="button" className="cancel-btn" onClick={handleCloseEditModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserWorkRecord;
