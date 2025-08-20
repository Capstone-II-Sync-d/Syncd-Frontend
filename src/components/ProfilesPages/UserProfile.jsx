import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../shared";
import { AppContext } from "../../AppContext";
import BusinessCard from "../Cards/BusinessCard";
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
    if (!user || !socket) return;

    console.log("Registering listeners in profile");
    socket.emit("join-profile-room", profileId);

    socket.on("friend-gained", onFriendGained);
    socket.on("friend-lost", onFriendLost);
    socket.on("friend-request-received", onRequestReceived);
    socket.on("friend-request-accepted", onRequestAccepted);
    socket.on("friendship-deleted", onRequestDeleted);
    socket.on("friend-request-success", onRequestSuccess);

    return () => {
      socket.off("friend-gained", onFriendGained);
      socket.off("friend-lost", onFriendLost);
      socket.off("friend-request-received", onRequestReceived);
      socket.off("friend-request-accepted", onRequestAccepted);
      socket.off("friendship-deleted", onRequestDeleted);
      socket.off("friend-request-success", onRequestSuccess);
    }
  }, [user, socket]);

  const onFriendGained = () => {
    console.log("Gained friend");
    setFriendsAmount(prev => prev + 1);
  };

  const onFriendLost = () => {
    console.log("Lost friend");
    setFriendsAmount(prev => prev - 1);
  };
  
  const onRequestReceived = (notif) => {
    console.log("Received request");
    const usersInvolved = [notif.userId, notif.otherUser.id];
    if (!usersInvolved.includes(user.id) ||
        !usersInvolved.includes(profileId))
      return;

    setFriendship({
      id: notif.friendshipId,
      status: "pendingViewer",
    });
  };

  const onRequestAccepted = (notif) => {
    console.log("Request accepted");
    const usersInvolved = [notif.userId, notif.otherUser.id];
    if (!usersInvolved.includes(user.id) ||
        !usersInvolved.includes(profileId))
      return;

    setFriendship({
      id: notif.friendshipId,
      status: "accepted",
    });
  };

  const onRequestDeleted = (friendship) => {
    console.log("Request deleted");
    const usersInvolved = [friendship.user1, friendship.user2];
    if (!usersInvolved.includes(user.id) ||
        !usersInvolved.includes(profileId))
      return;

    setFriendship(null);
  };

  const onRequestSuccess = (info) => {
    console.log("Request successful");
    if (info.receiverId !== profileId)
      return;

    switch (info.action) {
      case 'create':
        setFriendship({
          id: info.friendshipId,
          status: "pendingProfileUser",
        });
        break;
      case 'accept':
        setFriendship({
          id: info.friendshipId,
          status: "accepted",
        });
        break;
      case 'decline':
      case 'cancel':
      case 'remove':
        setFriendship(null);
        break;
    }
  }

  // -------------------- Fetch profile, friends, businesses, and following --------------------
  useEffect(() => {
    const fetchProfileFriendshipAndFollowing = async () => {
      profileInfo: try {
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

      friendshipInfo: try {
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

        const fShip = friendShipsOfViewer.data.find((fs) => {
          return String(fs.user.id) === String(profileId);
        });

        if (!fShip) {
          setFriendship(null);
          break friendshipInfo;
        }
        
        console.log("fShip", fShip);
        let status = fShip.status;
        if ((fShip.status === "pending1" && fShip.user1 === user.id) ||
              (fShip.status === "pending2" && fShip.user2 === user.id))
          status = "pendingViewer";
        else if ((fShip.status === "pending1" && fShip.user1 !== user.id) ||
                  (fShip.status === "pending2" && fShip.user2 !== user.id))
          status = "pendingProfileUser";
        setFriendship({
          id: fShip.id,
          status: status,
        });

        setFriends(friendShipsOfViewer.data.map((f) => f.user));
      } catch (error) {
        console.error("Failed to fetch friendship data", error);
        setFriendship(null);
        setFriends([]);
      }

      businessesInfo: try {
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

      followingInfo: try {
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
  }, [user?.id, profileId]);

  // -------------------- Handle friend request actions --------------------
  const handleRequest = async (action) => {
    console.log(`Attempting to ${action} for friendship ${friendship?.id}`);

    switch (action) {
      case "add":
        if (friendship)
          return console.error("Cannot send user friend request, relationship already exists");

        socket.emit("friend-request", {
          receiverId: profileId,
          friendshipId: 0,
          action: "create",
        });
        break;
      case "accept":
      case "decline":
        if (friendship?.status !== "pendingViewer")
          return console.error("Cannot respond to friend request, it is not for you");

        socket.emit("friend-request", {
          receiverId: profileId,
          friendshipId: friendship.id,
          action: action,
        });
        break;
      case "cancel":
        if (friendship?.status !== "pendingProfileUser")
          return console.error("Cannot cancel friend request, it is for you");

        socket.emit("friend-request", {
          receiverId: profileId,
          friendshipId: friendship.id,
          action: action,
        });
        break;
      case "unfriend":
        if (friendship?.status !== "accepted")
          return console.error("Cannot unfriend user, you are not already friends");

        socket.emit("friend-request", {
          receiverId: profileId,
          friendshipId: friendship.id,
          action: "remove",
        });
        break;
    }
  };

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
            <h5>Following</h5>
            <p>{followingAmount}</p>
          </div>
        </Link>
      );
    } else {
      return (
        <div className="friends/following">
          <h5>Following</h5>
          <p>{followingAmount}</p>
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

    switch (friendship.status) {
      case "pendingViewer":
        return (
          <div className="request-buttons">
            <button className="friend-action-btn" onClick={() => handleRequest("accept")}>Accept</button>
            <button className="friend-action-btn" onClick={() => handleRequest("decline")}>Decline</button>
          </div>
        );
      case "pendingProfileUser":
        return (
          <button className="friend-action-btn" onClick={() => handleRequest("cancel")}>Cancel Request</button>
        );
      case "accepted":
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
