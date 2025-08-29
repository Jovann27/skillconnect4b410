import { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Context } from "../../main";
import "./auth.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  const { isAuthorized, setIsAuthorized, setUser } = useContext(Context);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthorized) {
      navigate("/home"); // ✅ FIXED: don’t use "/home.jsx"
    }
  }, [isAuthorized, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        "http://localhost:4000/api/v1/user/login",
        { email, password, role },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      toast.success(data.message);
      setUser(data.user);
      setIsAuthorized(true);

      setEmail("");
      setPassword("");
      setRole("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <section className="loginPage">
      <form className="form" onSubmit={handleLogin}>
        <p className="form-title">Sign in to your account</p>

        <div className="input-container">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="">Login As</option>
            <option value="Service Provider">Service Provider</option>
            <option value="Business Owner">Business Owner</option>
            <option value="Community Member">Community Member</option>
          </select>
        </div>

        <div className="input-container">
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-container">
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="submit">
          Sign In
        </button>

        <p className="signup-link">
          No account? <Link to="/register">Sign up</Link>
        </p>
      </form>
      {/* <div className="banner">
        <img src="https://i.ibb.co/pmYtRfW/banner.jpg" alt="banner" border="0"/>
      </div> */}
    </section>
  );
};

export default Login;


