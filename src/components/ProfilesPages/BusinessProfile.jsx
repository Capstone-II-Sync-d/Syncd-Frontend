import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../shared";

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
    try {
      const res = await axios.patch(
        `${API_URL}/api/profiles/business/${businessId}`,
        { name, email, bio, category, pictureUrl },
        { withCredentials: true }
      );
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update business", error);
    }
  };

  // -------------------- Render helpers --------------------
  const renderEditForm = () => {
    const isFormValid = name.trim() && email.trim() && category.trim();

    return (
      <form onSubmit={handleBusinessSubmit}>
        <input
          name="name"
          placeholder="Business Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
        <input
          name="category"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <input
          name="pictureUrl"
          placeholder="Picture URL"
          value={pictureUrl}
          onChange={(e) => setPictureUrl(e.target.value)}
        />
        <button type="submit" disabled={!isFormValid}>
          Save Business
        </button>
      </form>
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

  const renderCalendarButton = () => {
    return (
      <Link to={`/business/${businessId}/calendar`} className="calendar-btn">
        View Calendar
      </Link>
    );
  };

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
          {renderCalendarButton()}
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
        {bio && (
          <p>
            <strong>Bio:</strong> {bio}
          </p>
        )}
        {renderFollowersCount()}
        {renderCalendarButton()}
      </div>
      {renderFollowButton()}
    </div>
  );
};

export default BusinessProfile;
