import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../../shared";
import "../Cards/styling/EventCardStyles.css";

const EventCard = ({ event }) => {
  const [userMessage, setUserMessage] = useState("");
  const [userMessageType, setUserMessageType] = useState("error");
  const [showUserMessage, setShowUserMessage] = useState(false);

  if (!event) return null;

  const start = new Date(event.startTime);
  const startDate = start.toLocaleDateString();
  let startHour = start.getHours();
  if (startHour > 12) startHour -= 12;
  const startTime = `${startHour}:${start
    .getMinutes()
    .toString()
    .padStart(2, "0")} ${start.getHours() > 11 ? "pm" : "am"}`;

  const end = new Date(event.endTime);
  let endHour = end.getHours();
  if (endHour > 12) endHour -= 12;
  const endDate = end.toLocaleDateString();
  const endTime = `${endHour}:${end.getMinutes().toString().padStart(2, "0")} ${
    end.getHours() > 11 ? "pm" : "am"
  }`;

  // Helper function to show popup message
  const showUserMessagePopup = (message, type = "error") => {
    setUserMessage(message);
    setUserMessageType(type);
    setShowUserMessage(true);
    setTimeout(() => setShowUserMessage(false), 5000);
  };

  const handleAddEvent = async () => {
    try {
      let response;
      if (event.business) {
        // Business event: Use /business/attending endpoint
        const payload = {
          sourceEventId: Number(event.calendarItemId),
        };
        response = await axios.post(
          `${API_URL}/api/calendarItems/business/attending`,
          payload,
          { withCredentials: true }
        );
      }
      showUserMessagePopup(
        "Event successfully added to your calendar!",
        "success"
      );
    } catch (err) {
      console.error("Error adding event to calendar:", err);
      showUserMessagePopup(
        err.response?.data?.error || "Failed to add event. Please try again.",
        "error"
      );
    }
  };

  return (
    <div className="event-card">
      {showUserMessage && (
        <div className={`user-message-popup ${userMessageType}`}>
          <div className="message-content">
            <span className="message-text">{userMessage}</span>
            <button
              className="message-close"
              onClick={() => setShowUserMessage(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}
      <h3 className="event-title">{event.title}</h3>
      <p className="description">{event.description}</p>
      <p className="hostname">
        <strong>Hosted By: </strong>
        {event.business ? event.business : event.creatorUsername}
      </p>
      {event.location && (
        <p className="location">
          <strong>Location: </strong>
          {event.location}
        </p>
      )}
      {startDate === endDate ? (
        <div className="date">
          <p>
            <strong>Date:</strong> {startDate}
          </p>
          <p>
            <strong>From:</strong> {startTime}
          </p>
          <p>
            <strong>To:</strong> {endTime}
          </p>
        </div>
      ) : (
        <div className="date">
          <p>
            <strong>Date:</strong> {startDate}
          </p>
          <p>
            <strong>From:</strong> {startTime}
          </p>
          <p>
            <strong>To:</strong> {endTime}
          </p>
        </div>
      )}
      <button className="event-btn add-event-btn" onClick={handleAddEvent}>
        Add to Calendar
      </button>
    </div>
  );
};

export default EventCard;
