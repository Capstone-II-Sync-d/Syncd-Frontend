import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
// import "./AuthStyles.css";
import { API_URL } from "../shared";

const BusinessProfile = ({ user }) => {
  const { businessId } = useParams();
  const [owner, setOwner] = useState();
  const [business, setBusiness] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  // Edit states
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPictureUrl, setEditPictureUrl] = useState("");

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/profiles/business/${businessId}`,
          {
            withCredentials: true,
          }
        );
        setBusiness(res.data);
        setOwner(res.data.user);
        setIsEditing(false);
      } catch (error) {
        console.error("Failed to fetch business profile:", error);
        setBusiness(null);
      }
    };
    fetchBusiness();
  }, [businessId]);

  // When entering edit mode, initialize edit states
  useEffect(() => {
    if (isEditing && business) {
      setEditName(business.name || "");
      setEditEmail(business.email || "");
      setEditBio(business.bio || "");
      setEditCategory(business.category || "");
      setEditPictureUrl(business.pictureUrl || "");
    }
  }, [isEditing, business]);

  if (!business) return <div>Loading...</div>;

  const isOwner = user && String(user.id) === String(business.ownerId);

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      name: editName,
      email: editEmail,
      bio: editBio,
      category: editCategory,
      pictureUrl: editPictureUrl,
    };
    await axios.patch(`${API_URL}/business/${businessId}`, payload, {
      withCredentials: true,
    });
    setIsEditing(false);
    setBusiness({ ...business, ...payload });
  };

  if (isOwner && isEditing) {
    return (
      <form onSubmit={handleSave}>
        <input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder="Business Name"
        />
        <input
          value={editEmail}
          onChange={(e) => setEditEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          value={editBio}
          onChange={(e) => setEditBio(e.target.value)}
          placeholder="Bio"
        />
        <input
          value={editCategory}
          onChange={(e) => setEditCategory(e.target.value)}
          placeholder="Category"
        />
        <input
          value={editPictureUrl}
          onChange={(e) => setEditPictureUrl(e.target.value)}
          placeholder="Picture URL"
        />
        <button type="button" onClick={() => setIsEditing(false)}>
          Save
        </button>
      </form>
    );
  }

  // Show only public info for non-owners (e.g., name, pictureUrl)
  return (
    <div className="profileCard">
      <div className="profileHeader">
        <img src={business.pictureUrl} className="profilePic" />
        <div>
          <h1>{business.name}</h1>
        </div>
      </div>
      <div className="profileDetails">
        <img src={owner.profilePicture} className="profilePic" />
        <h4>
          {" "}
          Owner: {owner.firstName} {owner.lastName}
        </h4>
        {isOwner && business.email && (
          <p>
            <strong>Email:</strong> {business.email}
          </p>
        )}
        {isOwner && business.bio && (
          <p>
            <strong>Bio:</strong> {business.bio}
          </p>
        )}
        {isOwner && business.category && (
          <p>
            <strong>Category:</strong> {business.category}
          </p>
        )}
      </div>
      {isOwner && (
        <button className="editProfileBtn" onClick={() => setIsEditing(true)}>
          Edit Business
        </button>
      )}
    </div>
  );
};

export default BusinessProfile;
