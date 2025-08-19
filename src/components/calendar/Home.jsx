import React, { useState, useEffect, useRef, useContext } from "react";
import { AppContext } from "../../AppContext";
import Calendar from "@toast-ui/react-calendar";
import "@toast-ui/calendar/dist/toastui-calendar.min.css";
import "./HomeStyles.css";
import axios from "axios";
import { API_URL } from "../../shared";
import Conversation from "../Cards/ConversationCard";
import MessageCard from "../Cards/MessageCard";

// Utility APIs and functions
import { authAPI, calendarAPI, eventsAPI, businessAPI } from "./utils/api";
import {
  determineCalendarId,
  transformCalendarData,
  getEventStats,
  formatCurrentDate,
  getCalendarOptions,
} from "./utils/calendarUtils";

// Modals
import CreateEventModal from "./CreateEventModal";
import EventDetailModal from "./EventDetailModal";
import CreateBusinessModal from "./CreateBusinessModal";

const roundToFiveMinutes = (date) => {
  const rounded = new Date(date);
  const minutes = rounded.getMinutes();
  const remainder = minutes % 5;

  if (remainder !== 0) {
    rounded.setMinutes(minutes - remainder);
  }
  rounded.setSeconds(0);
  rounded.setMilliseconds(0);

  console.log(
    `Rounded ${date.toLocaleTimeString()}) to ${rounded.toLocaleTimeString()}`
  );
  return rounded;
};

const Home = () => {
  // -------------------- STATE VARIABLES --------------------
  const [calendarItems, setCalendarItems] = useState([]); // raw calendar items
  const [events, setEvents] = useState([]); // transformed calendar events for TOAST UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState("month"); // month/week/day
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarKey, setCalendarKey] = useState(0); // force calendar rerender
  const {
    socket,
    user,
    friends,
    setFriends,
    setUser,
    businesses,
    getBusinesses,
  } = useContext(AppContext);

  // Calendar visibility toggles (personal, business, events, drafts)

  const [calendarVisibility, setCalendarVisibility] = useState({
    personal: true,
    business: true,
    events: true,
    drafts: true,
  });

  // Messaging state
  const [allMessages, setAllMessages] = useState([]);
  const [unread, setUnread] = useState(0);
  const [query, setQuery] = useState(""); // search bar query
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [showMessage, setShowMessage] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
  const [userClicked, setUserClicked] = useState(); // friend being messaged
  const [input, setInput] = useState(""); // message input
  const [room, setRoom] = useState(null); // socket room for chat

  // Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDateTime, setSelectedDateTime] = useState(null);

  // User feedback message states
  const [userMessage, setUserMessage] = useState("");
  const [userMessageType, setUserMessageType] = useState("error"); // error, success, warning
  const [showUserMessage, setShowUserMessage] = useState(false);

  // Reference to TOAST UI calendar
  const calendarRef = useRef(null);

  const userId = user ? Number(user.id) : null;

  if (process.env.NODE_ENV === "development") {
    console.log("🏠 Home component received user:", user);
  }

  console.log("Socket in parent:", socket);

  // Helper function to show user messages
  const showUserMessagePopup = (message, type = "error") => {
    setUserMessage(message);
    setUserMessageType(type);
    setShowUserMessage(true);
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setShowUserMessage(false);
    }, 5000);
  };

  // -------------------- FRIENDS API --------------------
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
      showUserMessagePopup(
        "Failed to load your friends list. Some messaging features may not work.",
        "warning"
      );
    }
  };

  // -------------------- FILTER FRIENDS --------------------
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

  // -------------------- SOCKET HELPERS --------------------
  const joinMessageRoom = (roomName, user, friend) => {
    if (!socket || !roomName || !user || !friend) return;
    console.log("Joining message room:", roomName);

    // Leave previous room
    if (room) {
      socket.emit("leave-message-room", room);
    }

    // Join new room
    socket.emit("join-message-room", roomName, user, friend);
  };

  const handleMessageSend = (messageText) => {
    socket.emit("sending-message", messageText, user, userClicked, room);
    setInput("");
  };

  // -------------------- FETCH USER --------------------
  const fetchUser = async () => {
    try {
      const userData = await authAPI.getMe();
      setUser(userData.user);
    } catch (err) {
      console.error("Error fetching user:", err);
      showUserMessagePopup(
        "Failed to load your profile. Please refresh the page to try again.",
        "error"
      );
    }
  };

  // -------------------- CALENDAR FUNCTIONS --------------------
  const fetchCalendarItems = async () => {
    try {
      const items = await axios.get(`${API_URL}/api/calendarItems/me`, {
        withCredentials: true,
      });
      console.log("Fetched calendar items:", items);
      setCalendarItems(items.data);
      transformAndSetEvents(items.data);
    } catch (err) {
      setError("Error loading calendar data");
      console.error("Error fetching calendar items:", err);
      showUserMessagePopup(
        "Failed to load your calendar events. Please refresh the page to try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const transformAndSetEvents = (items) => {
    const transformedEvents = transformCalendarData(items, calendarVisibility);
    setEvents(transformedEvents);
  };

  const handleCalendarToggle = (calendarType) => {
    const newVisibility = {
      ...calendarVisibility,
      [calendarType]: !calendarVisibility[calendarType],
    };
    setCalendarVisibility(newVisibility);

    // Update TOAST UI visibility
    if (calendarRef.current) {
      const calendar = calendarRef.current.getInstance();
      calendar.setCalendarVisibility(calendarType, newVisibility[calendarType]);
    }
  };

  const handleViewChange = (view) => {
    try {
      setCurrentView(view);
      if (calendarRef.current) {
        const calendar = calendarRef.current.getInstance();
        calendar.changeView(view);
      }
    } catch (error) {
      console.error("Error changing calendar view:", error);
      showUserMessagePopup(
        "Failed to change calendar view. Please try refreshing the page.",
        "error"
      );
      // Revert to previous view on error
      setCurrentView(currentView);
    }
  };

  const handleTodayClick = () => {
    try {
      setCurrentDate(new Date());
      if (calendarRef.current) {
        calendarRef.current.getInstance().today();
      }
    } catch (error) {
      console.error("Error navigating to today:", error);
      showUserMessagePopup(
        "Failed to navigate to today. Please try refreshing the page.",
        "error"
      );
    }
  };

  const handleNavigation = (direction) => {
    try {
      if (!calendarRef.current) return;
      const calendar = calendarRef.current.getInstance();
      if (direction === "prev") calendar.prev();
      else calendar.next();
      setCurrentDate(calendar.getDate().toDate());
    } catch (error) {
      console.error("Error navigating calendar:", error);
      showUserMessagePopup(
        "Failed to navigate calendar. Please try refreshing the page.",
        "error"
      );
    }
  };

  const handleEventClick = (eventInfo) => {
    try {
      const originalEvent = calendarItems.find(
        (item) => item.id.toString() === eventInfo.event.id
      );

      if (!originalEvent) {
        showUserMessagePopup(
          "Event not found. Please refresh the page and try again.",
          "error"
        );
        return;
      }

      setSelectedEvent(originalEvent);
      setShowEventModal(true);
    } catch (error) {
      console.error("Error opening event:", error);
      showUserMessagePopup(
        "Failed to open event details. Please try again.",
        "error"
      );
    }
  };

  const handleSelectDateTime = (selectionInfo) => {
    try {
      console.log("Date/time selected:", selectionInfo);

      if (!selectionInfo.start || !selectionInfo.end) {
        showUserMessagePopup(
          "Invalid time selection. Please try selecting a different time.",
          "error"
        );
        return;
      }

      setSelectedDateTime({
        start: roundToFiveMinutes(selectionInfo.start),
        end: roundToFiveMinutes(selectionInfo.end),
      });
      setShowCreateModal(true);
    } catch (error) {
      console.error("Error selecting date/time:", error);
      showUserMessagePopup(
        "Failed to select time slot. Please try again.",
        "error"
      );
    }
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCalendarKey((k) => k + 1);
  };

  const handleCloseEventDetailModal = () => {
    setShowEventModal(false);
    setCalendarKey((k) => k + 1);
  };

  const handleCreateEvent = async (eventData) => {
    try {
      const newCalendarItem = await calendarAPI.createItem({
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        start: eventData.start,
        end: eventData.end,
        public: eventData.isEvent ? true : eventData.public,
      });

      if (eventData.isEvent) {
        await eventsAPI.createEvent({
          itemId: newCalendarItem.id,
          businessId: eventData.postAs === "personal" ? null : eventData.postAs,
          published:
            eventData.published !== undefined ? eventData.published : false,
        });
      }

      await fetchCalendarItems();
      setShowCreateModal(false);
      setSelectedDateTime(null);
      showUserMessagePopup(
        eventData.isEvent
          ? "Event created successfully!"
          : "Calendar item created successfully!",
        "success"
      );
    } catch (error) {
      console.error("Error creating event:", error);
      showUserMessagePopup(
        eventData.isEvent
          ? "Failed to create event. Please check your input and try again."
          : "Failed to create calendar item. Please check your input and try again.",
        "error"
      );
    }
  };

  const handleCreateEventsClick = () => {
    console.log("Create Event clicked!");
    const now = new Date();
    console.log("Current time:", now.toLocaleTimeString());
    setSelectedDateTime({
      start: roundToFiveMinutes(now),
      end: roundToFiveMinutes(new Date(now.getTime() + 60 * 60 * 1000)),
    });
    setShowCreateModal(true);
  };

  const handleCreateBusinessClick = () => {
    console.log("Create Business clicked!");
    setShowBusinessModal(true);
  };

  const handleCreateBusiness = async (businessData) => {
    try {
      await businessAPI.createBusiness(businessData);
      console.log("Business created successfully!");
      setShowBusinessModal(false);
      // Refresh businesses list
      if (getBusinesses) {
        await getBusinesses();
      }
      showUserMessagePopup(
        "Business created successfully! You can now post events from your business.",
        "success"
      );
    } catch (error) {
      console.error("Error creating business:", error);
      showUserMessagePopup(
        "Failed to create business. Please check your input and try again.",
        "error"
      );
    }
  };

  const handleCloseBusinessModal = () => {
    setShowBusinessModal(false);
  };

  const calendarOptions = getCalendarOptions();

  // -------------------- SOCKET EFFECT --------------------
  useEffect(() => {
    if (!socket || !user) return;

    const handleReceiveMessage = (data) => {
      if (Array.isArray(data)) setAllMessages(data);
      else
        setAllMessages((prev) => {
          if (prev.some((msg) => msg.id === data.id)) return prev;
          return [...prev, data];
        });
    };

    const handleReconnect = () => {
      if (room && userClicked) joinMessageRoom(room);
    };

    socket.on("receive-message", handleReceiveMessage);
    socket.on("connect", handleReconnect);

    return () => {
      socket.off("receive-message", handleReceiveMessage);
      socket.off("connect", handleReconnect);
      if (room) socket.emit("leave-message-room", room);
    };
  }, [socket, user, room, userClicked]);

  // Messaging UI add on
  // Ref for chat bottom
  const chatEndRef = useRef(null);

  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (showMessage) {
      scrollToBottom();
    }
  }, [allMessages, showMessage]);

  // -------------------- INITIAL DATA --------------------
  useEffect(() => {
    fetchUser();
    fetchCalendarItems();
  }, []);

  useEffect(() => {
    if (calendarRef.current) {
      calendarRef.current.getInstance().changeView("month");
    }
  }, []);

  useEffect(() => filterFriends(), [query, friends]);
  useEffect(() => {
    if (user) getAllFriends();
    else setLoading(false);
  }, [user]);

  useEffect(() => {
    try {
      if (calendarRef.current && events.length > 0) {
        const calendar = calendarRef.current.getInstance();
        calendar.clear();
        calendar.createEvents(events);

        Object.keys(calendarVisibility).forEach((type) =>
          calendar.setCalendarVisibility(type, calendarVisibility[type])
        );
      }
    } catch (error) {
      console.error("Error rendering calendar events:", error);
      showUserMessagePopup(
        "Failed to display calendar events. Please refresh the page.",
        "error"
      );
    }
  }, [events, calendarVisibility]);

  useEffect(() => {
    if (calendarItems.length > 0) transformAndSetEvents(calendarItems);
  }, [calendarVisibility]);

  const stats = getEventStats(calendarItems, calendarVisibility);

  // -------------------- RENDER --------------------
  if (loading)
    return (
      <div className="home-container">
        <div className="loading">Loading your calendar...</div>
      </div>
    );
  if (error)
    return (
      <div className="home-container">
        <div className="error">Error: {error}</div>
      </div>
    );

  return (
    <div className="home-container">
      {/* User Message Popup */}
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

      {/* Sidebar */}
      <div className="sidebar">
        {/* Create Events Button */}
        <button className="create-events-btn" onClick={handleCreateEventsClick}>
          <span className="plus-icon">+</span>
          Create Event
        </button>

        {/* Create Business Button */}
        <button
          className="create-business-btn"
          onClick={handleCreateBusinessClick}
        >
          <span className="plus-icon">+</span>
          Create Business
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

      {/* Create Business Modal */}
      {showBusinessModal && (
        <CreateBusinessModal
          onClose={handleCloseBusinessModal}
          onCreate={handleCreateBusiness}
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
        <div className="messaging-friends-list">
          {/* |--- Header -----------------------------------------| */}
          <div className="messaging-header">
            <h3>Messages</h3>
            <button 
              className="close-messaging"
              onClick={() => setShowConversation(false)}
            >
              ×
            </button>
          </div>
          
          {/* |--- Search Bar -----------------------------------------| */}
          <div className="messaging-search">
            <input
              type="text"
              id="search-bar"
              placeholder="Search friends..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* |--- Friend Cards ---------------------------------------| */}
          <div className="messaging-friend-cards">
            {filteredFriends.length === 0 ? (
              friends.length === 0 ? (
                <p className="messaging-no-results">You have no friends yet</p>
              ) : (
                <p className="messaging-no-results">No friends match your search</p>
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
              setAllMessages([]);
            }}
          >
            Back
          </button>
          <div className="chat">
            {allMessages.length === 0 ? (
              <p className="no-messages">No messages yet</p>
            ) : (
              allMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={msg.senderId === user.id ? "sent" : "received"}
                >
                  <MessageCard message={msg} user={user} />
                </div>
              ))
            )}
            <div ref={chatEndRef} />
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim() !== "") {
                  handleMessageSend(input);
                  setInput("");
                }
              }}
            />
            <span>
              <button
                onClick={() => {
                  handleMessageSend(input);
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
