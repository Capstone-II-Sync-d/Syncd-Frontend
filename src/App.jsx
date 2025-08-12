import React, { useState, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
// import "./AppStyles.css";
import NavBar from "./components/NavBar";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import NotFound from "./components/NotFound";
import UserProfile from "./components/UserProfile";
import BusinessProfile from "./components/BusinessProfile";
import { API_URL, SOCKETS_URL, NODE_ENV } from "./shared";
import { io } from "socket.io-client";
import Explore from "./components/Explore";
import Home from "./components/calendar/Home";
import { AppContext } from "./AppContext";

const socket = io(SOCKETS_URL, {
  withCredentials: NODE_ENV === "production",
});

const App = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const appContext = useMemo(() => ({
    user,
    setUser,
    notifications,
    setNotifications,
  }));

  const getNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notifications/me`, {
        withCredentials: true,
      });
      setNotifications(response.data.notifications);
      console.log(response.data.message);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getNotifications();
  }, []);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("🔗 Connected to socket");
    });

  // Cleanup socket on unmount
    return () => {
      socket.off("connect");
    };
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      console.log("Checking authentication...");
      const response = await axios.get(`${API_URL}/auth/me`, {
        withCredentials: true,
      });
      console.log("Authentication successful: ", response.data);
      setUser(response.data.user);
    } catch (error) {
      console.log("Not authenticated: ", error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Check authentication status on app load
  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      console.log("Logging out...");
      // Logout from our backend
      await axios.post(
        `${API_URL}/auth/logout`,
        {},
        {
          withCredentials: true,
        }
      );
      setUser(null);
      console.log("Logout successful");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div>
      <AppContext.Provider value={appContext}>
        <NavBar user={user} onLogout={handleLogout} />
        <div className="app">
          <Routes>
            <Route path="/main" element={<Home user={user} />} /> 
            <Route
              path="/login"
              element={<Login setUser={setUser} socket={socket} />}
            />
            <Route path="/signup" element={<Signup setUser={setUser} />} />
            <Route path="/explore" element={<Explore />} />
            <Route exact path="/" element={<Home user={user} />} />
            <Route
              path="/user/profile/:ownerId"
              element={<UserProfile socket={socket} user={user} />}
              />
            <Route
              path="/business/profile/:businessId"
              element={<BusinessProfile user={user} />}
              />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </AppContext.Provider>
    </div>
  );
};

const Root = () => {
  return (
    <Router>
      <App />
    </Router>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<Root />);