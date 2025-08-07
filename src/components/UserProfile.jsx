import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./AuthStyles.css";
import { API_URL } from "../shared";
import BusinessCard from "./BusinessCard";

const UserProfile = ({ socket, user }) => {
  const { profileId } = useParams();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [friendship, setFriendship] = useState(null);
  const [friendLoading, setFriendLoading] = useState(true);
  const [businesses, setBusinesses] = useState([]);
  const [friendsAmount, setFriendsAmount] = useState(0);

  useEffect(() => {
    const fetchProfileAndFriendship = async () => {
      try {
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
        console.log("Failed to fetch user profile information", error);
        // handle error
      }
      try {
        //|---------------------------------------------------------------------------|
        // Gets the amount of friends that the profile that is being viewed has
        //|---------------------------------------------------------------------------|
        const friendShipsOfProfile = await axios.get(
          `${API_URL}/api/profiles/user/${profileId} friends`,
          { withCredentials: true }
        );
        // Get all accepted friendShips to count total friends of profile that is being viewed
        const friends = friendShipsOfProfile.data.filter(
          (friendShip) => friendShip.status === "accepted"
        );
        setFriendsAmount(friends.length);

        //|----------------------------------------------------------------------------|
        // Get the relationship status of the viewer and the profile for the friend request button
        //|----------------------------------------------------------------------------|
        //Look for all of the friendShipsOfViewer the user viewing the profile has
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
        //|-----------------------------------------------------------------------------|
      } catch (error) {
        //If  cannot find the friendship record, setfriendShipsOfViewer to null
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

  // Check if the user is the owner of the account
  const isOwner = user && String(user.id) === String(profileId);

  // Friend request button logic
  const handleRequest = async () => {
    socket.emit(
      "friend-request",
      { profileId: profileId },
      { viewerId: user.id }
    );
  };

  // Owner view
  if (isOwner) {
    if (isEditing) {
      return (
        <form>
          <input
            name="username"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            name="firstName"
            placeholder="First Name:"
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
        </form>
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
          <p>
            <strong>Email:</strong> {email}
          </p>
          <div>
            <p>{friendsAmount}</p>
            <h5>Friends</h5>
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
        {/* Businesses owned by this user */}
        {businesses.length > 0 && (
          <div className="businesses-list">
            <h3>Businesses</h3>
            {businesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        )}
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
      </div>
      {/* Friend request button logic */}
      {!friendLoading && friendship && (
        <div>
          {friendship.status === "pending2" && friendship.user1 === user.id && (
            <button className="friend-request-btn" disabled>
              Waiting
            </button>
          )}
          {friendship.status === "pending1" && friendship.user2 === user.id && (
            <button className="friend-request-btn" onClick={handleRequest}>
              Accept
            </button>
          )}
          {!friendship.status && (
            <button className="friend-request-btn" onClick={handleRequest}>
              Add Friend
            </button>
          )}
        </div>
      )}
      {/* Businesses owned by this user */}
      {businesses.length > 0 && (
        <div className="businesses-list">
          <h3>Businesses</h3>
          {businesses.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>
      )}
    </div>
  );
};

export default UserProfile;
