import React, { useState } from "react";
import "./ModalStyles.css";

const CreateBusinessModal = ({ onClose, onCreate }) => {
  const [formError, setFormError] = useState("");
  // User feedback message states
  const [userMessage, setUserMessage] = useState("");
  const [userMessageType, setUserMessageType] = useState("error"); // error, success, warning
  const [showUserMessage, setShowUserMessage] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    category: "",
    pictureUrl: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear messages when user starts typing
    if (showUserMessage) {
      setShowUserMessage(false);
    }
  };

  const validateBusinessForm = () => {
    setFormError("");
    setShowUserMessage(false);

    if (!formData.name.trim()) {
      setUserMessage("Business name is required.");
      setUserMessageType("error");
      setShowUserMessage(true);
      return false;
    }

    if (!formData.email.trim()) {
      setUserMessage("Business email is required.");
      setUserMessageType("error");
      setShowUserMessage(true);
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setUserMessage("Please enter a valid email address.");
      setUserMessageType("error");
      setShowUserMessage(true);
      return false;
    }

    if (!formData.bio.trim()) {
      setUserMessage("Business description is required.");
      setUserMessageType("error");
      setShowUserMessage(true);
      return false;
    }

    if (formData.pictureUrl.trim() && !isValidUrl(formData.pictureUrl)) {
      setUserMessage("Please enter a valid URL for the business picture.");
      setUserMessageType("error");
      setShowUserMessage(true);
      return false;
    }

    return true;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateBusinessForm()) {
      return;
    }
    
    try {
      // Filter out empty pictureUrl
      const submitData = { ...formData };
      if (!submitData.pictureUrl.trim()) {
        delete submitData.pictureUrl;
      }
      
      await onCreate(submitData);
      
      // Show success message
      setUserMessage("Business created successfully!");
      setUserMessageType("success");
      setShowUserMessage(true);
      
      // Auto-close after showing success (optional)
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error("Failed to create business:", error);
      setUserMessage("Failed to create business. Please try again.");
      setUserMessageType("error");
      setShowUserMessage(true);
    }
  };

  const isFormValid = formData.name.trim() && formData.email.trim() && formData.bio.trim();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Business</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="event-form" noValidate>
          <div className="form-group">
            <label>Business Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter business name"
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter business email"
            />
          </div>

          <div className="form-group">
            <label>Bio *</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={3}
              placeholder="Describe your business"
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              placeholder="e.g., Restaurant, Technology, Retail"
            />
          </div>

          <div className="form-group">
            <label>Picture URL</label>
            <input
              type="url"
              name="pictureUrl"
              value={formData.pictureUrl}
              onChange={handleInputChange}
              placeholder="Optional URL for business profile picture"
            />
          </div>

          {/* Error Message */}
          {formError && (
            <div className="form-error-message">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{formError}</span>
            </div>
          )}

          {/* User Message */}
          {showUserMessage && (
            <div className="form-error-message">
              <span className="error-icon">
                {userMessageType === 'success' ? '✅' : userMessageType === 'warning' ? '⚠️' : '⚠️'}
              </span>
              <span className="error-text">{userMessage}</span>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Business
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBusinessModal;