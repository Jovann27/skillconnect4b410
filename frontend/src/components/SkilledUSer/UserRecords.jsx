import { useEffect, useState } from "react";
import api from "../../api";
import { useMainContext } from "../../mainContext";
import { usePopup } from "../../components/Layout/PopupContext";
import RequestDetailPopup from "./RequestDetailPopup";
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

  const updateStatus = async (bookingId, newStatus) => {
    try {
      const { data } = await api.put(`/user/booking/${bookingId}/status`, {
        status: newStatus,
      });
      showNotification("Status updated successfully!", "success", 3000, "Success");
      fetchWorkRecords(); // refresh
    } catch (err) {
      console.error(err);
      showNotification("Failed to update status. Please try again.", "error", 4000, "Error");
    }
  };

  useEffect(() => {
    fetchWorkRecords();
    fetchCurrentRequests();
    fetchMyRequests();
  }, []);

  // Get unique service types for filter dropdown
  const getServiceTypes = () => {
    const allRequests = [...requests, ...myRequests];
    const serviceTypes = [...new Set(allRequests.map(req => req.typeOfWork).filter(Boolean))];
    return serviceTypes.sort();
  };

  const filteredRecords = records.filter((record) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = record.serviceType?.toLowerCase().includes(searchLower) ||
                          record.requester?.firstName?.toLowerCase().includes(searchLower) ||
                          record.requester?.lastName?.toLowerCase().includes(searchLower) ||
                          record.budget?.toString().includes(searchTerm) ||
                          record.address?.toLowerCase().includes(searchLower) ||
                          record.time?.toLowerCase().includes(searchLower);
    const matchesStatus = filterStatus === "All" || record.status === filterStatus;
    const matchesServiceType = filterServiceType === "All" || record.serviceType === filterServiceType;
    const matchesBudget = (!filterBudgetRange.min || record.budget >= parseFloat(filterBudgetRange.min)) &&
                         (!filterBudgetRange.max || record.budget <= parseFloat(filterBudgetRange.max));
    return matchesSearch && matchesStatus && matchesServiceType && matchesBudget;
  });

  const filteredRequests = requests.filter((request) => {
    // Only show requests that haven't been accepted yet (status: "Open")
    const isAvailableRequest = request.status === "Open";
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = request.typeOfWork?.toLowerCase().includes(searchLower) ||
                          request.requester?.firstName?.toLowerCase().includes(searchLower) ||
                          request.requester?.lastName?.toLowerCase().includes(searchLower) ||
                          request.name?.toLowerCase().includes(searchLower) ||
                          request.budget?.toString().includes(searchTerm) ||
                          request.address?.toLowerCase().includes(searchLower) ||
                          request.phone?.toLowerCase().includes(searchLower) ||
                          request.notes?.toLowerCase().includes(searchLower);
    const matchesStatus = filterStatus === "All" || request.status === filterStatus;
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
    const matchesStatus = filterStatus === "All" || request.status === filterStatus;
    const matchesServiceType = filterServiceType === "All" || request.typeOfWork === filterServiceType;
    const matchesBudget = (!filterBudgetRange.min || request.budget >= parseFloat(filterBudgetRange.min)) &&
                         (!filterBudgetRange.max || request.budget <= parseFloat(filterBudgetRange.max));
    return matchesSearch && matchesStatus && matchesServiceType && matchesBudget;
  });

  const getStatusClass = (status) => {
    switch (status) {
      case "Working":
        return "status-working";
      case "Waiting":
        return "status-waiting";
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
    // TODO: Implement chat functionality
    showNotification("Chat feature coming soon!", "info", 3000, "Info");
    handleClosePopup();
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
                  <option value="Open">Open</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Completed">Completed</option>
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

      {/* Tab Navigation */}
      <div className="records-tabs">
        <button
          className={`tab-button ${activeTab === "my-requests" ? "active" : ""}`}
          onClick={() => setActiveTab("my-requests")}
        >
          My Request ({filteredMyRequests.length})
        </button>
        <button
          className={`tab-button ${activeTab === "available-requests" ? "active" : ""}`}
          onClick={() => setActiveTab("available-requests")}
        >
          Available Request ({filteredRequests.length})
        </button>
        <button
          className={`tab-button ${activeTab === "work-records" ? "active" : ""}`}
          onClick={() => setActiveTab("work-records")}
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
                        {request.status}
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
                        <button className="action-btn edit" onClick={(e) => e.stopPropagation()}>Edit</button>
                        <button className="action-btn cancel" onClick={(e) => e.stopPropagation()}>Cancel</button>
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
                        {request.status}
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
                        <button className="action-btn accept" onClick={(e) => e.stopPropagation()}>Accept</button>
                        <button className="action-btn decline" onClick={(e) => e.stopPropagation()}>Decline</button>
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
                        {record.status}
                      </span>
                    </td>
                    <td>
                      <div>{record.time || "-"}</div>
                      <div className="date">{record.date ? new Date(record.date).toLocaleDateString() : "-"}</div>
                    </td>
                    <td>123 Main Street, Apt 4B, Anytown, CA 90210...</td>
                    <td>{record.requester ? `${record.requester.firstName} ${record.requester.lastName}` : "N/A"}</td>
                    <td>{record.serviceType}</td>
                    <td>₱{record.budget || "0.00"}</td>
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
      />
    </div>
  );
};

export default UserWorkRecord;
