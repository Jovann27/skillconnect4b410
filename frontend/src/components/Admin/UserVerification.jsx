import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api";

const UserVerification = () => {
  const [users, setUsers] = useState([]);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("users");
  const [appointmentForm, setAppointmentForm] = useState({
    providerId: "",
    appointmentDate: "",
    location: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data.users || res.data || []);
      setPendingApplications((res.data.users || res.data || []).filter(user => user.isApplyingProvider));
    } catch (err) {
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const scheduleAppointment = async (providerId) => {
    try {
      const result = await api.post("/verification/create", {
        providerId,
        appointmentDate: new Date().toISOString(),
        location: "Default Location",
      });
      if (result.data.success) {
        toast.success("Appointment scheduled");
        fetchData();
      } else {
        toast.error("Failed to schedule");
      }
    } catch (err) {
      toast.error("Error scheduling appointment");
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      const result = await api.put(`/verification/${appointmentId}/update`, { status });
      if (result.data.success) {
        toast.success("Status updated");
        fetchData();
      } else {
        toast.error("Failed to update");
      }
    } catch (err) {
      toast.error("Error updating status");
    }
  };

  if (loading) return <div className="loading-skeleton"></div>;
  if (error) return <div className="analytics-container"><div className="analytics-header"><h1>Error</h1></div><div className="analytics-card"><p className="metric-change negative">{error}</p></div></div>;

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>User Verification Management</h1>
        <p>Manage user verification and appointments</p>
        <div className="analytics-controls">
          <button onClick={() => setTab("users")} className="refresh-btn">All Users</button>
          <button onClick={() => setTab("pending")} className="refresh-btn">Pending Applications</button>
          <button onClick={() => setTab("appointments")} className="refresh-btn">Appointments</button>
        </div>
      </div>

      {tab === "users" && (
        <div className="analytics-card">
          <h2>👥 All Users ({users.length})</h2>
          <table className="users-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Verified</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>
                    <img
                      src={user.profilePic || "/default-avatar.png"}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="profile-pic"
                    />
                  </td>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.verified ? "✅ Yes" : "❌ No"}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "pending" && (
        <div className="analytics-card">
          <h2>📝 Pending Applications ({pendingApplications.length})</h2>
          <table className="applications-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Skills</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingApplications.map((user) => (
                <tr key={user._id}>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.email}</td>
                  <td>{user.skills ? user.skills.join(", ") : "None"}</td>
                  <td>
                    <button onClick={() => scheduleAppointment(user._id)} className="refresh-btn">Schedule Appointment</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "appointments" && (
        <div className="analytics-card">
          <h2>📅 Appointments ({appointments.length})</h2>
          <p>Appointments management - extend as needed</p>
        </div>
      )}
    </div>
  );
};

export default UserVerification;
