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
    availability: "",
    certificates: null,
    validId: null,
  });

  const { isAuthorized, setIsAuthorized } = useContext(Context);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setFormData({ ...formData, [name]: files });
    } else if (name === "skills") {
      // allow multiple skills, max 2
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
        <div className="header">
          <h3>Create Your Account</h3>
        </div>

        <form onSubmit={handleRegister}>
          {/* Register As */}
          <div className="inputTag">
            <label>Register as:</label>
            <div>
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

          {/* Username */}
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

          {/* Password & Confirm */}
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

          {/* First/Last Name */}
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

          {/* Email */}
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

          {/* Contact */}
          <div className="inputTag">
            <label>Contact Number</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
          <div className="inputTag">
            <label>Other Contact (optional)</label>
            <input
              type="text"
              name="otherContact"
              value={formData.otherContact}
              onChange={handleChange}
            />
          </div>

          {/* Address */}
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

          {/* Birthdate */}
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

          {/* Uploads */}
          <div className="inputTag">
            <label>Upload Certificates (optional)</label>
            <input type="file" name="certificates" multiple onChange={handleChange} />
          </div>
          <div className="inputTag">
            <label>Upload Valid ID</label>
            <input type="file" name="validId" onChange={handleChange} required />
          </div>

          {/* Employment Status */}
          <div className="inputTag">
            <label>Are you employed now?</label>
            <label>
              <input
                type="radio"
                name="employed"
                value="true"
                onChange={(e) => setEmployed(e.target.value === "true")}
              />
              Yes
            </label>

            <label>
              <input
                type="radio"
                name="employed"
                value="false"
                onChange={(e) => setEmployed(e.target.value === "true")}
              />
              No
            </label>
          </div>

          {/* Occupation */}
          <div className="inputTag">
            <label>Occupation</label>
            <select name="occupation" value={formData.occupation} onChange={handleChange}>
              <option value="">Select Occupation</option>
              <option value="Plumber">Plumber</option>
              <option value="Carpenter">Carpenter</option>
              <option value="Electrician">Electrician</option>
              <option value="Mason">Mason</option>
              <option value="Tailor">Tailor</option>
              <option value="NA">N/A</option>
            </select>
          </div>

          {/* Choose Date */}
          <div className="inputTag">
            <label>Choose Availability Date</label>
            <input
              type="date"
              name="availability"
              value={formData.availability}
              onChange={handleChange}
            />
          </div>

          {/* Choose Skill */}
          <div className="inputTag">
            <label>Choose Skill (Max 2)</label>
            <div>
              {["Plumber", "Carpenter", "Electrician", "Mason", "Tailor", "NA"].map(
                (skill) => (
                  <label key={skill}>
                    <input
                      type="checkbox"
                      name="skills"
                      value={skill}
                      checked={formData.skills.includes(skill)}
                      onChange={handleChange}
                    />
                    {skill}
                  </label>
                )
              )}
            </div>
          </div>

          {/* Submit */}
          <button type="submit">Submit</button>
        </form>

        <Link to="/login">Already have an account? Login</Link>
      </div>
    </section>
  );
};

export default Register;
