import { useEffect, useState } from "react";
import api from "../../api";
import socket from "../../utils/socket";

const MyRequests = ({ searchTerm, filterStatus, filterServiceType, filterBudgetRange, handleRequestClick, handleChatRequest, handleEditRequest, handleCancelRequest, getStatusClass }) => {
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMyRequests = async () => {
    try {
      const { data } = await api.get("/user/user-service-requests", { withCredentials: true });
      setMyRequests(data.requests || []);
    } catch (err) {
      console.error("Error fetching my requests:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();

    // Listen for real-time updates
    socket.on("service-request-updated", (data) => {
      console.log("Service request updated:", data);
      fetchMyRequests();
    });

    return () => {
      socket.off("service-request-updated");
    };
  }, []);

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

  if (loading) return <div className="records-loading">Loading records...</div>;
  if (error) return <div className="records-error">{error}</div>;
  return (
    <>
      {filteredMyRequests.length === 0 ? (
        <div className="no-results">
          <img src="/records.png" alt="No results" style={{width: 100, height: 100, opacity: 0.5, marginBottom: 10}} />
          <p>No My Requests Found</p>
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
              <tr key={request._id} ostyle={{ cursor: 'pointer' }}>
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
                    ) : request.status === "Cancelled" ? (
                      <span className="action-btn cancelled" style={{ backgroundColor: '#f0f0f0', color: '#999', cursor: 'default' }}>Cancelled</span>
                    ) : (
                      <button className="action-btn edit" onClick={(e) => handleEditRequest(request, e)}>Edit</button>
                    )}
                    {request.status !== "Cancelled" && request.status !== "Complete" && (
                      <button className="action-btn delete" onClick={(e) => handleCancelRequest(request, e)}>Cancel</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
};

export default MyRequests;
