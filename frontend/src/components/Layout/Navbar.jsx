import { useContext, useState } from "react";
import { Context } from "../../main";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { GiHamburgerMenu } from "react-icons/gi";
import "./navbar.css";

const Navbar = () => {
  const [show, setShow] = useState(false);
  const { isAuthorized, setIsAuthorized, user } = useContext(Context);
  const navigateTo = useNavigate();

  const handleLogout = async () => {
    try {
      const response = await axios.get(
        "http://localhost:4000/api/v1/user/logout",
        { withCredentials: true }
      );
      toast.success(response.data.message);
      setIsAuthorized(false);
      navigateTo("/Login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
      setIsAuthorized(true);
    }
  };

  return (
    <nav className={isAuthorized ? "navbarShow" : "navbarHide"}>
      <div className="container">
        <div className="logo_container">
          <div className="logo">
          <img src="https://i.ibb.co/MxKr7FVx/1000205778-removebg-preview.png" alt="1000205778-removebg-preview" />
          </div>
          <div className="title">Skillconnect4B410</div>
        </div>
        
        <ul className={!show ? "menu" : "show-menu menu"}>
          <li>
            <Link to="/" onClick={() => setShow(false)}>HOME</Link>
          </li>
          <li>
            <Link to="/service/getall" onClick={() => setShow(false)}>JOB OFFERS</Link>
          </li>
          <li>
            <Link to="/applications/me" onClick={() => setShow(false)}>
              {user?.role === "Service Provider" ? "MY APPLICATIONS" : "SERVICES"}
            </Link>
          </li>
          {user?.role === "Service Provider" && (
            <>
              <li>
                <Link to="/service/post" onClick={() => setShow(false)}>POST NEW SERVICE</Link>
              </li>
              <li>
                <Link to="/service/me" onClick={() => setShow(false)}>VIEW YOUR SERVICES</Link>
              </li>
            </>
          )}
          <button onClick={handleLogout}>LOGOUT</button>
        </ul>
        <div className="hamburger">
          <GiHamburgerMenu onClick={() => setShow(!show)} />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
