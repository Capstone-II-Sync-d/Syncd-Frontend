import React, { useState } from "react";
import { eventsAPI, calendarAPI } from "./utils/api";
import "./ModalStyles.css";

const EventDetailModal = ({ event, onClose, onRefresh }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: event.title || "",
    description: event.description || "",
    location: event.location || "",
    start: new Date(event.start).toISOString().slice(0, 16),
    end: new Date(event.end).toISOString().slice(0, 16),
    public: event.public || false,
  });

  // Determine if this is an event (has event record)
  const isEvent = event.event !== undefined && event.event !== null;
  const isPublished = isEvent && event.event?.published;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await calendarAPI.updateItem(event.id, {
        ...formData,
        start: new Date(formData.start).toISOString(),
        end: new Date(formData.end).toISOString(),
      });

      await onRefresh();
      onClose();
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await calendarAPI.deleteItem(event.id);
        await onRefresh();
        onClose();
      } catch (error) {
        console.error("Error deleting event:", error);
      }
    }
  };

  const handlePublishToggle = async () => {
    try {
      await eventsAPI.updateEvent(event.event.id, {
        published: !isPublished,
      });

      await onRefresh();
      onClose();
    } catch (error) {
      console.error("Error toggling publish status:", error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{isEditing ? "Edit Event" : "Event Details"}</h2>
            {isEvent && (
              <span
                className={`status-badge ${
                  isPublished ? "published" : "draft"
                }`}
              >
                {isPublished ? "🌐 Published" : "📝 Draft"}
              </span>
            )}
          </div>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="event-form">
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
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
                {isEvent ? "Event Privacy" : "Calendar Item Privacy"}
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
                    {isEvent ? "Private (Invite Only)" : "Private (Only You)"}
                  </span>
                  <small>
                    {isEvent
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
                    {isEvent
                      ? "Public (Everyone)"
                      : "Public (Friends Can View)"}
                  </span>
                  <small>
                    {isEvent
                      ? "Anyone can discover and attend this event"
                      : "Your friends can see this calendar item"}
                  </small>
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="event-details">
            <div className="detail-item">
              <strong>Title:</strong>
              <span>{event.title}</span>
            </div>

            {event.description && (
              <div className="detail-item">
                <strong>Description:</strong>
                <span>{event.description}</span>
              </div>
            )}

            {event.location && (
              <div className="detail-item">
                <strong>Location:</strong>
                <span>{event.location}</span>
              </div>
            )}

            <div className="detail-item">
              <strong>Start:</strong>
              <span>{new Date(event.start).toLocaleString()}</span>
            </div>

            <div className="detail-item">
              <strong>End:</strong>
              <span>{new Date(event.end).toLocaleString()}</span>
            </div>

            <div className="detail-item">
              <strong>Privacy:</strong>
              <span>
                {isEvent
                  ? event.public
                    ? "Public (Everyone can see)"
                    : "Private (Invite only)"
                  : event.public
                  ? "Public (Friends can see)"
                  : "Private (Only you)"}
              </span>
            </div>

            <div className="modal-actions">
              <button onClick={handleDelete} className="btn-danger">
                Delete {isEvent ? "Event" : "Item"}
              </button>
              {isEvent && (
                <button onClick={handlePublishToggle} className="btn-secondary">
                  {isPublished ? "Unpublish" : "Publish"} Event
                </button>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary"
              >
                Edit {isEvent ? "Event" : "Item"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetailModal;
