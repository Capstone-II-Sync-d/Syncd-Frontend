import React, { useState, useContext } from "react";
import { AppContext } from "../../AppContext";
import "./ModalStyles.css";

const roundToFiveMinutes = (date) => {
  const rounded = new Date(date);
  const minutes = rounded.getMinutes();
  const remainder = minutes % 5;

  if (remainder !== 0) {
    rounded.setMinutes(minutes - remainder);
  }

  rounded.setSeconds(0);
  rounded.setMilliseconds(0);
  return rounded;

};

const CreateEventModal = ({ selectedDateTime, onClose, onCreate }) => {
  const { businesses } = useContext(AppContext);

  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    start: selectedDateTime
      ? roundToFiveMinutes(new Date(selectedDateTime.start)).toISOString().slice(0, 16)
      : "",
    end: selectedDateTime
      ? roundToFiveMinutes(new Date(selectedDateTime.end)).toISOString().slice(0, 16)
      : "",
    public: false,
    isEvent: false,
    postAs: "personal",
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
   

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    // Clear previous errors
    setFormError("");

    const startDate = new Date(formData.start);
    const endDate = new Date(formData.end);

    // Required field checks
    if (!formData.title.trim()) {
      setFormError("Event title is required.");
      return false;
    }

    if (formData.isEvent && !formData.description.trim()) {
      setFormError("Event description is required for public events.");
      return false;
    }

    if (formData.isEvent && !formData.location.trim()) {
      setFormError("Event location is required for public events.");
      return false;
    }

    // Date validation
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setFormError("Please enter valid start and end times.");
      return false;
    }

    if (endDate <= startDate) {
      setFormError("End time must be after start time.");
      return false;
    }

    // Check if event is in the past
    const now = new Date();
    if (startDate < now && (now - startDate) > 5 * 60 * 1000) { // Allow 5 minute to be nice
      setFormError("Cannot create events in the past.");
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const startDate = new Date(formData.start);
    const endDate = new Date(formData.end);
    const roundedStart = roundToFiveMinutes(startDate);
    const roundedEnd = roundToFiveMinutes(endDate);
     
     onCreate({
      ...formData,
      start: roundedStart.toISOString(),
      end: roundedEnd.toISOString(),
      published: true, // Regular submit publishes event
    });
  };

  const handleSaveAsDraft = () => {
    // For drafts, we only need title and valid dates
    setFormError("");

    const startDate = new Date(formData.start);
    const endDate = new Date(formData.end);
    
    if (!formData.title.trim()) {
      setFormError("Event title is required.");
      return;
    }
 
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setFormError("Please enter valid start and end times.");
      return;
    }

    if (endDate <= startDate) {
      setFormError("End time must be after start time.");
      return;
    }
    
    const roundedStart = roundToFiveMinutes(startDate);
    const roundedEnd = roundToFiveMinutes(endDate);
    
    onCreate({
      ...formData,
      start: roundedStart.toISOString(),
      end: roundedEnd.toISOString(),
      published: false,
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
          {/* Error Message */}
          {formError && (
            <div className="form-error-message">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{formError}</span>
            </div>
          )}

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
                <small>   Private reminder or personal task</small>
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
                <small>   Others can discover and attend this event</small>
              </label>
            </div>
          </div>
          {formData.isEvent && (
            <div className="form-group">
              <label className="form-section-title">Post as</label>
              <select
                name="postAs"
                value={formData.postAs}
                onChange={handleInputChange}
              >
                <option value="personal">Personal</option>
                {businesses.map((biz) => (
                  <option key={biz.id} value={biz.id}>
                    {biz.name}
                  </option>
                ))}
              </select>
            </div>
          )}
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
               
                step="300"
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
                
                step="300"
                required
              />
            </div>
          </div>

          <div className="time-info-message">
            <span className="info-icon">ℹ️</span>
            <span className="info-text">
              Times are automatically rounded to the nearest 5-minute interval.
            </span>
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
                  onClick={handleSaveAsDraft}
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
