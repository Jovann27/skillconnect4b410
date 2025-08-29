import { useContext, useEffect } from "react";
import "./App.css";
import { Context } from './main';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import Home from './components/Home/Home';
import Service from './components/Service/Service';
import MyService from './components/Service/MyService';
import PostService from './components/Service/PostService';
import ServiceDetails from './components/Service/ServiceDetails';
import Application from './components/Application/Application';
import MyApplication from './components/Application/MyApplications';
import ResumeModel from "./components/Application/ResumeModel";
import NotFound from './components/NotFound/NotFound';

import axios from 'axios';
import { Toaster } from 'react-hot-toast';

const App = () => {
  const { isAuthorized, setIsAuthorized, setUser } = useContext(Context);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(
          "http://localhost:4000/api/v1/user/getuser",
          { withCredentials: true }
        );
        setUser(response.data.user);
        setIsAuthorized(true);
      } catch (error) {
        setIsAuthorized(false);
      }
    };
    fetchUser();
  }, []);

  const PrivateRoute = ({ element }) => {
    return isAuthorized ? element : <Navigate to="/login" />;
  };

  return (
    <Router>
      <Navbar />
      <Toaster />
      <Routes>
        {/* Public routes */}
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={isAuthorized ? <Navigate to="/home" /> : <Login />} />
        <Route path="/register" element={isAuthorized ? <Navigate to="/home" /> : <Register />} />
        <Route path="/services/getall" element={<Service />} />
        <Route path="/service/:id" element={<ServiceDetails />} />

        {/* Protected routes */}
        <Route path="/my-services/me" element={<PrivateRoute element={<MyService />} />} />
        <Route path="/post-service" element={<PrivateRoute element={<PostService />} />} />
        <Route path="/applications/:id" element={<PrivateRoute element={<Application />} />} />
        <Route path="/my-applications/me" element={<PrivateRoute element={<MyApplication />} />} />
        <Route path="/resume/:id" element={<PrivateRoute element={<ResumeModel />} />} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </Router>
  );
};

export default App;
