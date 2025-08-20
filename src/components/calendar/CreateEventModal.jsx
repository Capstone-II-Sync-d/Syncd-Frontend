import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../../AppContext";
import "./ModalStyles.css";
import axios from "axios";
import { API_URL } from "../../shared";
import { eventsAPI, calendarAPI } from "./utils/api";

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
  const { businesses, friends, user, socket } = useContext(AppContext);

  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    start: selectedDateTime
      ? roundToFiveMinutes(new Date(selectedDateTime.start))
          .toISOString()
          .slice(0, 16)
      : "",
    end: selectedDateTime
      ? roundToFiveMinutes(new Date(selectedDateTime.end))
          .toISOString()
          .slice(0, 16)
      : "",
    public: false,
    isEvent: false,
    postAs: "personal",
    invitedUsers: [],
    notifyAllFollowers: false,
    inviteAllFriends: false,
  });
  const [followers, setFollowers] = useState([]);

  useEffect(() => {
    const fetchFollowers = async (businessId) => {
      try {
        console.log(`Fetching followers for business ID: ${businessId}`);
        const response = await axios.get(
          `${API_URL}/api/profiles/business/${businessId}/followers`,
          { withCredentials: true }
        );
        const followerData = response.data
          .map((f) => f.user)
          .filter((user) => user && user.id && user.username);
        console.log("Fetched followers:", followerData);
        setFollowers(followerData);
      } catch (error) {
        console.error("Error fetching followers:", error);
        setFollowers([]);
      }
    };

    if (formData.postAs !== "personal" && formData.isEvent) {
      fetchFollowers(formData.postAs);
    } else {
      setFollowers([]);
    }
  }, [formData.postAs, formData.isEvent]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleInviteChange = (userId, checked) => {
    setFormData((prev) => {
      const invitedUsers = checked
        ? [...prev.invitedUsers, userId]
        : prev.invitedUsers.filter((id) => id !== userId);
      return { ...prev, invitedUsers };
    });
  };

  const handleNotifyAllFollowers = (checked) => {
    setFormData((prev) => ({
      ...prev,
      notifyAllFollowers: checked,
      invitedUsers: checked ? [] : prev.invitedUsers, // Clear specific invites if notifying all
    }));
  };

  const handleInviteAllFriends = (checked) => {
    setFormData((prev) => ({
      ...prev,
      inviteAllFriends: checked,
      invitedUsers: checked ? [] : prev.invitedUsers, // Clear specific invites if inviting all
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
    if (startDate < now && now - startDate > 5 * 60 * 1000) {
      // Allow 5 minute to be nice
      setFormError("Cannot create events in the past.");
      return false;
    }

    return true;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const startDate = new Date(formData.start);
    const endDate = new Date(formData.end);
    const roundedStart = roundToFiveMinutes(startDate);
    const roundedEnd = roundToFiveMinutes(endDate);

    const eventData = {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      start: roundedStart.toISOString(),
      end: roundedEnd.toISOString(),
      public: formData.public,
      businessId:
        formData.postAs !== "personal" ? Number(formData.postAs) : null,
      published: true,
    };

    try {
      const createdEvent = await eventsAPI.createEvent(eventData);

      if (formData.isEvent) {
        if (!socket) {
          setFormError("Cannot send invitations: No socket connection.");
          return;
        }

        // Determine invitees based on event type
        let invitees = [];
        const eventType =
          formData.postAs === "personal" ? "personal" : "business";

        if (eventType === "personal") {
          invitees = formData.inviteAllFriends
            ? friends.map((f) => f.user.id)
            : formData.invitedUsers;
        } else {
          invitees = formData.notifyAllFollowers
            ? followers.map((f) => f.id)
            : formData.invitedUsers;
        }

        if (invitees.length === 0) {
          setFormError("No invitees selected for the event.");
          return;
        }

        if (!createdEvent.id || !user.id || !user.username || !formData.title) {
          setFormError("Missing required event or user data.");
          return;
        }

        socket.emit(
          "event-invite",
          {
            eventId: createdEvent.id,
            invitees,
            inviterId: user.id,
            inviterName: user.username,
            eventTitle: formData.title,
            eventType, // Explicitly indicate personal or business event
            businessId:
              formData.postAs !== "personal" ? Number(formData.postAs) : null,
            startTime: formData.start, // Added for richer notifications
            location: formData.location, // Added for richer notifications
          },
          (response) => {
            if (response?.error) {
              console.error("Failed to send event invite:", response.error);
              setFormError(`Failed to send invitations: ${response.error}`);
            }
          }
        );
      }

      onCreate(createdEvent);
      onClose();
    } catch (error) {
      console.error("Error creating event:", error);
      setFormError(error.message || "Failed to create event.");
    }
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
                <small> Private reminder or personal task</small>
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
                <small> Others can discover and attend this event</small>
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
          {formData.isEvent && (
            <div className="form-group">
              <label className="form-section-title">Invite</label>
              {formData.postAs === "personal" ? (
                <>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.inviteAllFriends}
                      onChange={(e) => handleInviteAllFriends(e.target.checked)}
                    />
                    Invite all friends
                  </label>
                  {!formData.inviteAllFriends && (
                    <>
                      <p>Select friends to invite:</p>
                      {friends.length === 0 ? (
                        <p>No friends available to invite.</p>
                      ) : (
                        <div className="invite-list">
                          {friends.map((friend) => (
                            <label
                              key={friend.user.id}
                              className="checkbox-label"
                            >
                              <input
                                type="checkbox"
                                checked={formData.invitedUsers.includes(
                                  friend.user.id
                                )}
                                onChange={(e) =>
                                  handleInviteChange(
                                    friend.user.id,
                                    e.target.checked
                                  )
                                }
                              />
                              {friend.user.username} ({friend.user.firstName}{" "}
                              {friend.user.lastName})
                            </label>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.notifyAllFollowers}
                      onChange={(e) =>
                        handleNotifyAllFollowers(e.target.checked)
                      }
                    />
                    Notify all followers
                  </label>
                  {!formData.notifyAllFollowers && (
                    <>
                      <p>Select followers to invite:</p>
                      {followers.length === 0 ? (
                        <p>No followers available to invite.</p>
                      ) : (
                        <div className="invite-list">
                          {followers.map((follower, index) => (
                            <label
                              key={follower.id || `follower-${index}`}
                              className="checkbox-label"
                            >
                              <input
                                type="checkbox"
                                checked={formData.invitedUsers.includes(
                                  follower.id
                                )}
                                onChange={(e) =>
                                  handleInviteChange(
                                    follower.id,
                                    e.target.checked
                                  )
                                }
                              />
                              {follower.username} ({follower.firstName}{" "}
                              {follower.lastName})
                            </label>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Error Message */}
          {formError && (
            <div className="form-error-message">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{formError}</span>
            </div>
          )}

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
