import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../shared";
import { AppContext } from "../../AppContext";
import BusinessCard from "../Cards/BusinessCard";

const UserProfile = () => {
  let { profileId } = useParams();
  profileId = Number(profileId);

  // -------------------- State --------------------
  // Profile info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  // Friends/business info
  const [friendship, setFriendship] = useState(null);
  const [friendLoading, setFriendLoading] = useState(true);
  const [businesses, setBusinesses] = useState([]);
  const [followingBusinesses, setFollowingBusinesses] = useState([]);
  const [friendsAmount, setFriendsAmount] = useState(0);
  const [followingAmount, setFollowingAmount] = useState(0);

  const { user, socket } = useContext(AppContext);

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

  // Fetch profile, friends, businesses, and following
  useEffect(() => {
    const fetchProfileFriendshipAndFollowing = async () => {
      try {
        // Fetch profile info
        const res = await axios.get(
          `${API_URL}/api/profiles/user/${profileId}`,
          { withCredentials: true }
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

        const friendshipStatus = friendShipsOfViewer.data.find((friendship) => {
          return String(friendship.user.id) === String(profileId);
        });

        setFriendship(friendshipStatus || null);
      } catch (error) {
        console.error("Failed to fetch friendship data", error);
        setFriendship(null);
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
  }, [user?.id, profileId]);

  // -------------------- Logic --------------------
  const isOwner = user && String(user.id) === String(profileId);
  // -------------------- Handle friend request actions --------------------
  const handleRequest = async (actionType = "add") => {
    const oldFriendship = friendship;
    try {
      let action = actionType;

      if (!friendship) {
        // Prepare new pending request
        const [user1, user2] =
          user.id < profileId ? [user.id, profileId] : [profileId, user.id];
        const newStatus = user.id < profileId ? "pending1" : "pending2";

        setFriendship({
          user1,
          user2,
          status: newStatus,
          user: { id: user.id },
        });
        action = "add";
      } else if (friendship.status.startsWith("pending")) {
        const isViewerReceiver =
          (friendship.user1 === user.id && friendship.status === "pending1") ||
          (friendship.user2 === user.id && friendship.status === "pending2");

        if (isViewerReceiver) {
          if (actionType === "accept") {
            setFriendship({ ...friendship, status: "accepted" });
            action = "accept";
          } else if (actionType === "decline") {
            setFriendship(null);
            action = "decline";
          }
        } else {
          setFriendship(null);
          action = "cancel";
        }
      } else if (friendship.status === "accepted") {
        setFriendship(null);
        action = "unfriend";
      }

      // Emit to server - will broadcast to all in profile room
      socket.emit("friend-request", {
        profileId,
        viewerId: user.id,
        action,
      });
    } catch (err) {
      console.error("Request failed", err);
      // Revert on error
      setFriendship(oldFriendship);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(
        `${API_URL}/api/profiles/me`,
        { firstName, lastName, username, email, bio },
        { withCredentials: true }
      );
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile", error);
    }
  };

  // -------------------- Render helpers --------------------

  const renderEditForm = () => {
    const isFormValid = username.trim() && firstName.trim() && lastName.trim();

    return (
      <form onSubmit={handleProfileSubmit}>
        <input
          name="username"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          name="firstName"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <input
          name="lastName"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <input
          name="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          name="bio"
          placeholder="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        <button type="submit" disabled={!isFormValid}>
          Save Profile
        </button>
      </form>
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

  const renderFollowingCount = () => {
    console.log("Count:", friendship);
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

    console.log("Friendship:", friendship);

    // Button states
    if (!friendship) {
      return <button onClick={() => handleRequest("add")}>Add Friend</button>;
    }

    if (friendship.status.startsWith("pending")) {
      const isReceiver =
        (friendship.user1 === user.id && friendship.status === "pending1") ||
        (friendship.user2 === user.id && friendship.status === "pending2");

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
        <button onClick={() => handleRequest("unfriend")}>Unfriend</button>
      );
    }
  };

  if (isOwner) {
    if (isEditing) return renderEditForm();
    return (
      <div className="profileCard">
        <div className="profileHeader">
          <img src={profilePicture} className="profilePic" />
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
          {renderFriendsCount()}
          {renderFollowingCount()}
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
        <img src={profilePicture} className="profilePic" />
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
        {renderFriendsCount()}
        {renderFollowingCount()}
      </div>
      {renderFriendRequestButton()}
      {renderBusinesses()}
    </div>
  );
};

export default UserProfile;
