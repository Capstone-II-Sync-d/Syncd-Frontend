import React, { useState } from "react";
import "./ModalStyles.css";

const CreateBusinessModal = ({ onClose, onCreate }) => {
  const [formError, setFormError] = useState("");
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
  };

  const validateBusinessForm = () => {
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Business name is required.");
      return false;
    }

    if (!formData.email.trim()) {
      setFormError("Business email is required.");
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError("Please enter a valid email address.");
      return false;
    }

    if (!formData.bio.trim()) {
      setFormError("Business description is required.");
      return false;
    }

    if (formData.pictureUrl.trim() && !isValidUrl(formData.pictureUrl)) {
      setFormError("Please enter a valid URL for the business picture.");
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateBusinessForm()) {
      return;
    }
    
    // Filter out empty pictureUrl
    const submitData = { ...formData };
    if (!submitData.pictureUrl.trim()) {
      delete submitData.pictureUrl;
    }
    
    onCreate(submitData);
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

        <form onSubmit={handleSubmit} className="event-form">
          {/* Error Message */}
          {formError && (
            <div className="form-error-message">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{formError}</span>
            </div>
          )}

          <div className="form-group">
            <label>Business Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
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
              required
              placeholder="Enter business email"
            />
          </div>

          <div className="form-group">
            <label>Bio *</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              required
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

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!isFormValid}>
              Create Business
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBusinessModal;