import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../shared";
import { AppContext } from "../AppContext";
import "./SettingsStyles.css";

const Settings = () => {
  const { user, businesses, getBusinesses, setUser } = useContext(AppContext);
  const navigate = useNavigate();
  
  // State for managing different sections
  const [activeSection, setActiveSection] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // success, error, warning

  // Profile edit state
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    bio: ""
  });

  // Business edit state
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [businessData, setBusinessData] = useState({
    name: "",
    email: "",
    bio: "",
    category: "",
    pictureUrl: ""
  });

  // Deletion confirmation states
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState(""); // profile, business

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        email: user.email || "",
        bio: user.bio || ""
      });
    }
  }, [user]);

  // Load businesses when component mounts
  useEffect(() => {
    if (user && getBusinesses) {
      getBusinesses();
    }
  }, [user, getBusinesses]);

  useEffect(() => {
    if (businesses && businesses.length > 0 && !selectedBusiness) {
      setSelectedBusiness(businesses[0]);
      setBusinessData({
        name: businesses[0].name || "",
        email: businesses[0].email || "",
        bio: businesses[0].bio || "",
        category: businesses[0].category || "",
        pictureUrl: businesses[0].pictureUrl || ""
      });
    }
  }, [businesses, selectedBusiness]);

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.patch(`${API_URL}/api/profiles/me`, profileData, {
        withCredentials: true
      });
      
      setUser(prev => ({
        ...prev,
        ...profileData
      }));
      
      showMessage("Profile updated successfully!", "success");
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error.response?.data?.error) {
        showMessage(error.response.data.error, "error");
      } else {
        showMessage("Failed to update profile. Please try again.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessUpdate = async (e) => {
    e.preventDefault();
    if (!selectedBusiness) return;
    
    setLoading(true);
    
    try {
      await axios.patch(`${API_URL}/api/profiles/business/${selectedBusiness.id}`, businessData, {
        withCredentials: true
      });
      
      await getBusinesses(); // Refresh businesses list
      showMessage("Business updated successfully!", "success");
    } catch (error) {
      console.error("Error updating business:", error);
      if (error.response?.data?.error) {
        showMessage(error.response.data.error, "error");
      } else {
        showMessage("Failed to update business. Please try again.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessDelete = async () => {
    if (!selectedBusiness || deleteConfirmation !== selectedBusiness.name) {
      showMessage("Please type the business name exactly to confirm deletion.", "error");
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.delete(`${API_URL}/api/profiles/business/${selectedBusiness.id}`, {
        withCredentials: true
      });
      
      await getBusinesses(); // Refresh businesses list
      setSelectedBusiness(null);
      setDeleteConfirmation("");
      setShowDeleteConfirm(false);
      showMessage("Business deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting business:", error);
      if (error.response?.data?.error) {
        showMessage(error.response.data.error, "error");
      } else {
        showMessage("Failed to delete business. Please try again.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileDelete = async () => {
    if (deleteConfirmation !== "DELETE MY ACCOUNT") {
      showMessage("Please type 'DELETE MY ACCOUNT' exactly to confirm deletion.", "error");
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.delete(`${API_URL}/api/profiles/me`, {
        withCredentials: true
      });
      
      setUser(null);
      navigate("/login");
      showMessage("Account deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting account:", error);
      if (error.response?.data?.error) {
        showMessage(error.response.data.error, "error");
      } else {
        showMessage("Failed to delete account. Please try again.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessSelect = (business) => {
    setSelectedBusiness(business);
    setBusinessData({
      name: business.name || "",
      email: business.email || "",
      bio: business.bio || "",
      category: business.category || "",
      pictureUrl: business.pictureUrl || ""
    });
  };

  if (!user) {
    return (
      <div className="settings-container">
        <div className="settings-content">
          <div className="settings-header">
            <h1 className="settings-title">Settings</h1>
            <p className="settings-subtitle">Please log in to access settings.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-content">
        {/* Header */}
        <div className="settings-header">
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">
            Manage your profile, businesses, and account preferences
          </p>
        </div>

      {/* Navigation Tabs */}
      <div className="settings-nav">
        <button 
          onClick={() => setActiveSection("profile")}
          className={`nav-tab ${activeSection === "profile" ? "active" : ""}`}
        >
          Profile Settings
        </button>
        <button 
          onClick={() => setActiveSection("business")}
          className={`nav-tab ${activeSection === "business" ? "active" : ""}`}
        >
          Business Settings
        </button>
        <button 
          onClick={() => setActiveSection("danger")}
          className={`nav-tab danger ${activeSection === "danger" ? "active" : ""}`}
        >
          Danger Zone
        </button>
      </div>

      {/* Profile Settings */}
      {activeSection === "profile" && (
        <div className="settings-section">
          <h2>Profile Settings</h2>
          <form onSubmit={handleProfileUpdate}>
            <div className="form-group">
              <label>First Name:</label>
              <input
                type="text"
                value={profileData.firstName}
                onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Last Name:</label>
              <input
                type="text"
                value={profileData.lastName}
                onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Username:</label>
              <input
                type="text"
                value={profileData.username}
                onChange={(e) => setProfileData({...profileData, username: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({...profileData, email: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Bio:</label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
              />
            </div>
            
            {/* Message Display */}
            {message && (
              <div className={`message ${messageType}`}>
                {message}
              </div>
            )}
            
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Updating..." : "Update Profile"}
            </button>
          </form>
        </div>
      )}

      {/* Business Settings */}
      {activeSection === "business" && (
        <div className="settings-section">
          <h2>Business Settings</h2>
          
          {businesses && businesses.length > 0 ? (
            <>
              {/* Business Selector */}
              {businesses.length > 1 && (
                <div className="form-group">
                  <label>Select Business to Edit:</label>
                  <select 
                    value={selectedBusiness?.id || ""} 
                    onChange={(e) => {
                      const business = businesses.find(b => b.id === parseInt(e.target.value));
                      handleBusinessSelect(business);
                    }}
                  >
                    {businesses.map(business => (
                      <option key={business.id} value={business.id}>
                        {business.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedBusiness && (
                <form onSubmit={handleBusinessUpdate}>
                  <div className="form-group">
                    <label>Business Name:</label>
                    <input
                      type="text"
                      value={businessData.name}
                      onChange={(e) => setBusinessData({...businessData, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Business Email:</label>
                    <input
                      type="email"
                      value={businessData.email}
                      onChange={(e) => setBusinessData({...businessData, email: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Category:</label>
                    <input
                      type="text"
                      value={businessData.category}
                      onChange={(e) => setBusinessData({...businessData, category: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Bio:</label>
                    <textarea
                      value={businessData.bio}
                      onChange={(e) => setBusinessData({...businessData, bio: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Picture URL:</label>
                    <input
                      type="url"
                      value={businessData.pictureUrl}
                      onChange={(e) => setBusinessData({...businessData, pictureUrl: e.target.value})}
                    />
                  </div>
                  
                  {/* Message Display */}
                  {message && (
                    <div className={`message ${messageType}`}>
                      {message}
                    </div>
                  )}
                  
                  <div className="button-group">
                    <button type="submit" disabled={loading} className="btn btn-primary">
                      {loading ? "Updating..." : "Update Business"}
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => {
                        setDeleteType("business");
                        setShowDeleteConfirm(true);
                      }}
                      className="btn btn-danger"
                    >
                      Delete Business
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="empty-businesses">
              <div className="empty-businesses-icon">🏢</div>
              <p>You don't have any businesses yet.</p>
              <p style={{ fontSize: "14px", marginTop: "8px" }}>
                Create one from your calendar to get started!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Danger Zone */}
      {activeSection === "danger" && (
        <div className="settings-section">
          <h2 className="danger-title">Danger Zone</h2>
          <div className="danger-zone">
            <h3>Delete Account</h3>
            <p>This action cannot be undone. This will permanently delete your account and all associated data.</p>
            
            {/* Message Display */}
            {message && (
              <div className={`message ${messageType}`}>
                {message}
              </div>
            )}
            
            <button 
              onClick={() => {
                setDeleteType("profile");
                setShowDeleteConfirm(true);
              }}
              className="btn btn-danger"
            >
              Delete My Account
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">
              {deleteType === "business" ? "Delete Business" : "Delete Account"}
            </h3>
            <p>
              {deleteType === "business" 
                ? `Type "${selectedBusiness?.name}" to confirm deletion:`
                : 'Type "DELETE MY ACCOUNT" to confirm deletion:'
              }
            </p>
            
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder={deleteType === "business" ? selectedBusiness?.name : "DELETE MY ACCOUNT"}
              className="confirmation-input"
            />
            
            <div className="modal-buttons">
              <button 
                onClick={deleteType === "business" ? handleBusinessDelete : handleProfileDelete}
                disabled={loading}
                className="btn btn-danger"
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
              
              <button 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmation("");
                  setDeleteType("");
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Settings;