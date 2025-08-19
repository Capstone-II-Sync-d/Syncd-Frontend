import axios from "axios";
import React, { useEffect, useState } from "react";
import { API_URL } from "../shared";
import EventList from "./Lists/EventList";
import BusinessList from "./Lists/BusinessList";
import UserList from "./Lists/UserList";
import "./ExploreStyles.css";

const Explore = () => {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("Users");
  const [query, setQuery] = useState("");

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  const [events, setEvents] = useState([]);
  const [viewPastEvents, setViewPastEvents] = useState(false);
  const [filteredEvents, setFilteredEvents] = useState([]);

  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);

  const getUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/profiles/users`);
      const users = response.data.users;
      setUsers(users);
      setFilteredUsers(users);
      console.log(`Successfully retrieved ${users.length} users`);
    } catch (error) {
      console.error("Error getting users:", error);
    }
  };

  const filterUsers = () => {
    if (users.length === 0) {
      setFilteredUsers([]);
      return;
    }

    setFilteredUsers(
      users.filter((user) => user.username.toLowerCase().includes(query))
    );
  };

  const getEvents = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/calendarItems/events`);
      setEvents(response.data);
      const now = new Date();
      setFilteredEvents(
        response.data.filter((event) => Date.parse(event.endTime) > now)
      );
      console.log(`Successfully retrieved ${response.data.length} events`);
    } catch (error) {
      console.error("Error getting events:", error);
    }

    setLoading(false);
  };

  const filterEvents = () => {
    if (events.length === 0) return;

    const now = new Date();
    setFilteredEvents(
      events.filter(
        (event) =>
          // Query filter
          (event.title.toLowerCase().includes(query) ||
            event.description.toLowerCase().includes(query) ||
            (event.business
              ? event.business.toLowerCase().includes(query)
              : event.creatorUsername.toLowerCase().includes(query))) &&
          // Past Events filter
          (viewPastEvents ? true : Date.parse(event.endTime) > now)
      )
    );
  };

  const getBusinesses = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/profiles/businesses`);
      setBusinesses(response.data);
      setFilteredBusinesses(response.data);
      console.log(`Successfully retrieved ${response.data.length} businesses`);
    } catch (error) {
      console.error("Error getting businesses:", error);
    }
  };

  const filterBusinesses = () => {
    setFilteredBusinesses(
      businesses.filter(
        (business) =>
          business.name.toLowerCase().includes(query) ||
          business.bio.toLowerCase().includes(query) ||
          business.owner.toLowerCase().includes(query) ||
          (business.category && business.category.toLowerCase().includes(query))
      )
    );
  };

  const renderList = () => {
    switch (view) {
      case "Users":
        return <UserList users={filteredUsers} />;
      case "Events":
        return <EventList events={filteredEvents} />;
      case "Businesses":
        return <BusinessList businesses={filteredBusinesses} />;
    }
  };

  // Get all events and businesses on load
  useEffect(() => {
    getUsers();
    getEvents();
    getBusinesses();
  }, []);

  // Filter events and businesses whenever the query changes
  useEffect(() => {
    filterUsers();
    filterEvents();
    filterBusinesses();
  }, [query]);

  // Filter events whenever the view past toggle changes
  useEffect(() => {
    filterEvents();
  }, [viewPastEvents]);

  if (loading) {
    return (
      <div className="explore-container">
        <div className="explore-loading">
          <div className="explore-spinner"></div>
          Discovering amazing content...
        </div>
      </div>
    );
  }

  const getViewCounts = () => {
    switch (view) {
      case "Users":
        return filteredUsers.length;
      case "Events":
        return filteredEvents.length;
      case "Businesses":
        return filteredBusinesses.length;
      default:
        return 0;
    }
  };

  const getViewEmoji = () => {
    switch (view) {
      case "Users":
        return "👥";
      case "Events":
        return "🎉";
      case "Businesses":
        return "🏢";
      default:
        return "🔍";
    }
  };

  const renderEmptyState = () => (
    <div className="explore-empty">
      <div className="explore-empty-icon">{getViewEmoji()}</div>
      <div className="explore-empty-title">
        No {view.toLowerCase()} found
      </div>
      <div className="explore-empty-text">
        {query 
          ? `Try adjusting your search terms or filters`
          : `Be the first to discover something amazing!`
        }
      </div>
    </div>
  );

  return (
    <div className="explore-container">
      <div className="explore-content">
        {/* Sidebar */}
        <div className="explore-sidebar">
          {/* Navigation */}
          <div className="explore-nav-card">
            <h2 className="explore-nav-title">Discover</h2>
            <div className="explore-tabs">
              <div
                className={`explore-tab ${view === "Users" ? "active" : ""}`}
                onClick={() => setView("Users")}
              >
                👥 Users
              </div>
              <div
                className={`explore-tab ${view === "Events" ? "active" : ""}`}
                onClick={() => setView("Events")}
              >
                🎉 Events
              </div>
              <div
                className={`explore-tab ${view === "Businesses" ? "active" : ""}`}
                onClick={() => setView("Businesses")}
              >
                🏢 Businesses
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="explore-search-section">
            <h3 className="search-title">Search</h3>
            <div className="search-container">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder={`Search ${view.toLowerCase()}...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="explore-filter-section">
            <h3 className="filter-title">Filters</h3>
            <div className="filter-options">
              {view === "Events" && (
                <div className="filter-option">
                  <input
                    type="checkbox"
                    id="view-past"
                    checked={viewPastEvents}
                    onChange={() => setViewPastEvents(!viewPastEvents)}
                  />
                  <label htmlFor="view-past">Include Past Events</label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="explore-main">
          {/* Hero Section */}
          <div className="explore-hero">
            <h1 className="explore-hero-title">
              Explore {view}
            </h1>
            <p className="explore-hero-subtitle">
              {view === "Users" && "Connect with amazing people in your community"}
              {view === "Events" && "Discover exciting events happening around you"}
              {view === "Businesses" && "Find local businesses and services you'll love"}
            </p>
          </div>

          {/* Content Grid */}
          <div className="explore-content-grid">
            <div className="explore-grid-header">
              <h2 className="explore-grid-title">
                {view} {query && `matching "${query}"`}
              </h2>
              <div className="explore-count">
                {getViewCounts()} {view.toLowerCase()}
              </div>
            </div>

            <div className={`explore-grid ${view.toLowerCase()}`}>
              {getViewCounts() === 0 ? renderEmptyState() : renderList()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explore;
