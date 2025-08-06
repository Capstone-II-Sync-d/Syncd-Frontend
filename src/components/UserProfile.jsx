import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./AuthStyles.css";
import { API_URL } from "../shared";
import BusinessCard from "./BusinessCard";

const UserProfile = ({ user }) => {
  const { ownerId } = useParams();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [businesses, setBusinesses] = useState([]);

  const profileInfo = async () => {
    try {
      const owner = await axios.get(`${API_URL}/api/profiles/user/${ownerId}`, {
        withCredentials: true,
      });

      const businessesRes = await axios.get(
        `${API_URL}/api/profiles/me/businesses`,
        {
          withCredentials: true,
        }
      );

      setFirstName(owner.data.firstName || "");
      setLastName(owner.data.lastName || "");
      setUsername(owner.data.username || "");
      setEmail(owner.data.email || "");
      setBio(owner.data.bio || "");
      setProfilePicture(owner.data.profilePicture || "");
      setBusinesses(businessesRes.data || []);
    } catch (error) {
      console.error("Error fetching profile info:", error);
    }
  };

  useEffect(() => {
    profileInfo();
    setIsEditing(false);
  }, [user.id]);

  const isOwner = ownerId === user.id.toString();

  if (isOwner) {
    if (isEditing) {
      return (
        <>
          <form className="profileEditForm">
            <label>
              Username:
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>

            <label>
              First Name:
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </label>

            <label>
              Last Name:
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </label>

            <label>
              Email:
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label>
              Bio:
              <input
                type="text"
                name="bio"
                placeholder="Bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </label>
            <button type="button" onClick={() => setIsEditing(false)}>
              Save
            </button>
          </form>
        </>
      );
    }

    // Owner view
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
            console.log("Hi");
          }}
        >
          Edit Profile
        </button>
        <div className="businessSection">
          <h2>Your Businesses</h2>
          {businesses.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>
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
      <div className="businessSection">
        <h2>Businesses</h2>
        {businesses.map((business) => (
          <BusinessCard key={business.id} business={business} />
        ))}
      </div>
    </div>
  );
};

export default UserProfile;
