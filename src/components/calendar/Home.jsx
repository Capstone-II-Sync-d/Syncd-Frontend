import React, { useState, useEffect, useRef, useContext } from "react";
import { AppContext } from "../../AppContext";
import Calendar from "@toast-ui/react-calendar";
import "@toast-ui/calendar/dist/toastui-calendar.min.css";
import "./HomeStyles.css";
import axios from "axios";
import { API_URL } from "../../shared";
import Conversation from "../Cards/ConversationCard";
import MessageCard from "../Cards/MessageCard";
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
  const [calendarItems, setCalendarItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarKey, setCalendarKey] = useState(0);
  const { socket, user, friends, setFriends, setUser } = useContext(AppContext);

  // Calendar visibility toggles
  const [calendarVisibility, setCalendarVisibility] = useState({
    personal: true,
    business: true,
    events: true,
    drafts: true,
  });

  const [allMessages, setAllMessages] = useState([]);
  const [unread, setUnread] = useState(0);

  const [query, setQuery] = useState("");
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [showMessage, setShowMessage] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
  const [userClicked, setUserClicked] = useState();
  const [input, setInput] = useState("");
  const [room, setRoom] = useState(null);

  // Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDateTime, setSelectedDateTime] = useState(null);

  // TOAST UI Calendar ref
  const calendarRef = useRef(null);

  const userId = user ? Number(user.id) : null;
  if (process.env.NODE_ENV === "development") {
    console.log("🏠 Home component received user:", user);
  }
  console.log("Socket in parent:", socket);

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

  // Fetch current user
  const fetchUser = async () => {
    try {
      const userData = await authAPI.getMe();
      setUser(userData.user);
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  // Fetch all messages between current user and a specific friend
  const fetchMessagesWithFriend = async (friendId) => {
    if (!userId || !friendId) return;

    try {
      const res = await axios.get(`${API_URL}/api/messages/me`, {
        withCredentials: true,
      });
      // Filter messages to include only those with the specific friend
      const filteredMessages = res.data.filter(
        (msg) =>
          (msg.senderId === userId && msg.receiverId === friendId) ||
          (msg.senderId === friendId && msg.receiverId === userId)
      );
      console.log("Messages", filteredMessages);

      // Sort messages by creation time
      const sortedMessages = filteredMessages.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

      setAllMessages(sortedMessages);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setAllMessages([]);
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

  // When closing the create event modal
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCalendarKey((k) => k + 1);
  };

  // When closng the event detail modal
  const handleCloseEventDetailModal = () => {
    setShowEventModal(false);
    setCalendarKey((k) => k + 1);
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
          published:
            eventData.published !== undefined ? eventData.published : false,
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

  useEffect(() => {
    if (!socket || !user) return;

    const handleReceiveMessage = () => {
      if (userClicked) {
        // Fetch only messages with the clicked friend
        fetchMessagesWithFriend(userClicked.id);
      }
    };

    socket.on("receive-message", handleReceiveMessage);

    const handleReconnect = () => {
      console.log("🔄 Socket reconnected");
      if (room && userClicked) {
        socket.emit("join-message-room", room, user, userClicked);
        console.log(`✅ Rejoined room: ${room}`);
      }
    };
    socket.on("connect", handleReconnect);

    return () => {
      socket.off("receive-message", handleReceiveMessage);
      socket.off("connect", handleReconnect);
    };
  }, [socket, user, room, userClicked]);

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

  useEffect(() => {
    filterFriends();
  }, [query, friends]);

  useEffect(() => {
    if (user) {
      getAllFriends();
    } else {
      setLoading(false);
    }
  }, [user]);

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
      {/* |-----------------------------------------------------------| */}
      {/* |   MESSAGING BUTTON                                       | */}
      {/* |-----------------------------------------------------------| */}
      <div className="messages">
        <button
          className="msg-btn"
          onClick={() => setShowConversation(!showConversation)}
        >
          <img src="https://i.pinimg.com/736x/7f/66/c6/7f66c6785be2dfd18a370e9069eafc52.jpg" />
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
                <Conversation
                  key={friend.user.id}
                  friend={friend.user}
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
              if (socket && room) {
                socket.emit("leave-message-room", room);
                console.log(`🚪 Left room: ${room}`);
              }
              setShowMessage(false);
              setRoom(null);
              setUserClicked(null);
            }}
          >
            Back
          </button>
          <div className="chat">
            {allMessages.length === 0 ? (
              <p className="no-messages">No messages yet</p>
            ) : (
              allMessages.map((msg) => (
                <MessageCard key={msg.id} message={msg} user={user} />
              ))
            )}
          </div>
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
      )}
    </div>
  );
};

export default Home;
