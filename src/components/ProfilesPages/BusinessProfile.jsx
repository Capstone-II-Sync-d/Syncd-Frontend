import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../shared";
import "./styling/BusinessProfileStyle.css";
import "../SettingsStyles.css";

const BusinessProfile = ({ socket, user }) => {
  let { businessId } = useParams();
  businessId = Number(businessId);

  // -------------------- State --------------------
  // Business info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [category, setCategory] = useState("");
  const [pictureUrl, setPictureUrl] = useState("");
  const [owner, setOwner] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  // Message handling
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // Follow info
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(true);
  const [followersAmount, setFollowersAmount] = useState(0);

  // -------------------- Socket: live followers count --------------------
  useEffect(() => {
    if (!socket || !businessId) return;
    socket.emit("join-business-room", businessId);
    const handleReconnect = () => {
      // Join business room for live updates
      socket.emit("join-business-room", businessId);
    };
    socket.on("connect", handleReconnect);

    const handleFollowersAmount = (amount) => setFollowersAmount(amount);
    const handleFollowStatus = (data) => {
      if (data.success) {
        setIsFollowing(data.isFollowing);
        // Update followers count if provided
        if (data.businessFollowersCount !== undefined) {
          setFollowersAmount(data.businessFollowersCount);
        }
      }
    };

    socket.on("followers/amount", handleFollowersAmount);
    socket.on("follow-status", handleFollowStatus);

    return () => {
      socket.off("followers/amount", handleFollowersAmount);
      socket.off("follow-status", handleFollowStatus);
    };
  }, [socket, businessId]);

  // -------------------- Fetch business data --------------------
  useEffect(() => {
    const fetchBusinessData = async () => {
      // Fetch business info
      try {
        const res = await axios.get(
          `${API_URL}/api/profiles/business/${businessId}`,
          { withCredentials: true }
        );
        setName(res.data.name || "");
        setEmail(res.data.email || "");
        setBio(res.data.bio || "");
        setCategory(res.data.category || "");
        setPictureUrl(res.data.pictureUrl || "");
        setOwner(res.data.user || null);
      } catch (error) {
        console.log("Failed to fetch business information", error);
      }

      // Fetch follow status and followers count
      try {
        // Check if current user follows this business
        const followRes = await axios.get(
          `${API_URL}/api/profiles/me/following`,
          { withCredentials: true }
        );
        console.log(businessId);
        console.log(followRes.data);
        setIsFollowing(
          followRes.data.some(
            (f) => String(f.businessId) === String(businessId)
          )
        );

        // Get followers count
        const followersRes = await axios.get(
          `${API_URL}/api/profiles/business/${businessId}/followers`,
          { withCredentials: true }
        );
        setFollowersAmount(followersRes.data.length);
      } catch (error) {
        setIsFollowing(false);
      }
      setFollowLoading(false);
    };
    fetchBusinessData();
    setIsEditing(false);
  }, [user?.id, businessId]);

  // -------------------- Logic --------------------
  const isOwner = user && owner && String(user.id) === String(owner.id);

  const handleFollow = (action) => {
    socket.emit("business-follow", {
      businessId,
      userId: user.id,
      action: action,
    });
    if (action === "follow") setFollowersAmount(followersAmount + 1);
    else if (action === "unfollow") setFollowersAmount(followersAmount - 1);
  };

  const handleBusinessSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");
    
    try {
      const res = await axios.patch(
        `${API_URL}/api/profiles/business/${businessId}`,
        { name, email, bio, category, pictureUrl },
        { withCredentials: true }
      );
      // Navigate back to business view with success message
      setIsEditing(false);
      setMessage("Business updated successfully!");
      setMessageType("success");
      
      // Clear message after 5 seconds
      setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 5000);
    } catch (error) {
      console.error("Failed to update business", error);
      setMessage(error.response?.data?.message || "Failed to update business. Please try again.");
      setMessageType("error");
    }
  };

  // -------------------- Render helpers --------------------
  const renderEditForm = () => {
    const isFormValid = name.trim() && email.trim() && category.trim();

    return (
      <div className="settings-container">
        <div className="settings-content">
          <div className="settings-header">
            <h1 className="settings-title">Edit Business</h1>
            <p className="settings-subtitle">Update your business information</p>
          </div>
          
          <div className="settings-section">
            {message && (
              <div className={`message ${messageType}`}>
                {message}
              </div>
            )}
            
            <form onSubmit={handleBusinessSubmit}>
              <div className="form-group">
                <label htmlFor="name">Business Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter business name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter business email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <input
                  id="category"
                  name="category"
                  type="text"
                  placeholder="Enter business category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="bio">Description</label>
                <textarea
                  id="bio"
                  name="bio"
                  placeholder="Describe your business"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label htmlFor="pictureUrl">Picture URL</label>
                <input
                  id="pictureUrl"
                  name="pictureUrl"
                  type="url"
                  placeholder="Enter image URL for your business"
                  value={pictureUrl}
                  onChange={(e) => setPictureUrl(e.target.value)}
                />
              </div>

              <div className="button-group">
                <button type="submit" className="btn btn-primary" disabled={!isFormValid}>
                  Save Business
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

  const renderFollowersCount = () => (
    <Link to={`/business/followers/${businessId}`}>
      <div className="followers">
        <p>{followersAmount}</p>
        <h5>Followers</h5>
      </div>
    </Link>
  );

  const renderFollowButton = () => {
    if (!followLoading) {
      if (isFollowing) {
        return (
          <button
            className="follow-button"
            onClick={() => {
              handleFollow("unfollow");
            }}
          >
            Unfollow
          </button>
        );
      } else if (!isFollowing) {
        return (
          <button
            className="follow-button"
            onClick={() => {
              handleFollow("follow");
            }}
          >
            Follow
          </button>
        );
      }
    }
  };

  // Owner view
  if (isOwner) {
    if (isEditing) return renderEditForm();
    return (
      <div className="profileCard">
        {message && (
          <div className={`message ${messageType} popup-message`}>
            {message}
          </div>
        )}
        <div className="profileHeader">
          <img src={pictureUrl} className="profilePic" alt={name} />
          <div>
            <h1>{name}</h1>
            <p className="category">{category}</p>
          </div>
        </div>
        <div className="profileDetails">
          <p>
            <strong>Email:</strong> {email}
          </p>
          {renderFollowersCount()}
          {bio && (
            <p>
              <strong>Bio:</strong> {bio}
            </p>
          )}
        </div>
        <button className="editProfileBtn" onClick={() => setIsEditing(true)}>
          Edit Business
        </button>
      </div>
    );
  }

  // Non-owner view
  return (
    <div className="profileCard">
      <div className="profileHeader">
        <img src={pictureUrl} className="profilePic" alt={name} />
        <div>
          <h1>{name}</h1>
          <p className="category">{category}</p>
        </div>
      </div>
      <div className="profileDetails">
        {email && (
          <p>
            <strong>Email:</strong> {email}
          </p>
        )}
        {renderFollowersCount()}
        {bio && (
          <p>
            <strong>Bio:</strong> {bio}
          </p>
        )}
      </div>
      {renderFollowButton()}
    </div>
  );
};

export default BusinessProfile;
