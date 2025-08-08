import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import "./AuthStyles.css";
import { API_URL } from "../shared";
import BusinessCard from "./BusinessCard";

const UserProfile = ({ socket, user }) => {
  const { profileId } = useParams();

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
  const [friendsAmount, setFriendsAmount] = useState(0);

  // -------------------- Socket: live friends count --------------------
  useEffect(() => {
    if (!socket) return;
    socket.emit("join-profile-room", profileId);
  }, [socket, profileId]);

  useEffect(() => {
    if (!socket) return;
    // Listen for live updates of friends amount from backend
    const handleFriendAmount = (friendAmount) => setFriendsAmount(friendAmount);
    socket.on("friends/amount", handleFriendAmount);
    // Cleanup listener on unmount
    return () => socket.off("friends/amount", handleFriendAmount);
  }, [socket]);

  // -------------------- Fetch profile, friends, businesses --------------------
  useEffect(() => {
    const fetchProfileAndFriendship = async () => {
      // Fetch profile info
      try {
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
        console.log("Failed to fetch user profile information", error);
      }

      // Fetch friends count and relationship status
      try {
        // Get all friends of the profile user
        const friendsOfProfile = await axios.get(
          `${API_URL}/api/profiles/user/${profileId}/friends`,
          { withCredentials: true }
        );
        setFriendsAmount(friendsOfProfile.data.length);

        // Get relationship status for friend request button
        // Look for all friendships the viewer has
        const friendShipsOfViewer = await axios.get(
          `${API_URL}/api/profiles/me/friends`,
          { withCredentials: true }
        );
        // Find the friendship between the current user and the profile being viewed
        const friendshipStatus = friendShipsOfViewer.data.find(
          (friendShip) =>
            friendShip.user1 === profileId || friendShip.user2 === profileId
        );
        setFriendship(friendshipStatus || null);
      } catch (error) {
        setFriendship(null);
      }

      // Fetch businesses owned by this profile
      try {
        const businessesRes = await axios.get(
          `${API_URL}/api/profiles/user/${profileId}/businesses`,
          { withCredentials: true }
        );
        setBusinesses(businessesRes.data || []);
      } catch (error) {
        setBusinesses([]);
      }
      setFriendLoading(false);
    };
    fetchProfileAndFriendship();
    setIsEditing(false);
  }, [user.id, profileId]);

  // -------------------- Logic --------------------
  // Check if the user is the owner of the account
  const isOwner = user && String(user.id) === String(profileId);

  // Friend request button logic
  const handleRequest = () => {
    socket.emit("friend-request", { profileId, viewerId: user.id });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.patch(
        `${API_URL}/api/profiles/me`,
        { firstName, lastName, username, email, bio },
        { withCredentials: true }
      );
      // Optionally update state or show success message here
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile", error);
    }
  };

  // -------------------- Render helpers --------------------
  // Render owner edit form
  const renderEditForm = () => {
    //.trim takes out spaces
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

  // Render businesses
  const renderBusinesses = () =>
    businesses.length > 0 && (
      <div className="businesses-list">
        <h3>Businesses</h3>
        {businesses.map((business) => (
          <BusinessCard key={business.id} business={business} />
        ))}
      </div>
    );

  // Render friends count
  const renderFriendsCount = () => (
    <Link to={`/user/friendsList/${profileId}`}>
      <div className="friends">
        <p>{friendsAmount}</p>
        <h5>Friends</h5>
      </div>
    </Link>
  );

  // Render friend request button (non-owner)
  const renderFriendRequestButton = () =>
    !friendLoading &&
    friendship && (
      <div>
        {/* Show correct button based on friendship status */}
        {friendship.status === "pending2" && friendship.user1 === user.id && (
          <button className="friend-request-waiting" disabled>
            Waiting
          </button>
        )}
        {friendship.status === "pending1" && friendship.user2 === user.id && (
          <button className="friend-request-accept" onClick={handleRequest}>
            Accept
          </button>
        )}
        {friendship?.status === "accepted" && (
          <div className="friend-request-unfriend" onClick={handleRequest}>
            <p>{friendsAmount}</p>
            <h5>Unfriend</h5>
          </div>
        )}
        {!friendship.status && (
          <button className="friend-request-add" onClick={handleRequest}>
            Add Friend
          </button>
        )}
      </div>
    );

  // Owner view
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

  // Non-owner view
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
      </div>
      {renderFriendRequestButton()}
      {renderBusinesses()}
    </div>
  );
};

export default UserProfile;
