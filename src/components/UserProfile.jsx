import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./AuthStyles.css";
import { API_URL } from "../shared";

const UserProfile = async (user) => {
  const ownerProfile = useParams(); //get the id of the profile of the specfiic user
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const owner = await axios.get(
    `${API_URL}/api/profiles/user/${ownerProfile}`,
    {
      withCredentials: true,
    }
  );

  //Update state of the user information
  const userInfo = () => {
    setFirstName(owner.firstName);
    setLastName(owner.lastName);
    setUsername(owner.username);
    setEmail(owner.email);
    setBio(owner.bio);
    setProfilePicture(user.profilePicture);
  };

  //On change of the user.id, it will run the userinfo function
  useEffect(() => {
    userInfo();
    setIsEditing(false);
  }, [user.id]);

  //Check if the user is the owner of the account, if so, the profile page will show this
  if (ownerProfile === user.id) {
    if (isEditing) {
      return (
        <form>
          <input
            name="username"
            placeholder="Username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
            }}
          />
          <input
            name="firstName"
            placeholder="First Name:"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
            }}
          />
          <input
            name="lastName"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
            }}
          />
          <input
            name="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
          <input
            name="bio"
            placeholder="Bio"
            value={bio}
            onChange={(e) => {
              setBio(e.target.value);
            }}
          />
        </form>
      );
    }
    //Owner view of profile not in editing mode
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
        <button
          className="editProfileBtn"
          onClick={() => {
            setIsEditing(true);
          }}
        >
          Edit Profile
        </button>
      </div>
    );
  }
  //Non owner view profile page
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
        {owner.email && (
          <p>
            <strong>Email:</strong> {owner.email}
          </p>
        )}
        {owner.bio && (
          <p>
            <strong>Bio:</strong> {owner.bio}
          </p>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
