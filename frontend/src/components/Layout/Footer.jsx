import { useState } from "react";
import { FaFacebookF, FaYoutube, FaLinkedin, FaTwitter } from "react-icons/fa";
import { RiInstagramFill } from "react-icons/ri";
import { Link } from "react-router-dom";
import "./layout-styles.css";

const Footer = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("Message sent successfully!");
        setFormData({ name: "", email: "", message: "" });
      } else {
        setStatus(data.error || "Failed to send message.");
      }
    } catch {
      setStatus("Error sending message.");
    }

    setLoading(false);
  };

  return (
    <footer className="footer">
      <div className="footer-content">

        <div className="footer-section">
          <h2 className="footer-brand">SkillConnect4b410</h2>
          <p className="footer-desc">
            Building modern solutions with simplicity and elegance.
          </p>
        </div>

        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><a href="/services">Services</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Contact Us</h3>
          <form onSubmit={handleSubmit} className="footer-contact-form">
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="footer-input"
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="footer-input"
            />
            <textarea
              name="message"
              placeholder="Your Message"
              value={formData.message}
              onChange={handleChange}
              required
              className="footer-textarea"
            />
            <button type="submit" disabled={loading} className="footer-submit-btn">
              {loading ? "Sending..." : "Send"}
            </button>
          </form>
          {status && <p className={`footer-status ${status.includes('success') ? 'success' : 'error'}`}>{status}</p>}
        </div>

        <div className="footer-section">
          <h3>Follow Us</h3>
          <div className="footer-socials">
            <a href="#" className="footer-social-link">
              <FaFacebookF />
            </a>
            <a href="#" className="footer-social-link">
              <RiInstagramFill />
            </a>
            <a href="#" className="footer-social-link">
              <FaTwitter />
            </a>
            <a href="#" className="footer-social-link">
              <FaLinkedin />
            </a>
            <a href="#" className="footer-social-link">
              <FaYoutube />
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} SkillConnect4b410. All rights reserved.</p>
        <div className="footer-legal">
          <a href="/terms">Terms & Conditions</a>
          <span className="footer-separator"> | </span>
          <a href="/privacy">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
