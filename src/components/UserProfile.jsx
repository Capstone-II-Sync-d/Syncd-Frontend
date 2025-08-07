import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./AuthStyles.css";
import { API_URL } from "../shared";

const UserProfile = (socket, user) => {
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
        //Look for all of the friendships the user viewing the profile has
        const friendShips = await axios.get(
          `${API_URL}/api/profiles/me/friends`,
          { withCredentials: true }
        );
        console.log(friendShips);

        // filter out the friendship record with the profile they are veiwin, if there is any
        const friendship = await friendShips.data.filter((friendShip) => {
          friendShip.user1 === profileId || friendShip.user2 === profileId;
        });
        setFriendship(friendship);
      } catch (error) {
        //If  cannot find the friendship record, setFriendships to null
        setFriendship(null);
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
          {bio && (
            <p>
              <strong>Bio:</strong> {bio}
            </p>
          )}
        </div>
        <button className="editProfileBtn" onClick={() => setIsEditing(true)}>
          Edit Profile
        </button>
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
    </div>
  );
};

export default UserProfile;
