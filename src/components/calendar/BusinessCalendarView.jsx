import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Calendar from "@toast-ui/react-calendar";
import "@toast-ui/calendar/dist/toastui-calendar.min.css";
import axios from "axios";
import { API_URL } from "../../shared";
import {
  transformCalendarData,
  formatCurrentDate,
  getCalendarOptions,
} from "./utils/calendarUtils";

const BusinessCalendarView = () => {
  const { businessId } = useParams();
  const nav = useNavigate();

  const [calendarItems, setCalendarItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);

  // User feedback message states
  const [userMessage, setUserMessage] = useState("");
  const [userMessageType, setUserMessageType] = useState("error"); // error, success, warning
  const [showUserMessage, setShowUserMessage] = useState(false);

  const calendarRef = useRef(null);

  // Fetch public calendar items (personal and events) for the user
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/calendarItems/business/${businessId}/public`,
          {
            withCredentials: true,
          }
        );
        console.log("CalendarItems", response.data);
        setCalendarItems(response.data || []);
        setEvents(
          transformCalendarData(response.data || [], {
            personal: false,
            business: true,
            events: true,
            drafts: false,
          })
        );
      } catch (err) {
        setError(err.response?.data?.error || "Error loading calendar data");
        console.error("Error fetching user calendar items:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [businessId]);

  const handleViewChange = (view) => {
    setCurrentView(view);
    if (calendarRef.current) {
      calendarRef.current.getInstance().changeView(view);
    }
  };

  const handleTodayClick = () => {
    setCurrentDate(new Date());
    if (calendarRef.current) {
      calendarRef.current.getInstance().today();
    }
  };

  // Helper function to show popup
  const showUserMessagePopup = (message, type = "error") => {
    setUserMessage(message);
    setUserMessageType(type);
    setShowUserMessage(true);
    setTimeout(() => setShowUserMessage(false), 5000); // auto hide after 5s
  };

  const handleNavigation = (direction) => {
    if (!calendarRef.current) return;
    const calendar = calendarRef.current.getInstance();
    if (direction === "prev") calendar.prev();
    else calendar.next();
    setCurrentDate(calendar.getDate().toDate());
  };

  const handleEventClick = (event) => {
    console.log("Event clicked:", event);
    if (event?.event) {
      setSelectedEvent(event.event);
    } else {
      console.warn("No valid event data found");
    }
  };

  const handleAddEvent = async () => {
    if (!selectedEvent) return;
    console.log("Adding event:", selectedEvent);

    console.log("This is the selected Event", selectedEvent);
    const payload = {
      sourceEventId: Number(selectedEvent.id),
    };
    try {
      await axios.post(
        `${API_URL}/api/calendarItems/business/attending`,
        payload,
        {
          withCredentials: true,
        }
      );
      showUserMessagePopup(
        "Event successfully added to your calendar!",
        "success"
      );
      setSelectedEvent(null);
    } catch (err) {
      console.error("Error adding event to calendar:", err);
      showUserMessagePopup("Failed to add event. Please try again.", "error");
    }
  };

  const closePopup = () => {
    setSelectedEvent(null);
  };

  const calendarOptions = {
    ...getCalendarOptions(),
    usageStatistics: false,
    isReadOnly: true,
  };

  if (loading) return <div>Loading calendar...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="calendar-view-container">
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

      <button
        className="back-btn"
        onClick={() => {
          nav("/main");
        }}
      >
        Back to Calendar
      </button>
      <div className="calendar-controls">
        <div className="date-navigation">
          <button className="nav-btn" onClick={() => handleNavigation("prev")}>
            ‹
          </button>
          <h2 className="current-date">{formatCurrentDate(currentDate)}</h2>
          <button className="nav-btn" onClick={() => handleNavigation("next")}>
            ›
          </button>
        </div>
        <div className="view-controls">
          <button className="today-btn" onClick={handleTodayClick}>
            Today
          </button>
          <div className="view-buttons">
            <button
              className={`view-btn ${currentView === "month" ? "active" : ""}`}
              onClick={() => handleViewChange("month")}
            >
              Month
            </button>
            <button
              className={`view-btn ${currentView === "week" ? "active" : ""}`}
              onClick={() => handleViewChange("week")}
            >
              Week
            </button>
            <button
              className={`view-btn ${currentView === "day" ? "active" : ""}`}
              onClick={() => handleViewChange("day")}
            >
              Day
            </button>
          </div>
        </div>
      </div>
      <div className="calendar-wrapper">
        <Calendar
          ref={calendarRef}
          height="600px"
          events={events}
          {...calendarOptions}
          view={currentView}
          onClickEvent={handleEventClick}
        />
      </div>
      {selectedEvent && (
        <div className="event-popup">
          <div className="event-popup-content">
            <h3>{selectedEvent.title}</h3>
            <p>
              <strong>Start:</strong>{" "}
              {new Date(selectedEvent.start).toLocaleString()}
            </p>
            <p>
              <strong>End:</strong>{" "}
              {new Date(selectedEvent.end).toLocaleString()}
            </p>
            <p>
              <strong>Details:</strong> {selectedEvent.body}
            </p>
            <p>
              <strong>All Day:</strong> {selectedEvent.isAllDay ? "Yes" : "No"}
            </p>
            <p>
              <strong>Type:</strong> {selectedEvent.calendarId}
            </p>
            <div className="popup-buttons">
              <button onClick={handleAddEvent} className="add-event-btn">
                Add to My Calendar
              </button>
              <button onClick={closePopup} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessCalendarView;
