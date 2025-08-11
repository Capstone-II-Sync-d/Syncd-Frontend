import React, { useState, useEffect, useRef } from "react";
import Calendar from "@toast-ui/react-calendar";
import "@toast-ui/calendar/dist/toastui-calendar.min.css";
import "./HomeStyles.css";

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
      const response = await fetch("http://localhost:8080/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  // Fetch calendar items from API
  const fetchCalendarItems = async () => {
    try {
      const response = await fetch(
        "http://localhost:8080/api/calendarItems/me",
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const items = await response.json();
        setCalendarItems(items);
        transformCalendarData(items);
      } else {
        setError("Failed to fetch calendar items");
      }
    } catch (err) {
      setError("Error loading calendar data");
      console.error("Error fetching calendar items:", err);
    } finally {
      setLoading(false);
    }
  };

  // Transform calendar items to TOAST UI format
  const transformCalendarData = (items) => {
    console.log("Raw calendar items:", items); // Debug log

    const transformedEvents = items.map((item) => {
      const calendarId = determineCalendarId(item);
      console.log(
        `Item ${item.id}: calendarId = ${calendarId}, event =`,
        item.event
      ); // Debug log

      return {
        id: item.id.toString(),
        calendarId: calendarId,
        title: item.title,
        body: item.description || "",
        start: new Date(item.start),
        end: new Date(item.end),
        location: item.location || "",
        isAllday: isAllDayEvent(item.start, item.end),
        category: "time",
        isVisible: calendarVisibility[calendarId], // Use current visibility setting
        backgroundColor: getEventColor(item),
        borderColor: getEventColor(item),
        raw: item, // Store original data for reference
      };
    });

    setEvents(transformedEvents);
  };

  // Determine calendar category for event
  const determineCalendarId = (item) => {
    // Check if this item has an associated event
    if (item.event) {
      // If the event is not published, it's a draft
      if (!item.event.published) {
        return "drafts";
      }
      // If the event has a businessId, it's a business event
      if (item.event.businessId) {
        return "business";
      }
      // If the event has no businessId, it's a user-created event
      return "events";
    }
    // If no event record, it's a personal calendar item
    return "personal";
  };

  // Check if event spans full day
  const isAllDayEvent = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const timeDiff = endDate - startDate;
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    return hoursDiff >= 24;
  };

  // Determine if event should be visible based on current filters
  const shouldEventBeVisible = (item) => {
    const calendarId = determineCalendarId(item);

    // Check privacy for personal items
    if (calendarId === "personal" && !item.public) {
      return calendarVisibility.personal;
    }

    return calendarVisibility[calendarId];
  };

  // Get event color based on type
  const getEventColor = (item) => {
    const calendarId = determineCalendarId(item);

    switch (calendarId) {
      case "personal":
        return "#8b5cf6"; // Purple
      case "business":
        return "#3b82f6"; // Blue
      case "events":
        return "#ec4899"; // Pink
      case "drafts":
        return "#6b7280"; // Gray
      default:
        return "#6b7280"; // Gray
    }
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

  // Format current date for display
  const formatCurrentDate = () => {
    return currentDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  // Calculate event statistics
  const getEventStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEvents = calendarItems.filter((item) => {
      const eventDate = new Date(item.start);
      eventDate.setHours(0, 0, 0, 0);
      return (
        eventDate.getTime() === today.getTime() && shouldEventBeVisible(item)
      );
    });

    const totalVisibleEvents = calendarItems.filter(shouldEventBeVisible);

    return {
      total: totalVisibleEvents.length,
      today: todayEvents.length,
    };
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

  // Create new calendar item
  const handleCreateEvent = async (eventData) => {
    try {
      // Step 1: Create the calendar item first
      const response = await fetch(
        "http://localhost:8080/api/calendarItems/user/item",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            title: eventData.title,
            description: eventData.description,
            location: eventData.location,
            start: eventData.start,
            end: eventData.end,
            public: eventData.isEvent ? true : eventData.public, // Events are always public
          }),
        }
      );

      if (response.ok) {
        const newCalendarItem = await response.json();

        // Step 2: If this should be an Event, create the Event record
        if (eventData.isEvent) {
          const eventResponse = await fetch(
            "http://localhost:8080/api/calendarItems/events",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                itemId: newCalendarItem.id,
                businessId: null,
                published: eventData.published || false,
              }),
            }
          );

          if (!eventResponse.ok) {
            console.error("Failed to create event record");
          }
        }

        // Refresh calendar data
        await fetchCalendarItems();
        setShowCreateModal(false);
        setSelectedDateTime(null);
      } else {
        console.error("Failed to create calendar item");
      }
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  // Update calendar item
  const handleUpdateEvent = async (eventId, eventData) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/calendarItems/user/item/${eventId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(eventData),
        }
      );

      if (response.ok) {
        // Refresh calendar data
        await fetchCalendarItems();
        setShowEventModal(false);
        setSelectedEvent(null);
      } else {
        console.error("Failed to update event");
      }
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  // Delete calendar item
  const handleDeleteEvent = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        const response = await fetch(
          `http://localhost:8080/api/calendarItems/user/item/${eventId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        if (response.ok) {
          // Refresh calendar data
          await fetchCalendarItems();
          setShowEventModal(false);
          setSelectedEvent(null);
        } else {
          console.error("Failed to delete event");
        }
      } catch (error) {
        console.error("Error deleting event:", error);
      }
    }
  };

  // Handle create events button click
  const handleCreateEventsClick = () => {
    setSelectedDateTime({
      start: new Date(),
      end: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
    });
    setShowCreateModal(true);
  };

  // Calendar options for TOAST UI
  const calendarOptions = {
    defaultView: "month",
    useFormPopup: false,
    useDetailPopup: false,
    calendars: [
      {
        id: "personal",
        name: "Personal",
        backgroundColor: "#8b5cf6",
        borderColor: "#8b5cf6",
        dragBackgroundColor: "#8b5cf6",
      },
      {
        id: "business",
        name: "Business",
        backgroundColor: "#3b82f6",
        borderColor: "#3b82f6",
        dragBackgroundColor: "#3b82f6",
      },
      {
        id: "events",
        name: "Events",
        backgroundColor: "#ec4899",
        borderColor: "#ec4899",
        dragBackgroundColor: "#ec4899",
      },
      {
        id: "drafts",
        name: "Drafts",
        backgroundColor: "#6b7280",
        borderColor: "#6b7280",
        dragBackgroundColor: "#6b7280",
      },
    ],
    week: {
      startDayOfWeek: 0,
      dayNames: ["S", "M", "T", "W", "T", "F", "S"],
      hourStart: 0,
      hourEnd: 24,
    },
    month: {
      startDayOfWeek: 0,
      dayNames: ["S", "M", "T", "W", "T", "F", "S"],
    },
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchUser();
    fetchCalendarItems();
  }, []);

  useEffect(() => {
    if (calendarRef.current) {
      const calendar = calendarRef.current.getInstance();
      calendar.changeView("month"); // Force month view on mount
    }
  }, []); // Run once when component mounts

  // Update calendar events when data changes
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

  const stats = getEventStats();

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
          Create Events
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
            <h2 className="current-date">{formatCurrentDate()}</h2>
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
          onUpdate={handleUpdateEvent}
          onDelete={handleDeleteEvent}
          fetchCalendarItems={fetchCalendarItems}
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

// Event Detail Modal Component
const EventDetailModal = ({
  event,
  onClose,
  onUpdate,
  onDelete,
  fetchCalendarItems,
}) => {
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
  const isEvent = event.event !== undefined;
  const isPublished = isEvent && event.event?.published;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(event.id, {
      ...formData,
      start: new Date(formData.start).toISOString(),
      end: new Date(formData.end).toISOString(),
    });
  };

  const handlePublishToggle = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/calendarItems/events/${event.event.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            published: !isPublished,
          }),
        }
      );

      if (response.ok) {
        // Refresh calendar data instead of full page reload
        onClose(); // Close modal first
        await fetchCalendarItems(); // Refresh data
      } else {
        console.error("Failed to toggle publish status");
      }
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
            {!isEvent && (
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="public"
                    checked={formData.public}
                    onChange={handleInputChange}
                  />
                  Make this visible to friends
                </label>
              </div>
            )}
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
              <strong>Type:</strong>
              <span>{isEvent ? "Public Event" : "Personal Calendar Item"}</span>
            </div>

            {!isEvent && (
              <div className="detail-item">
                <strong>Visibility:</strong>
                <span>{event.public ? "Visible to friends" : "Private"}</span>
              </div>
            )}

            <div className="modal-actions">
              <button onClick={() => onDelete(event.id)} className="btn-danger">
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

// Create Event Modal Component
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
    isEvent: false, // New field to determine if this should be an Event
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

          {!formData.isEvent && (
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="public"
                  checked={formData.public}
                  onChange={handleInputChange}
                />
                Make this visible to friends
              </label>
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

export default Home;
