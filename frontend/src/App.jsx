import { useContext, useEffect } from "react";
import "./App.css";
import { Context } from './main';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

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
          "",
          {
            withCredentials: true,
          }
        );
        setUser(response.data.user);
        setIsAuthorized(true);
      } catch (error) {
        setIsAuthorized(false);
      }
    };
    fetchUser();
  }, [isAuthorized]);

  return <>
  <Router>
        <Navbar />
        <Toaster />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/services/getall" element={<Service />} />
          <Route path="/my-services/me" element={<MyService />} />
          <Route path="/post-service" element={<PostService />} />
          <Route path="/service/:id" element={<ServiceDetails />} />
          <Route path="/applications/:id" element={<Application />} />
          <Route path="/my-applications/me" element={<MyApplication />} />
          <Route path="/resume/:id" element={<ResumeModel />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </Router>
  </>;
}

export default App;
