import React, { useState, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
// import "./AppStyles.css";
import NavBar from "./components/NavBar";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import NotFound from "./components/NotFound";
// import Main from "./components/Main";
import { API_URL, SOCKETS_URL, NODE_ENV } from "./shared";
import { io } from "socket.io-client";
import { AppContext } from "./AppContext";
import Home from "./components/calendar/Home";
import Explore from "./components/Explore";
import UserProfile from "./components/ProfilesPages/UserProfile";
import FriendsList from "./components/Lists/UserFriendsList";
import UserFollowingList from "./components/Lists/UserFollowingList";
import FollowersList from "./components/Lists/BusinessFollowersList";
import BusinessProfile from "./components/ProfilesPages/BusinessProfile";
import MyBusinessesList from "./components/Lists/MyBusinessesList";

const socket = io(SOCKETS_URL, {
  withCredentials: true,
});

const userSocket = io(`${SOCKETS_URL}/userProfile`, {
  withCredentials: NODE_ENV === "production",
});

const businessSocket = io(`${SOCKETS_URL}/businessProfile`, {
  withCredentials: NODE_ENV === "production",
});

const App = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [friends, setFriends] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const navigate = useNavigate();

  const appContext = useMemo(
    () => ({
      socket,
      user,
      setUser,
      notifications,
      setNotifications,
      friends,
      setFriends,
      businesses,
    }),
    [user, notifications, businesses]
  );

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

  const getBusinesses = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/profiles/me/businesses`,
        {
          withCredentials: true,
        }
      );
      setBusinesses(response.data || []);
    } catch (error) {
      console.error("Error fetching businesses:", error);
      setBusinesses([]);
    }
  };

  useEffect(() => {
    if (user) {
      getNotifications();
      getBusinesses();
    } else {
      setNotifications([]);
      setBusinesses([]);
    }
  }, [user]);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("🔗 Connected to socket");
    });

    // Cleanup socket on unmount
    return () => {
      socket.off("connect");
    };
  }, []);

  const connectUser = () => {
    if (!user || !socket?.connected)
      return;

    socket.emit("connected", user.id);
  }

  // Emit 'connected' when user changes and socket is connected
  useEffect(connectUser, []);
  useEffect(connectUser, [socket, user]);

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
      setNotifications([]);
      setBusinesses([]);
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
      navigate("/");
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
            <Route
              path="/login"
              element={<Login setUser={setUser} socket={socket} />}
            />
            <Route path="/signup" element={<Signup setUser={setUser} />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/main" element={<Home user={user} />} />

            <Route
              path="/user/profile/:profileId"
              element={<UserProfile socket={userSocket} user={user} />}
            />

            <Route
              path="/user/friendsList/:profileId"
              element={<FriendsList socket={socket} user={user} />}
            />
            <Route
              path="/user/followingList/:profileId"
              element={<UserFollowingList socket={socket} user={user} />}
            />
            <Route
              path="/business/followers/:businessId"
              element={<FollowersList socket={socket} user={user} />}
            />
            <Route
              path="/business/profile/:businessId"
              element={<BusinessProfile socket={businessSocket} user={user} />}
            />
            <Route
              path="/user/myBusinesses/"
              element={<MyBusinessesList user={user} />}
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
