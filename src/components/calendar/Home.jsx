import React, { useState, useEffect, useRef } from "react";
import Calendar from "@toast-ui/react-calendar";
import "@toast-ui/calendar/dist/toastui-calendar.min.css";
import "./HomeStyles.css";

// Import utilities and components
import { authAPI, calendarAPI, eventsAPI } from "./utils/api";
import {
  determineCalendarId,
  transformCalendarData,
  getEventStats,
  formatCurrentDate,
  getCalendarOptions,
} from "./utils/calendarUtils";
import CreateEventModal from "./CreateEventModal";
import EventDetailModal from "./EventDetailModal";

const Home = () => {
  // State management
  const [user, setUser] = useState(null);
  const [calendarItems, setCalendarItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calendar visibility toggles
  const [calendarVisibility, setCalendarVisibility] = useState({
    personal: true,
    business: true,
    events: true,
    drafts: true,
  });

  // Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDateTime, setSelectedDateTime] = useState(null);

  // TOAST UI Calendar ref
  const calendarRef = useRef(null);

  // Fetch current user
  const fetchUser = async () => {
    try {
      const userData = await authAPI.getMe();
      setUser(userData.user);
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  // Fetch calendar items from API
  const fetchCalendarItems = async () => {
    try {
      const items = await calendarAPI.getMyItems();
      console.log("Fetched calendar items:", items);
      setCalendarItems(items);
      transformAndSetEvents(items);
    } catch (err) {
      setError("Error loading calendar data");
      console.error("Error fetching calendar items:", err);
    } finally {
      setLoading(false);
    }
  };

  // Transform and set events
  const transformAndSetEvents = (items) => {
    const transformedEvents = transformCalendarData(items, calendarVisibility);
    setEvents(transformedEvents);
  };

  // Handle calendar visibility toggle
  const handleCalendarToggle = (calendarType) => {
    const newVisibility = {
      ...calendarVisibility,
      [calendarType]: !calendarVisibility[calendarType],
    };
    setCalendarVisibility(newVisibility);

    // Update TOAST UI calendar visibility
    if (calendarRef.current) {
      const calendar = calendarRef.current.getInstance();
      calendar.setCalendarVisibility(calendarType, newVisibility[calendarType]);
    }
  };

  // Handle view change
  const handleViewChange = (view) => {
    setCurrentView(view);
    if (calendarRef.current) {
      const calendar = calendarRef.current.getInstance();
      calendar.changeView(view);
    }
  };

  // Navigate to today
  const handleTodayClick = () => {
    setCurrentDate(new Date());
    if (calendarRef.current) {
      const calendar = calendarRef.current.getInstance();
      calendar.today();
    }
  };

  // Navigate calendar
  const handleNavigation = (direction) => {
    if (calendarRef.current) {
      const calendar = calendarRef.current.getInstance();
      if (direction === "prev") {
        calendar.prev();
      } else {
        calendar.next();
      }
      setCurrentDate(calendar.getDate().toDate());
    }
  };

  // Handle event click
  const handleEventClick = (eventInfo) => {
    console.log("Event clicked:", eventInfo);
    const originalEvent = calendarItems.find(
      (item) => item.id.toString() === eventInfo.event.id
    );
    setSelectedEvent(originalEvent);
    setShowEventModal(true);
  };

  // Handle date selection for creating new events
  const handleSelectDateTime = (selectionInfo) => {
    console.log("Date/time selected:", selectionInfo);
    setSelectedDateTime({
      start: selectionInfo.start,
      end: selectionInfo.end,
    });
    setShowCreateModal(true);
  };

  // Create new calendar item/event
  const handleCreateEvent = async (eventData) => {
    console.log("Creating event with data:", eventData);
    try {
      // Step 1: Create the calendar item first
      const newCalendarItem = await calendarAPI.createItem({
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        start: eventData.start,
        end: eventData.end,
        public: eventData.isEvent ? true : eventData.public,
      });

      console.log("Created calendar item:", newCalendarItem);

      // Step 2: If this should be an Event, create the Event record
      if (eventData.isEvent) {
        const eventRecord = await eventsAPI.createEvent({
          itemId: newCalendarItem.id,
          businessId: null,
          published: eventData.published !== undefined ? eventData.published : false,
        });
        console.log("Created event record:", eventRecord);
      }

      // Step 3: Refresh calendar data
      await fetchCalendarItems();
      setShowCreateModal(false);
      setSelectedDateTime(null);
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  // Handle create events button click
  const handleCreateEventsClick = () => {
    setSelectedDateTime({
      start: new Date(),
      end: new Date(Date.now() + 60 * 60 * 1000),
    });
    setShowCreateModal(true);
  };

  // Get calendar options
  const calendarOptions = getCalendarOptions();

  // Initialize data on component mount
  useEffect(() => {
    fetchUser();
    fetchCalendarItems();
  }, []);

  // Force month view on mount
  useEffect(() => {
    if (calendarRef.current) {
      const calendar = calendarRef.current.getInstance();
      calendar.changeView("month");
    }
  }, []);

  // Update calendar events when data or visibility changes
  useEffect(() => {
    if (calendarRef.current && events.length > 0) {
      const calendar = calendarRef.current.getInstance();
      calendar.clear();
      calendar.createEvents(events);

      // Apply visibility settings
      Object.keys(calendarVisibility).forEach((calendarType) => {
        calendar.setCalendarVisibility(
          calendarType,
          calendarVisibility[calendarType]
        );
      });
    }
  }, [events, calendarVisibility]);

  // Update events when visibility changes
  useEffect(() => {
    if (calendarItems.length > 0) {
      transformAndSetEvents(calendarItems);
    }
  }, [calendarVisibility]);

  const stats = getEventStats(calendarItems, calendarVisibility);

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading">Loading your calendar...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Sidebar */}
      <div className="sidebar">
        {/* Create Events Button */}
        <button className="create-events-btn" onClick={handleCreateEventsClick}>
          <span className="plus-icon">+</span>
          Create Event
        </button>

        {/* My Network Section */}
        <div className="network-section">
          <div className="network-header">
            <span className="network-icon">👥</span>
            <span className="network-title">My Network</span>
          </div>
          <div className="network-stats">
            <span>3 Friends • 1 Businesses</span>
            <br />
            <span>Following 3</span>
          </div>
        </div>

        {/* My Calendars Section */}
        <div className="calendars-section">
          <h3 className="calendars-title">MY CALENDARS</h3>

          <div className="calendar-item">
            <label className="calendar-checkbox">
              <input
                type="checkbox"
                checked={calendarVisibility.personal}
                onChange={() => handleCalendarToggle("personal")}
              />
              <span className="checkmark personal"></span>
              <span className="calendar-name">Personal</span>
            </label>
            <span className="event-count">
              {
                calendarItems.filter(
                  (item) => determineCalendarId(item) === "personal"
                ).length
              }
            </span>
          </div>

          <div className="calendar-item">
            <label className="calendar-checkbox">
              <input
                type="checkbox"
                checked={calendarVisibility.business}
                onChange={() => handleCalendarToggle("business")}
              />
              <span className="checkmark business"></span>
              <span className="calendar-name">Business</span>
            </label>
            <span className="event-count">
              {
                calendarItems.filter(
                  (item) => determineCalendarId(item) === "business"
                ).length
              }
            </span>
          </div>

          <div className="calendar-item">
            <label className="calendar-checkbox">
              <input
                type="checkbox"
                checked={calendarVisibility.events}
                onChange={() => handleCalendarToggle("events")}
              />
              <span className="checkmark events"></span>
              <span className="calendar-name">Events</span>
            </label>
            <span className="event-count">
              {
                calendarItems.filter(
                  (item) => determineCalendarId(item) === "events"
                ).length
              }
            </span>
          </div>

          <div className="calendar-item">
            <label className="calendar-checkbox">
              <input
                type="checkbox"
                checked={calendarVisibility.drafts}
                onChange={() => handleCalendarToggle("drafts")}
              />
              <span className="checkmark drafts"></span>
              <span className="calendar-name">Drafts</span>
            </label>
            <span className="event-count">
              {
                calendarItems.filter(
                  (item) => determineCalendarId(item) === "drafts"
                ).length
              }
            </span>
          </div>
        </div>

        {/* Event Statistics */}
        <div className="stats-section">
          <div className="stat-card total">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">TOTAL EVENTS</div>
          </div>

          <div className="stat-card today">
            <div className="stat-number">{stats.today}</div>
            <div className="stat-label">TODAY</div>
          </div>
        </div>
      </div>

      {/* Main Calendar Area */}
      <div className="main-content">
        {/* Welcome Header */}
        <div className="welcome-header">
          <h1>Welcome back, {user?.firstName || "User"}!</h1>
        </div>

        {/* Calendar Controls */}
        <div className="calendar-controls">
          <div className="date-navigation">
            <button
              className="nav-btn"
              onClick={() => handleNavigation("prev")}
            >
              ‹
            </button>
            <h2 className="current-date">{formatCurrentDate(currentDate)}</h2>
            <button
              className="nav-btn"
              onClick={() => handleNavigation("next")}
            >
              ›
            </button>
          </div>

          <div className="view-controls">
            <button className="today-btn" onClick={handleTodayClick}>
              Today
            </button>

            <div className="view-buttons">
              <button
                className={`view-btn ${
                  currentView === "month" ? "active" : ""
                }`}
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

        {/* TOAST UI Calendar */}
        <div className="calendar-wrapper">
          <Calendar
            ref={calendarRef}
            height="600px"
            events={events}
            {...calendarOptions}
            onClickEvent={handleEventClick}
            onSelectDateTime={handleSelectDateTime}
          />
        </div>
      </div>

      {/* Event Detail Modal */}
      {showEventModal && selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => {
            setShowEventModal(false);
            setSelectedEvent(null);
          }}
          onRefresh={fetchCalendarItems}
        />
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          selectedDateTime={selectedDateTime}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedDateTime(null);
          }}
          onCreate={handleCreateEvent}
        />
      )}
    </div>
  );
};

export default Home;