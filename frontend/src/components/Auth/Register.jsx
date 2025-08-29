import { useContext, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Context } from "../../main";
import "./auth.css";

const Register = () => {
  const [formData, setFormData] = useState({
    role: "",
    username: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    otherContact: "",
    address: "",
    birthdate: "",
    occupation: "",
    employed: "",
    skills: [],
    otherSkill: "",
    availability: "",
    certificates: null,
    validId: null,
    profilePic: null,
  });

  const { isAuthorized, setIsAuthorized } = useContext(Context);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      setFormData({ ...formData, [name]: files[0] });
    } else if (name === "skills") {
      let updatedSkills = [...formData.skills];
      if (updatedSkills.includes(value)) {
        updatedSkills = updatedSkills.filter((s) => s !== value);
      } else {
        if (updatedSkills.length < 2) {
          updatedSkills.push(value);
        } else {
          toast.error("You can select up to 2 skills only");
        }
      }
      setFormData({ ...formData, skills: updatedSkills });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (Array.isArray(formData[key])) {
          submitData.append(key, JSON.stringify(formData[key]));
        } else if (formData[key]) {
          submitData.append(key, formData[key]);
        }
      });

      const { data } = await axios.post(
        "http://localhost:4000/api/v1/user/register",
        submitData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      toast.success(data.message);
      setIsAuthorized(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    }
  };

  if (isAuthorized) {
    return <Navigate to="/" />;
  }

  return (
    <section className="authPage">
      <div className="container">
        {/* Header */}
        <div className="header">
          <h3>Create Your Account</h3>
          <p>
            Join SkillConnect4B410 to book trusted services or offer your skills
            to the community.
          </p>
        </div>

        {/* Form Layout */}
        <form className="register-form" onSubmit={handleRegister}>
          {/* Left Section */}
          <div className="form-left">
            {/* Register As */}
            <div className="inputTag">
              <label>Register as:</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="role"
                    value="Service Provider"
                    onChange={handleChange}
                  />
                  Service Provider
                </label>
                <label>
                  <input
                    type="radio"
                    name="role"
                    value="Business Owner"
                    onChange={handleChange}
                  />
                  Business Owner
                </label>
                <label>
                  <input
                    type="radio"
                    name="role"
                    value="Community Member"
                    onChange={handleChange}
                  />
                  Community Member
                </label>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid-2col">
              <div className="inputTag">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="inputTag">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid-2col">
              <div className="inputTag">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="inputTag">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid-2col">
              <div className="inputTag">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="inputTag">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid-2col">
              <div className="inputTag">
                <label>Contact #</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="inputTag">
                <label>Other Contact</label>
                <input
                  type="text"
                  name="otherContact"
                  value={formData.otherContact}
                  onChange={handleChange}
                  placeholder="Messenger, Viber, etc."
                />
              </div>
            </div>

            <div className="inputTag">
              <label>Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid-2col">
              <div className="inputTag">
                <label>Birthdate</label>
                <input
                  type="date"
                  name="birthdate"
                  value={formData.birthdate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="inputTag">
                <label>Upload Valid ID</label>
                <input type="file" name="validId" onChange={handleChange} />
              </div>
            </div>

            <div className="inputTag">
              <label>Enter Skills (separate with commas)</label>
              <input
                type="text"
                name="skills"
                placeholder="e.g. Plumber, Carpenter"
                value={formData.skills.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    skills: e.target.value.split(",").map((s) => s.trim()),
                  })
                }
              />
            </div>
            
            <button type="submit" className="submitBtn">
              Submit
            </button>
          </div>

          {/* Right Section */}
          <div className="form-right">
            <div className="profile-upload">
              <p>Insert your image here:</p>
              <div className="profile-preview">
                {formData.profilePic ? (
                  <img
                    src={URL.createObjectURL(formData.profilePic)}
                    alt="preview"
                  />
                ) : (
                  <div className="placeholder"></div>
                )}
              </div>
              <input
                type="file"
                name="profilePic"
                accept="image/*"
                onChange={handleChange}
              />
            </div>
          </div>
        </form>

        <Link to="/login" className="login-link">
          Already have an account? Login
        </Link>
      </div>
    </section>
  );
};

export default Register;
