import React, { useState, useEffect } from 'react';
import CalendarComponent from './CalendarComponent';
import './Home.css'; 
import axios from 'axios';
import { API_URL } from '../../shared';

const Home = ({ user }) => {
  const [calendarItems, setCalendarItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [calendarsVisible, setCalendarsVisible] = useState({
    personal: true,
    business: true,
    friends: true
  });

  // Debug: Log what user we received (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('🏠 Home component received user:', user);
  }

  // Fetch user's calendar items when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchUserCalendarItems();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserCalendarItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `${API_URL}/api/calendarItems/me`,
        { withCredentials: true }
      );
      
      setCalendarItems(response.data);
    } catch (err) {
      console.error('Error fetching calendar items:', err);
      
      if (err.response?.status === 401) {
        setError('Not authenticated. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('Access denied. Please check your permissions.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (err.code === 'ERR_NETWORK') {
        setError('Network error. Make sure the backend server is running.');
      } else {
        setError(`Failed to load calendar events: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to create a new calendar item
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
      console.error('Error creating calendar item:', err);
      throw err;
    }
  };

  // Toggle calendar visibility
  const toggleCalendar = (calendarId) => {
    setCalendarsVisible(prev => ({
      ...prev,
      [calendarId]: !prev[calendarId]
    }));
  };

  const refreshCalendar = () => {
    fetchUserCalendarItems();
  };

  // Loading state
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

  // Error state
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

  // No user state
  if (!user) {
    return (
      <div className="home-no-user">
        <h2>Please log in to view your calendar</h2>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Left Sidebar */}
      <div className="home-sidebar">
        {/* Create Events Section */}
        <div className="sidebar-section">
          <button className="create-event-btn" onClick={() => setShowCreateEvent(true)}>
            <span className="btn-icon">+</span>
            Create Events
          </button>
        </div>

        {/* Create Calendars Section */}
        <div className="sidebar-section">
          <button className="create-calendar-btn">
            <span className="btn-text">Create Calendars</span>
            <span className="btn-icon">+</span>
          </button>
        </div>

        {/* Search Section */}
        <div className="sidebar-section">
          <div className="search-section">
            <div className="search-icon">👥</div>
            <div className="search-content">
              <h3>Search For</h3>
              <p>Friends/Businesses</p>
            </div>
          </div>
        </div>

        {/* Calendar Toggle Section */}
        <div className="sidebar-section">
          <h3 className="section-title">My Calendars</h3>
          
          <div className="calendar-list">
            <label className="calendar-item">
              <input
                type="checkbox"
                checked={calendarsVisible.personal}
                onChange={() => toggleCalendar('personal')}
              />
              <span className="calendar-color personal"></span>
              <span className="calendar-name">Personal</span>
              <span className="calendar-count">
                {calendarItems.filter(item => item.itemType === 'personal').length}
              </span>
            </label>
            
            <label className="calendar-item">
              <input
                type="checkbox"
                checked={calendarsVisible.business}
                onChange={() => toggleCalendar('business')}
              />
              <span className="calendar-color business"></span>
              <span className="calendar-name">Business</span>
              <span className="calendar-count">
                {calendarItems.filter(item => item.businessId).length}
              </span>
            </label>
            
            <label className="calendar-item">
              <input
                type="checkbox"
                checked={calendarsVisible.friends}
                onChange={() => toggleCalendar('friends')}
              />
              <span className="calendar-color friends"></span>
              <span className="calendar-name">Events</span>
              <span className="calendar-count">
                {calendarItems.filter(item => item.itemType === 'event' && !item.businessId).length}
              </span>
            </label>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="sidebar-section">
          <div className="quick-stats">
            <div className="stat-item">
              <span className="stat-number">{calendarItems.length}</span>
              <span className="stat-label">Total Events</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {calendarItems.filter(item => {
                  const today = new Date();
                  const eventDate = new Date(item.start);
                  return eventDate.toDateString() === today.toDateString();
                }).length}
              </span>
              <span className="stat-label">Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar Area */}
      <div className="home-main">
        {/* Welcome Header */}
        <div className="welcome-header">
          <h1>Welcome back, {user.firstName || user.username}!</h1>
        </div>

        {/* Calendar Component */}
        <div className="calendar-wrapper">
          <CalendarComponent 
            userId={user.id}
            userCalendarItems={calendarItems}
            onRefresh={refreshCalendar}
            onCreateEvent={createCalendarItem}
            calendarsVisible={calendarsVisible}
          />
        </div>
      </div>

      {/* Create Event Modal (placeholder) */}
      {showCreateEvent && (
        <div className="modal-overlay" onClick={() => setShowCreateEvent(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Event</h2>
              <button onClick={() => setShowCreateEvent(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <p>Event creation form will go here...</p>
              {/* You can add the actual form here later */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;