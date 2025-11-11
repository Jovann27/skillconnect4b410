import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api";
import { useMainContext } from "../../mainContext";
import "./UserManagement.css";

const UserManagement = () => {
  const { admin, isAuthorized, tokenType } = useMainContext();
  const [users, setUsers] = useState([]);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("users");
  const [appointmentForm, setAppointmentForm] = useState({
    providerId: "",
    appointmentDate: "",
    location: "B",
  });
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [showApplicantModal, setShowApplicantModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // Track which action is loading

  // Check if user is authenticated as admin
  const isAdmin = isAuthorized && tokenType === "admin" && admin;

  useEffect(() => {
    // Wait for authentication to be fully loaded
    if (isAuthorized === null || isAuthorized === undefined) {
      // Authentication is still loading
      return;
    }

    // Only make API calls when authentication is fully loaded and user is admin
    if (isAuthorized === false) {
      // User is not authenticated at all
      setLoading(false);
      setError("Please login to access this page.");
    } else if (isAuthorized && tokenType === "admin" && admin) {
      // User is authenticated as admin
      fetchData();
    } else if (isAuthorized && tokenType !== "admin") {
      // User is authenticated but not as admin
      setLoading(false);
      setError("Access denied. Admin authentication required.");
    } else {
      // Authentication loaded but admin object not available yet
      setLoading(false);
      setError("Loading admin data...");
    }
  }, [isAuthorized, tokenType, admin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [usersRes, appointmentsRes] = await Promise.all([
        api.get("/admin/users"),
        api.get("/verification/")
      ]);

      console.log("Users response:", usersRes.data);
      console.log("Appointments response:", appointmentsRes.data);

      // Validate data structure
      const usersData = Array.isArray(usersRes.data.users) ? usersRes.data.users : [];
      const appointmentsData = Array.isArray(appointmentsRes.data.appointments) ? appointmentsRes.data.appointments : [];

      setUsers(usersData);
      setPendingApplications(usersData.filter(user =>
        user && user.isApplyingProvider === true && user.verified === false
      ));
      setAppointments(appointmentsData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(`Failed to fetch data: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openAppointmentModal = (providerId) => {
    setSelectedProviderId(providerId);
    setAppointmentForm({
      providerId,
      appointmentDate: "",
      location: "",
    });
    setShowAppointmentModal(true);
  };

  const scheduleAppointment = async () => {
    if (!appointmentForm.appointmentDate || !appointmentForm.location) {
      toast.error("Please fill in all appointment details");
      return;
    }

    setActionLoading('schedule');
    try {
      const result = await api.post("/verification/", {
        providerId: selectedProviderId,
        appointmentDate: new Date(appointmentForm.appointmentDate).toISOString(),
        location: appointmentForm.location,
      });
      if (result.data.success) {
        toast.success("Appointment scheduled successfully");
        setShowAppointmentModal(false);
        fetchData();
      } else {
        toast.error("Failed to schedule appointment");
      }
    } catch (err) {
      toast.error("Error scheduling appointment");
    } finally {
      setActionLoading(null);
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      const result = await api.put(`/verification/${appointmentId}`, { status });
      if (result.data.success) {
        toast.success("Appointment status updated successfully");
        fetchData();
      } else {
        toast.error("Failed to update appointment status");
      }
    } catch (err) {
      console.error("Error updating appointment status:", err);
      toast.error("Error updating appointment status");
    }
  };

  const verifyUser = async (userId) => {
    try {
      const result = await api.put(`/admin/user/verify/${userId}`);
      if (result.data.success) {
        toast.success("User verified successfully");
        fetchData();
      } else {
        toast.error("Failed to verify user");
      }
    } catch (err) {
      console.error("Error verifying user:", err);
      toast.error("Error verifying user");
    }
  };

  const banUser = async (userId) => {
    if (!window.confirm("Are you sure you want to ban this user?")) return;

    try {
      const result = await api.delete(`/admin/user/${userId}`);
      if (result.data.success) {
        toast.success("User banned successfully");
        fetchData();
      } else {
        toast.error("Failed to ban user");
      }
    } catch (err) {
      console.error("Error banning user:", err);
      toast.error("Error banning user");
    }
  };

  const viewApplicant = (appointment) => {
    setSelectedApplicant(appointment);
    setShowApplicantModal(true);
  };

  const approveApplicant = async (userId) => {
    setActionLoading('approve');
    try {
      const result = await api.put(`/admin/user/verify/${userId}`);
      if (result.data.success) {
        toast.success("Applicant approved successfully");
        setShowApplicantModal(false);
        fetchData();
      } else {
        toast.error("Failed to approve applicant");
      }
    } catch (err) {
      console.error("Error approving applicant:", err);
      toast.error("Error approving applicant");
    } finally {
      setActionLoading(null);
    }
  };

  const declineApplicant = async (userId) => {
    setActionLoading('decline');
    try {
      // For decline, we might want to update the appointment status or user status
      // For now, let's just update the appointment to cancelled
      const result = await api.put(`/verification/${selectedApplicant._id}`, { status: 'Declined' });
      if (result.data.success) {
        toast.success("Applicant declined");
        setShowApplicantModal(false);
        fetchData();
      } else {
        toast.error("Failed to decline applicant");
      }
    } catch (err) {
      console.error("Error declining applicant:", err);
      toast.error("Error declining applicant");
    } finally {
      setActionLoading(null);
    }
  };

  const suspendApplicant = async (userId, days = 7) => {
    setActionLoading('suspend');
    try {
      // This would require a new API endpoint for suspension
      // For now, we'll use a placeholder
      toast.info(`Suspension functionality for ${days} days - API endpoint needed`);
      setActionLoading(null);
    } catch (err) {
      console.error("Error suspending applicant:", err);
      toast.error("Error suspending applicant");
      setActionLoading(null);
    }
  };

  const banApplicant = async (userId) => {
    if (!window.confirm("Are you sure you want to ban this applicant permanently?")) return;

    setActionLoading('ban');
    try {
      const result = await api.delete(`/admin/user/${userId}`);
      if (result.data.success) {
        toast.success("Applicant banned successfully");
        setShowApplicantModal(false);
        fetchData();
      } else {
        toast.error("Failed to ban applicant");
      }
    } catch (err) {
      console.error("Error banning applicant:", err);
      toast.error("Error banning applicant");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="user-management-container">
      <div className="loading-spinner"></div>
    </div>
  );
  if (error) return (
    <div className="user-management-container">
      <div className="analytics-header">
        <div>
          <h1>Error</h1>
        </div>
      </div>
      <div className="content-card">
        <p className="empty-state">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="user-management-container">
      <div className="analytics-header">
        <div>
          <h1>User Verification Management</h1>
          <p className="header-description">Manage user verification and appointments</p>
        </div>
      </div>

      <div className="tab-navigation">
        <button onClick={() => setTab("users")} className={`tab-btn ${tab === "users" ? "active" : ""}`}>
          <i className="fas fa-users"></i> All Users
        </button>
        <button onClick={() => setTab("pending")} className={`tab-btn ${tab === "pending" ? "active" : ""}`}>
          <i className="fas fa-clock"></i> Pending Applications
        </button>
        <button onClick={() => setTab("appointments")} className={`tab-btn ${tab === "appointments" ? "active" : ""}`}>
          <i className="fas fa-calendar-check"></i> Appointments
        </button>
      </div>

      {tab === "users" && (
        <div className="content-card">
          <div className="card-header">
            <h2>
              <i className="fas fa-users"></i> All Users
            </h2>
            <span className="count">{users.length}</span>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Profile</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="no-data">No users found</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <img
                          src={user.profilePic || "/default-avatar.png"}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="admin-avatar"
                        />
                      </td>
                      <td>
                        <div className="status-container">
                          <div className="name">{user.firstName} {user.lastName}</div>
                          <div className="user-id">ID: {user._id.slice(-6)}</div>
                        </div>
                      </td>
                      <td>
                        <div className="contact-info">
                          <div className="email">{user.email}</div>
                        </div>
                      </td>
                      <td>{user.role}</td>
                      <td>
                        <span className={`status-badge ${user.verified ? 'approved' : user.banned ? 'banned' : 'pending'}`}>
                          {user.banned ? 'Banned' : user.verified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "pending" && (
        <div className="content-card">
          <div className="card-header">
            <h2>
              <i className="fas fa-clock"></i> Pending Applications
            </h2>
            <span className="count">{pendingApplications.length}</span>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Skills</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingApplications.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="no-data">No pending applications</td>
                  </tr>
                ) : (
                  pendingApplications.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div className="status-container">
                          <div className="name">{user.firstName} {user.lastName}</div>
                          <div className="user-id">ID: {user._id.slice(-6)}</div>
                        </div>
                      </td>
                      <td>
                        <div className="contact-info">
                          <div className="email">{user.email}</div>
                        </div>
                      </td>
                      <td>{user.skills ? user.skills.join(", ") : "None"}</td>
                      <td>
                        <div className="action-buttons">
                          <button onClick={() => openAppointmentModal(user._id)} className="action-btn approve-btn">
                            <i className="fas fa-calendar-plus"></i> Schedule
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "appointments" && (
        <div className="content-card">
          <div className="card-header">
            <h2>
              <i className="fas fa-calendar-check"></i> Appointments
            </h2>
            <span className="count">{appointments.length}</span>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-data">No appointments scheduled</td>
                  </tr>
                ) : (
                  appointments.map((appointment) => (
                    <tr key={appointment._id}>
                      <td>{appointment.provider ? `${appointment.provider.firstName} ${appointment.provider.lastName}` : 'Unknown'}</td>
                      <td>{new Date(appointment.appointmentDate).toLocaleDateString()}</td>
                      <td>{appointment.location}</td>
                      <td>
                        <span className={`status-badge ${appointment.status ? appointment.status.toLowerCase() : 'pending'}`}>
                          {appointment.status || 'Pending'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn secondary-btn"
                            title="View Applicant Details"
                            onClick={() => viewApplicant(appointment)}
                          >
                            <i className="fas fa-eye"></i> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Appointment Scheduling Modal */}
      {showAppointmentModal && (
        <div className="modal-overlay" onClick={() => setShowAppointmentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fas fa-calendar-plus"></i> Schedule Appointment</h2>
              <button className="close-modal" onClick={() => setShowAppointmentModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3><i className="fas fa-calendar-alt"></i> Appointment Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Appointment Date & Time</label>
                    <input
                      type="datetime-local"
                      value={appointmentForm.appointmentDate}
                      onChange={(e) => setAppointmentForm({...appointmentForm, appointmentDate: e.target.value})}
                      required
                    />
                  </div>
                  <div className="detail-item">
                    <label>Location</label>
                    <input
                      type="text"
                      value={appointmentForm.location}
                      onChange={(e) => setAppointmentForm({...appointmentForm, location: e.target.value})}
                      placeholder="Enter appointment location"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowAppointmentModal(false)} disabled={actionLoading === 'schedule'}>Cancel</button>
              <button className="schedule-btn" onClick={scheduleAppointment} disabled={actionLoading === 'schedule'}>
                {actionLoading === 'schedule' ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Scheduling...
                  </>
                ) : (
                  <>
                    <i className="fas fa-calendar-check"></i> Schedule Appointment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Applicant Details Modal */}
      {showApplicantModal && selectedApplicant && (
        <div className="modal-overlay" onClick={() => setShowApplicantModal(false)}>
          <div className="modal-content applicant-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fas fa-user-check"></i> Applicant Details</h2>
              <button className="close-modal" onClick={() => setShowApplicantModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {selectedApplicant.provider && (
                <div className="applicant-profile">
                  <div className="profile-header">
                    <img
                      src={selectedApplicant.provider.profilePic || "/default-avatar.png"}
                      alt={`${selectedApplicant.provider.firstName} ${selectedApplicant.provider.lastName}`}
                      className="applicant-avatar"
                    />
                    <div className="profile-info">
                      <h3>{selectedApplicant.provider.firstName} {selectedApplicant.provider.lastName}</h3>
                      <p className="applicant-email">{selectedApplicant.provider.email}</p>
                      <p className="applicant-id">ID: {selectedApplicant.provider._id.slice(-6)}</p>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3><i className="fas fa-info-circle"></i> Personal Information</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Phone</label>
                        <p>{selectedApplicant.provider.phone || 'Not provided'}</p>
                      </div>
                      <div className="detail-item">
                        <label>Address</label>
                        <p>{selectedApplicant.provider.address || 'Not provided'}</p>
                      </div>
                      <div className="detail-item">
                        <label>Skills</label>
                        <p>{selectedApplicant.provider.skills ? selectedApplicant.provider.skills.join(", ") : 'None'}</p>
                      </div>
                      <div className="detail-item">
                        <label>Experience</label>
                        <p>{selectedApplicant.provider.experience || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3><i className="fas fa-calendar-alt"></i> Appointment Information</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Appointment Date</label>
                        <p>{new Date(selectedApplicant.appointmentDate).toLocaleDateString()}</p>
                      </div>
                      <div className="detail-item">
                        <label>Appointment Time</label>
                        <p>{new Date(selectedApplicant.appointmentDate).toLocaleTimeString()}</p>
                      </div>
                      <div className="detail-item">
                        <label>Location</label>
                        <p>{selectedApplicant.location}</p>
                      </div>
                      <div className="detail-item">
                        <label>Status</label>
                        <span className={`status-badge ${selectedApplicant.status ? selectedApplicant.status.toLowerCase() : 'pending'}`}>
                          {selectedApplicant.status || 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-actions applicant-actions">
              <button className="cancel-btn" onClick={() => setShowApplicantModal(false)}>Close</button>
              <div className="action-buttons-group">
                <button
                  className="action-btn approve-btn"
                  onClick={() => approveApplicant(selectedApplicant.provider._id)}
                  disabled={actionLoading === 'approve'}
                >
                  {actionLoading === 'approve' ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Approving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check"></i> Approve
                    </>
                  )}
                </button>
                <button
                  className="action-btn secondary-btn"
                  onClick={() => declineApplicant(selectedApplicant.provider._id)}
                  disabled={actionLoading === 'decline'}
                >
                  {actionLoading === 'decline' ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Declining...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-times"></i> Decline
                    </>
                  )}
                </button>
                <button
                  className="action-btn secondary-btn"
                  onClick={() => suspendApplicant(selectedApplicant.provider._id)}
                  disabled={actionLoading === 'suspend'}
                >
                  {actionLoading === 'suspend' ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Suspending...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-pause"></i> Suspend
                    </>
                  )}
                </button>
                <button
                  className="action-btn decline-btn"
                  onClick={() => banApplicant(selectedApplicant.provider._id)}
                  disabled={actionLoading === 'ban'}
                >
                  {actionLoading === 'ban' ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Banning...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-ban"></i> Ban
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;