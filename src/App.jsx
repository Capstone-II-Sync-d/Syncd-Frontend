import React, { useState, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import "./styles/GlobalStyles.css";
import NavBar from "./components/NavBar";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
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
import UserCalendarView from "./components/calendar/UserCalendarView";
import Settings from "./components/Settings";
import Landing from "./components/Landing";
import BusinessCalendarView from "./components/calendar/BusinessCalendarView";

const App = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [friends, setFriends] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

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

  const appContext = useMemo(
    () => ({
      socket,
      user, setUser,
      notifications, setNotifications,
      friends, setFriends,
      businesses, setBusinesses, getBusinesses,
    }),
    [socket, user, notifications, friends, businesses]
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

  useEffect(() => {
    if (user) {
      getNotifications();
      getBusinesses();
      setSocket(io(SOCKETS_URL, {
      withCredentials: true,
    }));
    } else {
      setNotifications([]);
      setBusinesses([]);
      setSocket(null);
    }
  }, [user]);

  useEffect(() => {
    if (!socket)
      return;

    socket.on("connect", () => {
      console.log("🔗 Connected to socket");
    });

    // Cleanup socket on unmount
    return () => {
      socket.off("connect");
    };
  }, [socket]);

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
      setBusinesses([]);
      console.log("Logout successful");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  //

  return (
    <div>
      <AppContext.Provider value={appContext}>
        <NavBar user={user} onLogout={handleLogout} />
        <div className="app">
          <Routes>
            <Route 
              path="/" 
              element={user ? <Home user={user} /> : <Landing />} 
            />
            <Route
              path="/login"
              element={<Login setUser={setUser} socket={socket} />}
            />
            <Route path="/signup" element={<Signup setUser={setUser} />} />
            <Route path="/user/:id/calendar" element={<UserCalendarView />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/main" element={<Home user={user} />} />

            <Route
              path="/user/profile/:profileId"
              element={<UserProfile socket={socket} user={user} />}
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
              element={<BusinessProfile socket={socket} user={user} />}
            />
            <Route
              path="/business/:businessId/calendar"
              element={
                <BusinessCalendarView socket={socket} user={user} />
              }
            />

            <Route
              path="/user/myBusinesses/"
              element={<MyBusinessesList user={user} />}
            />
            <Route path="/settings" element={<Settings />} />

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
