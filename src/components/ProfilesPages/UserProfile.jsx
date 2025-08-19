import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";

import { API_URL } from "../../shared";
import BusinessCard from "../Cards/BusinessCard";
import { AppContext } from "../../AppContext";
import "./styling/UserProfileStyle.css";
import "../SettingsStyles.css";

const UserProfile = () => {
  let { profileId } = useParams();
  profileId = Number(profileId);

  const { socket, user, friends, setFriends, setUser } = useContext(AppContext);

  // -------------------- State --------------------
  // Profile info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  // Message handling
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const navigate = useNavigate();
  // Friends/business info
  const [friendship, setFriendship] = useState(null);
  const [friendLoading, setFriendLoading] = useState(true);
  const [businesses, setBusinesses] = useState([]);
  const [followingBusinesses, setFollowingBusinesses] = useState([]);
  const [friendsAmount, setFriendsAmount] = useState(0);
  const [followingAmount, setFollowingAmount] = useState(0);

  // -------------------- Socket: live friends count --------------------
  useEffect(() => {
    console.log("Socket connection status:", socket?.connected); // Debug log

    if (!socket || !user?.id) {
      console.warn("Socket or user not available - skipping setup", {
        socket,
        user,
      });
      return;
    }

    // Verify socket connection
    if (!socket.connected) {
      console.error("Socket exists but is not connected");
      return;
    }

    console.log(
      `Setting up socket listeners for user ${user.id} and profile ${profileId}`
    );

    socket.emit("join-profile-room", profileId, (ack) => {
      console.log(
        "Join room acknowledgement:",
        ack || "No acknowledgment received"
      );
    });

    const handleFriendshipUpdate = (data) => {
      console.log("Received friendship-update:", data);
      const usersInvolved = [Number(data.user1), Number(data.user2)];
      if (usersInvolved.includes(Number(user.id))) {
        console.log("Update affects current user");
        setFriendship(
          data.status === "none"
            ? null
            : {
                status: data.status,
                user1: Number(data.user1),
                user2: Number(data.user2),
                user: {
                  id:
                    Number(data.user1) === Number(user.id)
                      ? Number(data.user2)
                      : Number(data.user1),
                },
              }
        );
        if (data.friendsCount !== undefined) {
          setFriendsAmount(data.friendsCount);
        }
        // Update friends context for accept/unfriend actions
        if (data.action === "accept") {
          setFriends((prev) => [
            ...prev,
            { id: profileId, username: username || `User ${profileId}` },
          ]);
        } else if (
          data.action === "unfriend" ||
          data.action === "decline" ||
          data.action === "cancel"
        ) {
          setFriends((prev) =>
            prev.filter((friend) => friend.id !== profileId)
          );
        }
      }
    };

    const handleFriendsAmount = (amount) => {
      console.log("Received friends count update:", amount);
      setFriendsAmount(amount);
    };

    socket.on("friendship-update", handleFriendshipUpdate);
    socket.on("friends/amount", handleFriendsAmount);
    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });

    return () => {
      console.log("Cleaning up socket listeners");
      socket.off("friendship-update", handleFriendshipUpdate);
      socket.off("friends/amount", handleFriendsAmount);
      socket.off("connect_error");
      socket.emit("leave-profile-room", profileId);
    };
  }, [socket, profileId, user?.id, username, setFriends]);

  // -------------------- Handle friend request actions --------------------
  const handleRequest = async (actionType = "add") => {
    console.log("Friend request initiated - action:", actionType);

    if (!socket || !socket.connected) {
      console.error("Socket not connected - cannot send friend request");
      return;
    }

    if (!user?.id) {
      console.error("No user ID - cannot send friend request");
      return;
    }

    console.log("Current friendship state:", friendship);
    console.log("Action details:", {
      profileId,
      viewerId: Number(user.id),
      actionType,
    });

    const oldFriendship = friendship;
    const oldFriends = [...friends];
    try {
      let action = actionType;
      let newStatus;

      if (!friendship && actionType === "add") {
        // Optimistic update for adding friend
        const [user1, user2] =
          Number(user.id) < profileId
            ? [Number(user.id), profileId]
            : [profileId, Number(user.id)];
        newStatus = Number(user.id) < profileId ? "pending1" : "pending2";
        setFriendship({
          status: newStatus,
          user1,
          user2,
          user: { id: profileId },
        });
        setFriendsAmount((prev) => prev + 1); // Optimistic friends count update
        action = "add";
      } else if (friendship?.status.startsWith("pending")) {
        const isReceiver =
          (friendship.user1 === Number(user.id) &&
            friendship.status === "pending1") ||
          (friendship.user2 === Number(user.id) &&
            friendship.status === "pending2");

        if (isReceiver) {
          if (actionType === "accept") {
            setFriendship({ ...friendship, status: "accepted" });
            setFriends((prev) => [
              ...prev,
              { id: profileId, username: username || `User ${profileId}` },
            ]);
            setFriendsAmount((prev) => prev + 1); // Optimistic friends count update
            action = "accept";
          } else if (actionType === "decline") {
            setFriendship(null);
            setFriendsAmount((prev) => prev - 1); // Optimistic friends count update
            action = "decline";
          }
        } else {
          setFriendship(null);
          setFriendsAmount((prev) => prev - 1); // Optimistic friends count update
          action = "cancel";
        }
      } else if (
        friendship?.status === "accepted" &&
        actionType === "unfriend"
      ) {
        setFriendship(null);
        setFriends((prev) => prev.filter((friend) => friend.id !== profileId));
        setFriendsAmount((prev) => prev - 1); // Optimistic friends count update
        action = "unfriend";
      }

      console.log("Emitting friend-request with:", {
        profileId,
        viewerId: Number(user.id),
        action,
      });

      socket.emit(
        "friend-request",
        {
          profileId,
          viewerId: Number(user.id),
          action,
        },
        (ack) => {
          console.log("Server acknowledgement:", ack);
          if (!ack?.success) {
            console.warn(
              "Server reported failure - reverting optimistic update"
            );
            setFriendship(oldFriendship);
            setFriends(oldFriends);
            setFriendsAmount(oldFriends.length);
          }
        }
      );
    } catch (err) {
      console.error("Friend request failed:", err);
      setFriendship(oldFriendship);
      setFriends(oldFriends);
      setFriendsAmount(oldFriends.length);
    }
  };

  // -------------------- Fetch profile, friends, businesses, and following --------------------
  useEffect(() => {
    const fetchProfileFriendshipAndFollowing = async () => {
      try {
        // Fetch profile info
        const res = await axios.get(
          `${API_URL}/api/profiles/user/${profileId}`,
          {
            withCredentials: true,
          }
        );
        setFirstName(res.data.firstName || "");
        setLastName(res.data.lastName || "");
        setUsername(res.data.username || "");
        setEmail(res.data.email || "");
        setBio(res.data.bio || "");
        setProfilePicture(res.data.profilePicture || "");
      } catch (error) {
        console.error("Failed to fetch user profile information", error);
      }

      try {
        // Fetch friends count and relationship status
        const friendsOfProfile = await axios.get(
          `${API_URL}/api/profiles/user/${profileId}/friends`,
          { withCredentials: true }
        );
        setFriendsAmount(friendsOfProfile.data.length);

        const friendShipsOfViewer = await axios.get(
          `${API_URL}/api/profiles/me/friends`,
          { withCredentials: true }
        );
        console.log("Fetched friendships:", friendShipsOfViewer.data);

        const friendshipStatus = friendShipsOfViewer.data.find((friendship) => {
          console.log(
            "Comparing friendship user:",
            friendship.user.id,
            profileId
          );
          return String(friendship.user.id) === String(profileId);
        });

        setFriendship(friendshipStatus || null);
        setFriends(friendShipsOfViewer.data.map((f) => f.user));
      } catch (error) {
        console.error("Failed to fetch friendship data", error);
        setFriendship(null);
        setFriends([]);
      }

      try {
        // Fetch businesses owned by this profile
        const businessesRes = await axios.get(
          `${API_URL}/api/profiles/user/${profileId}/businesses`,
          { withCredentials: true }
        );
        setBusinesses(businessesRes.data || []);
      } catch (error) {
        console.error("Failed to fetch businesses", error);
        setBusinesses([]);
      }

      try {
        // Fetch businesses user is following
        const followingRes = await axios.get(
          `${API_URL}/api/profiles/user/${profileId}/following`,
          { withCredentials: true }
        );
        const businessesOnly = followingRes.data.map(
          (follow) => follow.business
        );
        setFollowingBusinesses(businessesOnly || []);
        setFollowingAmount(businessesOnly.length || 0);
      } catch (error) {
        console.error("Failed to fetch following businesses", error);
        setFollowingBusinesses([]);
        setFollowingAmount(0);
      }

      setFriendLoading(false);
    };
    fetchProfileFriendshipAndFollowing();
    setIsEditing(false);
  }, [user?.id, profileId, setFriends]);

  // -------------------- Handle profile submit --------------------
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");
    
    console.log("Submitting profile update:", {
      firstName,
      lastName,
      username,
      email,
      bio,
    });

    try {
      const response = await axios.patch(
        `${API_URL}/api/profiles/me`,
        { firstName, lastName, username, email, bio },
        { withCredentials: true }
      );
      console.log("Profile update successful:", response.data);
      setUser((prev) => ({
        ...prev,
        firstName,
        lastName,
        username,
        email,
        bio,
      }));
      // Navigate back to profile view with success message
      setIsEditing(false);
      setMessage("Profile updated successfully!");
      setMessageType("success");
      
      // Clear message after 5 seconds
      setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 5000);
    } catch (error) {
      console.error(
        "Failed to update profile:",
        error.response?.data || error.message
      );
      setMessage(error.response?.data?.message || "Failed to update profile. Please try again.");
      setMessageType("error");
    }
  };

  // -------------------- Logic --------------------
  const isOwner = user && String(user.id) === String(profileId);

  // -------------------- Render helpers --------------------
  const renderEditForm = () => {
    const isFormValid = username.trim() && firstName.trim() && lastName.trim();

    return (
      <div className="settings-container">
        <div className="settings-content">
          <div className="settings-header">
            <h1 className="settings-title">Edit Profile</h1>
            <p className="settings-subtitle">Update your personal information</p>
          </div>
          
          <div className="settings-section">
            {message && (
              <div className={`message ${messageType}`}>
                {message}
              </div>
            )}
            
            <form onSubmit={handleProfileSubmit}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Enter your last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <input
                  id="bio"
                  name="bio"
                  type="text"
                  placeholder="Tell us about yourself"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <div className="button-group">
                <button type="submit" className="btn btn-primary" disabled={!isFormValid}>
                  Save Profile
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setIsEditing(false);
                    setMessage("");
                    setMessageType("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const renderBusinesses = () =>
    businesses.length > 0 && (
      <div className="businesses-list">
        <h3>Businesses</h3>
        {businesses.map((business) => (
          <BusinessCard key={business.id} business={business} />
        ))}
      </div>
    );

  const renderFriendsCount = () => {
    if (friendship?.status === "accepted" || isOwner) {
      return (
        <Link to={`/user/friendsList/${profileId}`}>
          <div className="friends/following">
            <p>{friendsAmount}</p>
            <h5>Friends</h5>
          </div>
        </Link>
      );
    } else {
      return (
        <div className="friends/following">
          <p>{friendsAmount}</p>
          <h5>Friends</h5>
        </div>
      );
    }
  };

  const renderCalendarButton = () => {
    if (isOwner || (friendship && friendship.status === "accepted")) {
      return (
        <Link to={`/user/${profileId}/calendar`} className="calendar-btn">
          View Calendar
        </Link>
      );
    }
    return null;
  };

  const renderFollowingCount = () => {
    if (friendship?.status === "accepted" || isOwner) {
      return (
        <Link to={`/user/followingList/${profileId}`}>
          <div className="friends/following">
            <p>{followingAmount}</p>
            <h5>Following</h5>
          </div>
        </Link>
      );
    } else {
      return (
        <div className="friends/following">
          <p>{followingAmount}</p>
          <h5>Following</h5>
        </div>
      );
    }
  };

  // -------------------- Render friend request button --------------------
  const renderFriendRequestButton = () => {
    if (!user || isOwner) return null;

    console.log("Friendship state for button:", friendship);

    if (!friendship) {
      return <button className="friend-action-btn" onClick={() => handleRequest("add")}>Add Friend</button>;
    }

    if (friendship.status.startsWith("pending")) {
      const isReceiver =
        (friendship.user1 === Number(user.id) &&
          friendship.status === "pending1") ||
        (friendship.user2 === Number(user.id) &&
          friendship.status === "pending2");

      if (isReceiver) {
        return (
          <div className="request-buttons">
            <button onClick={() => handleRequest("accept")}>Accept</button>
            <button onClick={() => handleRequest("decline")}>Decline</button>
          </div>
        );
      }
      return (
        <button onClick={() => handleRequest("cancel")}>Cancel Request</button>
      );
    }

    if (friendship.status === "accepted") {
      return (
        <button className="friend-action-btn" onClick={() => handleRequest("unfriend")}>Unfriend</button>
      );
    }
  };

  if (isOwner) {
    if (isEditing) return renderEditForm();
    return (
      <div className="profileCard">
        {message && (
          <div className={`message ${messageType}`} style={{
            position: 'fixed',
            top: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            padding: '16px 24px',
            borderRadius: '12px',
            textAlign: 'center',
            fontWeight: '600',
            fontSize: '16px',
            background: messageType === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
            color: 'white',
            border: `2px solid ${messageType === 'success' ? '#10b981' : '#ef4444'}`,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            animation: 'slideDown 0.4s ease-out',
            minWidth: '300px',
            maxWidth: '500px'
          }}>
            {message}
          </div>
        )}
        <div className="profileHeader">
          <img src={profilePicture} className="profilePic" alt="Profile" />
          <div>
            <h1>
              {firstName} {lastName}
            </h1>
            <p className="username">@{username}</p>
          </div>
        </div>
        <div className="profileDetails">
          <p>
            <strong>Email:</strong> {email}
          </p>
          <div className="friends-following-container">
            {renderFriendsCount()}
            {renderFollowingCount()}
          </div>
          {bio && (
            <p>
              <strong>Bio:</strong> {bio}
            </p>
          )}
        </div>
        <button className="editProfileBtn" onClick={() => setIsEditing(true)}>
          Edit Profile
        </button>
        {renderBusinesses()}
      </div>
    );
  }

  return (
    <div className="profileCard">
      <div className="profileHeader">
        <img src={profilePicture} className="profilePic" alt="Profile" />
        <div>
          <h1>
            {firstName} {lastName}
          </h1>
          <p className="username">@{username}</p>
        </div>
      </div>
      <div className="profileDetails">
        {email && (
          <p>
            <strong>Email:</strong> {email}
          </p>
        )}
        {bio && (
          <p>
            <strong>Bio:</strong> {bio}
          </p>
        )}
        <div className="friends-following-container">
          {renderFriendsCount()}
          {renderFollowingCount()}
        </div>
      </div>
      {renderFriendRequestButton()}
      {renderCalendarButton()}
      {renderBusinesses()}
    </div>
  );
};

export default UserProfile;
