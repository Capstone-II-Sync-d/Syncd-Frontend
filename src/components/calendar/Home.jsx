import React, { useState, useEffect } from "react";
import CalendarComponent from "./CalendarComponent";
import "./Home.css";
import axios from "axios";
import { API_URL } from "../../shared";
import MessagingCard from "../Cards/MessagingCard";

const Home = ({ user, socket }) => {
  // |---------------------------------------------------------------|
  // |   STATE VARIABLES                                             |
  // |---------------------------------------------------------------|
  const [calendarItems, setCalendarItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarKey, setCalendarKey] = useState(0);

  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  const [calendarsVisible, setCalendarsVisible] = useState({
    personal: true,
    business: true,
    friends: true,
  });

  // Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDateTime, setSelectedDateTime] = useState(null);

  const [allMessages, setAllMessages] = useState([]);
  const [unread, setUnread] = useState(0);

  const [query, setQuery] = useState("");
  const [friends, setFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);

  const [userClicked, setUserClicked] = useState();
  const [input, setInput] = useState("");
  const [room, setRoom] = useState(null);

  // |---------------------------------------------------------------|
  // |   DERIVED VALUES                                              |
  // |---------------------------------------------------------------|
  const userId = user ? Number(user.id) : null;
  if (process.env.NODE_ENV === "development") {
    console.log("🏠 Home component received user:", user);
  }
  console.log("Socket in parent:", socket);

  // |---------------------------------------------------------------|
  // |   API CALLS                                                   |
  // |---------------------------------------------------------------|

  // |--- Friends API ----------------------------------------------|
  const getAllFriends = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/profiles/user/${userId}/friends`,
        { withCredentials: true }
      );
      setFriends(response.data);
      setFilteredFriends(response.data);
    } catch (error) {
      console.error("Error fetching friends:", error);
      setFriends([]);
      setFilteredFriends([]);
    }
  };

  // |--- Calendar API ---------------------------------------------|
  const fetchUserCalendarItems = async () => {
    try {
      const items = await calendarAPI.getMyItems();
      console.log("Fetched calendar items:", items);
      setCalendarItems(items);
      transformAndSetEvents(items);
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_URL}/api/calendarItems/me`, {
        withCredentials: true,
      });

      setCalendarItems(response.data);
    } catch (err) {
      console.error("Error fetching calendar items:", err);
      if (err.response?.status === 401) {
        setError("Not authenticated. Please log in again.");
      } else if (err.response?.status === 403) {
        setError("Access denied. Please check your permissions.");
      } else if (err.response?.status === 500) {
        setError("Server error. Please try again later.");
      } else if (err.code === "ERR_NETWORK") {
        setError("Network error. Make sure the backend server is running.");
      } else {
        setError(`Failed to load calendar events: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const createCalendarItem = async (eventData) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/calendarItems/user/item`,
        eventData,
        { withCredentials: true }
      );
      fetchUserCalendarItems(); // Refresh the calendar
      return response.data;
    } catch (err) {
      console.error("Error creating calendar item:", err);
      throw err;
    }
  };

  // |---------------------------------------------------------------|
  // |   HELPERS                                                     |
  // |---------------------------------------------------------------|

  // |--- Filtering Logic ------------------------------------------|
  const filterFriends = () => {
    if (friends.length === 0) {
      setFilteredFriends([]);
      return;
    }
    setFilteredFriends(
      friends.filter(
        (friend) =>
          friend.user?.username &&
          friend.user.username.toLowerCase().includes(query.toLowerCase())
      )
    );
  };

  // |--- Socket Helpers -------------------------------------------|
  const joinMessageRoom = (roomName) => {
    console.log("joinMessageRoom called", { socket, roomName });
    if (socket && roomName) {
      socket.emit("join-message-room", roomName);
      console.log(`✅ Joined message room: ${roomName}`);
    } else {
      console.log("❌ No socket or no roomName");
    }
  };

  const handleMessageSend = async (input) => {
    socket.emit("sending-message", input, user, userClicked, room);
  };

  // When closing the create event modal
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCalendarKey((k) => k + 1);
  };
  
  // When closng the event detail modal
  const handleCloseEventDetailModal = () => {
    setShowEventModal(false);
    setCalendarKey((k) => k + 1);
  }


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
  // |--- UI Actions ------------------------------------------------|
  const toggleCalendar = (calendarId) => {
    setCalendarsVisible((prev) => ({
      ...prev,
      [calendarId]: !prev[calendarId],
    }));
  };

  const refreshCalendar = () => {
    fetchUserCalendarItems();
  };

  // |---------------------------------------------------------------|
  // |   EFFECTS                                                     |
  // |---------------------------------------------------------------|
  useEffect(() => {
    filterFriends();
  }, [query, friends]);

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
    if (user) {
      fetchUserCalendarItems();
      getAllFriends();
    } else {
      setLoading(false);
    }
  }, [user]);

  // |---------------------------------------------------------------|
  // |   RENDER: CONDITIONAL STATES                                  |
  // |---------------------------------------------------------------|
  if (loading) {
    return (
      <div className="home-loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Loading your calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-error">
        <div className="error-content">
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button onClick={refreshCalendar} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="home-no-user">
        <h2>Please log in to view your calendar</h2>
      </div>
    );
  }

  // |---------------------------------------------------------------|
  // |   RENDER: MAIN UI                                             |
  // |---------------------------------------------------------------|
  return (
    <div className="home-container">
      {/* |-----------------------------------------------------------| */}
      {/* |   LEFT SIDEBAR                                            | */}
      {/* |-----------------------------------------------------------| */}
      <div className="home-sidebar">
        {/* |--- Create Events Section --------------------------------| */}
        <div className="sidebar-section">
          <button
            className="create-event-btn"
            onClick={() => setShowCreateEvent(true)}
          >
            <span className="btn-icon">+</span>
            Create Events
          </button>
        </div>

        {/* |--- Create Calendars Section -----------------------------| */}
        <div className="sidebar-section">
          <button className="create-calendar-btn">
            <span className="btn-text">Create Calendars</span>
            <span className="btn-icon">+</span>
          </button>
        </div>

        {/* |--- Search Section ---------------------------------------| */}
        <div className="sidebar-section">
          <div className="search-section">
            <div className="search-icon">👥</div>
            <div className="search-content">
              <h3>Search For</h3>
              <p>Friends/Businesses</p>
            </div>
          </div>
        </div>

        {/* |--- Calendar Toggle Section -----------------------------| */}
        <div className="sidebar-section">
          <h3 className="section-title">My Calendars</h3>

          <div className="calendar-list">
            <label className="calendar-item">
              <input
                type="checkbox"
                checked={calendarsVisible.personal}
                onChange={() => toggleCalendar("personal")}
              />
              <span className="calendar-color personal"></span>
              <span className="calendar-name">Personal</span>
              <span className="calendar-count">
                {
                  calendarItems.filter((item) => item.itemType === "personal")
                    .length
                }
              </span>
            </label>

            <label className="calendar-item">
              <input
                type="checkbox"
                checked={calendarsVisible.business}
                onChange={() => toggleCalendar("business")}
              />
              <span className="calendar-color business"></span>
              <span className="calendar-name">Business</span>
              <span className="calendar-count">
                {calendarItems.filter((item) => item.businessId).length}
              </span>
            </label>

            <label className="calendar-item">
              <input
                type="checkbox"
                checked={calendarsVisible.friends}
                onChange={() => toggleCalendar("friends")}
              />
              <span className="calendar-color friends"></span>
              <span className="calendar-name">Events</span>
              <span className="calendar-count">
                {
                  calendarItems.filter(
                    (item) => item.itemType === "event" && !item.businessId
                  ).length
                }
              </span>
            </label>
          </div>
        </div>

        {/* |--- Quick Stats -----------------------------------------| */}
        <div className="sidebar-section">
          <div className="quick-stats">
            <div className="stat-item">
              <span className="stat-number">{calendarItems.length}</span>
              <span className="stat-label">Total Events</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {
                  calendarItems.filter((item) => {
                    const today = new Date();
                    const eventDate = new Date(item.start);
                    return eventDate.toDateString() === today.toDateString();
                  }).length
                }
              </span>
              <span className="stat-label">Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* |-----------------------------------------------------------| */}
      {/* |   MESSAGING BUTTON                                       | */}
      {/* |-----------------------------------------------------------| */}
      <div className="messages">
        <button
          className="msg-btn"
          onClick={() => {
            setShowConversation(!showConversation);
          }}
        >
          <img src="https://i.pinimg.com/736x/736x/88/5b/bc/885bbc59d72cb89d7edaa174dd4c1857.jpg" />
        </button>
      </div>

      {/* |-----------------------------------------------------------| */}
      {/* |   FRIENDS LIST POPUP                                     | */}
      {/* |-----------------------------------------------------------| */}
      {showConversation && (
        <div className="friends-list">
          {/* |--- Search Bar -----------------------------------------| */}
          <div className="search">
            <input
              type="text"
              id="search-bar"
              placeholder="Search friends..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* |--- Friend Cards ---------------------------------------| */}
          <div className="friend-cards">
            {filteredFriends.length === 0 ? (
              friends.length === 0 ? (
                <p className="no-results">You have no friends yet</p>
              ) : (
                <p className="no-results">No friends match your search</p>
              )
            ) : (
              filteredFriends.map((friend) => (
                <MessagingCard
                  key={friend.user.id}
                  friend={friend.user}
                  user={user}
                  setRoom={setRoom}
                  setUserClicked={setUserClicked}
                  setShowMessage={setShowMessage}
                  showMessage={showMessage}
                  joinMessageRoom={joinMessageRoom}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* |-----------------------------------------------------------| */}
      {/* |   MESSAGE POPUP                                         | */}
      {/* |-----------------------------------------------------------| */}
      {showMessage && (
        <div className="messagePopup">
          <div className="messagePopupHeader">
            <img src={userClicked.profilePicture} />
            <span>{userClicked.username}</span>
          </div>
          <button
            className="backButton"
            onClick={() => {
              setShowMessage(!showMessage);
            }}
          >
            Back
          </button>
          <div className="chat"></div>
          <div className="msgInput">
            <input
              type="text"
              id="textInput"
              placeholder="Aa"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
              }}
            />
            <span>
              <button
                onClick={() => {
                  handleMessageSend(input);
                  setInput("");
                }}
              >
                Send
              </button>
            </span>
          </div>
        </div>

        {/* TOAST UI Calendar */}
        <div className="calendar-wrapper">
          <Calendar
            key={calendarKey}
            ref={calendarRef}
            height="600px"
            events={events}
            {...calendarOptions}
            view={currentView}
            onClickEvent={handleEventClick}
            onSelectDateTime={handleSelectDateTime}
          />
        </div>
      </div>

      {/* Event Detail Modal */}
      {showEventModal && selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={handleCloseEventDetailModal}
          onRefresh={fetchCalendarItems}
        />
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          selectedDateTime={selectedDateTime}
          onClose={handleCloseCreateModal}
          onCreate={handleCreateEvent}
        />
      )}
    </div>
  );
};

export default Home;