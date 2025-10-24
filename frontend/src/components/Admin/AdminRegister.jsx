import { useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";

const AdminRegister = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    setProfilePic(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password || !profilePic) {
      setError("All fields are required including profile picture.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("profilePic", profilePic);

    try {
      setLoading(true);
      const res = await api.post("/admin/auth/register", formData);
      console.log(res.data);
      setLoading(false);
      navigate("/admin/login"); // redirect after successful registration
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Admin Registration</h1>
        <p>Register a new admin account</p>
      </div>
      <div className="analytics-card">
        {error && <p className="metric-change negative">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label>
            Name:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Email:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <label>
            Profile Picture:
            <input type="file" accept="image/*" onChange={handleFileChange} required />
          </label>
          <button type="submit" disabled={loading} className="refresh-btn">
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminRegister;
