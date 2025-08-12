import React, { useState } from "react";
import "./ModalStyles.css";

const CreateEventModal = ({ selectedDateTime, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    start: selectedDateTime
      ? new Date(selectedDateTime.start).toISOString().slice(0, 16)
      : "",
    end: selectedDateTime
      ? new Date(selectedDateTime.end).toISOString().slice(0, 16)
      : "",
    public: false,
    isEvent: false,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      ...formData,
      start: new Date(formData.start).toISOString(),
      end: new Date(formData.end).toISOString(),
      published: true, // Regular submit publishes event
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New {formData.isEvent ? "Event" : "Calendar Item"}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="event-form">
          {/* Event Type Selection */}
          <div className="form-group">
            <label className="form-section-title">What are you creating?</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="isEvent"
                  checked={!formData.isEvent}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, isEvent: false }))
                  }
                />
                <span>Personal Calendar Item</span>
                <small>Private reminder or personal task</small>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="isEvent"
                  checked={formData.isEvent}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, isEvent: true }))
                  }
                />
                <span>Public Event</span>
                <small>Others can discover and attend this event</small>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder={
                formData.isEvent ? "Event title" : "Calendar item title"
              }
            />
          </div>

          <div className="form-group">
            <label>Description {formData.isEvent ? "*" : ""}</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required={formData.isEvent}
              rows={3}
              placeholder={
                formData.isEvent
                  ? "Event description (required for events)"
                  : "Optional description"
              }
            />
          </div>

          <div className="form-group">
            <label>Location {formData.isEvent ? "*" : ""}</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required={formData.isEvent}
              placeholder={
                formData.isEvent
                  ? "Event location (required for events)"
                  : "Optional location"
              }
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date & Time *</label>
              <input
                type="datetime-local"
                name="start"
                value={formData.start}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>End Date & Time *</label>
              <input
                type="datetime-local"
                name="end"
                value={formData.end}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="form-group">
            <label className="form-section-title">
              {formData.isEvent ? "Event Privacy" : "Calendar Item Privacy"}
            </label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="public"
                  checked={!formData.public}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, public: false }))
                  }
                />
                <span>
                  {formData.isEvent
                    ? "Private (Invite Only)"
                    : "Private (Only You)"}
                </span>
                <small>
                  {formData.isEvent
                    ? "Only invited people can see and attend this event"
                    : "Only you can see this calendar item"}
                </small>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="public"
                  checked={formData.public}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, public: true }))
                  }
                />
                <span>
                  {formData.isEvent
                    ? "Public (Everyone)"
                    : "Public (Friends Can View)"}
                </span>
                <small>
                  {formData.isEvent
                    ? "Anyone can discover and attend this event"
                    : "Your friends can see this calendar item"}
                </small>
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            {formData.isEvent ? (
              <>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    onCreate({
                      ...formData,
                      start: new Date(formData.start).toISOString(),
                      end: new Date(formData.end).toISOString(),
                      published: false, // Save as draft
                    });
                  }}
                >
                  Save as Draft
                </button>
                <button type="submit" className="btn-primary">
                  Publish Event
                </button>
              </>
            ) : (
              <button type="submit" className="btn-primary">
                Create Calendar Item
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;
