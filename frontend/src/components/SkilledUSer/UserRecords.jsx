import { useState } from "react";
import api from "../../api";
import { useMainContext } from "../../mainContext";
import { usePopup } from "../../components/Layout/PopupContext";
import RequestDetailPopup from "./RequestDetailPopup";
import MyRequests from './MyRequests';
import AvailableRequests from './AvailableRequests';
import WorkRecords from './WorkRecords';
import "./UserRecords.css";

const UserWorkRecord = () => {
  const { user, openChat, isUserVerified } = useMainContext();
  const { showNotification } = usePopup();
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
    if (request.acceptedBy) {
      // Open chat with the appointment
      openChat(request._id);
      showNotification(`Opening chat with ${request.acceptedBy.firstName || request.acceptedBy.username}`, "success", 2000, "Success");
    } else {
      showNotification("No service provider assigned for chat.", "info", 3000, "Info");
    }
    handleClosePopup();
  };

  const handleChatRequest = (request, e) => {
    e.stopPropagation();
    console.log("Chat button clicked for request:", request._id, "Provider:", request.serviceProvider);
    if (request.serviceProvider) {
      openChat(request._id);
      showNotification(`Opening chat with ${request.serviceProvider.firstName || request.serviceProvider.username}`, "success", 2000, "Success");
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
      console.log("Cancelling request:", request._id);
      const response = await api.cancel(`/user/service-request/${request._id}/cancel`);
      console.log("Cancel request response:", response.data);

      if (response.data.success) {
        showNotification("Request cancelled successfully!", "success", 3000, "Success");
      } else {
        showNotification("Failed to cancel request. Please try again.", "error", 4000, "Error");
      }
    } catch (err) {
      console.error("Error cancelling request:", err);
      showNotification("Failed to cancel request. Please try again.", "error", 4000, "Error");
    }
  };

  const handleAcceptRequest = async (request, e) => {
    e.stopPropagation();

    if (!isUserVerified) {
      alert("You must be verified to accept service requests. Please complete your verification process.");
      return;
    }

    try {
      const response = await api.post(`/user/service-request/${request._id}/accept`);
      if (response.data.success) {
        showNotification("Request accepted successfully!", "success", 3000, "Success");
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
        handleCloseEditModal();
      }
    } catch (err) {
      console.error(err);
      showNotification("Failed to update request. Please try again.", "error", 4000, "Error");
    }
  };

  const handleDeleteRequest = async (request) => {
    showNotification("Request declined.", "info", 3000, "Info");
    handleClosePopup();
  };

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
          My Requests
        </button>
        <button
          className={`tab-button ${activeTab === "available-requests" ? "active" : ""} ${user.role !== "Service Provider" ? "disabled" : ""}`}
          onClick={user.role === "Service Provider" ? () => setActiveTab("available-requests") : undefined}
          disabled={user.role !== "Service Provider"}
        >
          Available Requests
        </button>
        <button
          className={`tab-button ${activeTab === "work-records" ? "active" : ""} ${user.role !== "Service Provider" ? "disabled" : ""}`}
          onClick={user.role === "Service Provider" ? () => setActiveTab("work-records") : undefined}
          disabled={user.role !== "Service Provider"}
        >
          Work Records
        </button>
      </div>

      <div className="records-content">
        {activeTab === "my-requests" && <MyRequests searchTerm={searchTerm} filterStatus={filterStatus} filterServiceType={filterServiceType} filterBudgetRange={filterBudgetRange} handleRequestClick={handleRequestClick} handleChatRequest={handleChatRequest} handleEditRequest={handleEditRequest} handleCancelRequest={handleCancelRequest} getStatusClass={getStatusClass} />}
        {activeTab === "available-requests" && <AvailableRequests searchTerm={searchTerm} filterStatus={filterStatus} filterServiceType={filterServiceType} filterBudgetRange={filterBudgetRange} handleRequestClick={handleRequestClick} getStatusClass={getStatusClass} />}
        {activeTab === "work-records" && <WorkRecords searchTerm={searchTerm} filterStatus={filterStatus} filterServiceType={filterServiceType} filterBudgetRange={filterBudgetRange} handleRequestClick={handleRequestClick} getStatusClass={getStatusClass} />}
      </div>

      {/* Request Detail Popup */}
      <RequestDetailPopup
        request={selectedRequest}
        isOpen={popupOpen}
        onClose={handleClosePopup}
        onChat={handleChatClick}
        onDelete={handleDeleteRequest}
        onAccept={handleAcceptRequest}
        onDecline={handleDeclineRequest}
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
