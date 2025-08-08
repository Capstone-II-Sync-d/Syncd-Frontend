import axios from "axios";
import React, { useEffect, useState } from "react";
import { API_URL } from "../shared";
import EventList from "./EventList";
import "./ExploreStyles.css";
import BusinessList from "./BusinessList";
import UserList from "./UserList";

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
      console.log(`Successfully retrieved ${users.length} users`)
    } catch (error) {
      console.error("Error getting users:", error);
    }
  }

  const filterUsers = () => {
    if (users.length === 0) {
      setFilteredUsers([]);
      return;
    }

    setFilteredUsers(users.filter((user) => (
      user.username.toLowerCase().includes(query)
    )));
  }

  const getEvents = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/calendarItems/events`);
      setEvents(response.data);
      const now = new Date();
      setFilteredEvents(response.data.filter((event) => (
        Date.parse(event.endTime) > now
      )));
      console.log(`Successfully retrieved ${response.data.length} events`);
    } catch (error) {
      console.error("Error getting events:", error);
    }

    setLoading(false);
  };

  const filterEvents = () => {
    if (events.length === 0)
      return

    const now = new Date();
    setFilteredEvents(
      events.filter((event) => (
        // Query filter
        ( event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        ( event.business ?
          event.business.toLowerCase().includes(query) :
          event.creatorUsername.toLowerCase().includes(query)
        ))
        &&
        // Past Events filter
        ( viewPastEvents ? true : Date.parse(event.endTime) > now )
      ))
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
      businesses.filter((business) => (
        business.name.toLowerCase().includes(query) ||
        business.bio.toLowerCase().includes(query) ||
        business.owner.toLowerCase().includes(query) ||
        (business.category && business.category.toLowerCase().includes(query))
      ))
    );
  };

  const renderList = () => {
    switch(view) {
      case "Users":
        return <UserList users={filteredUsers} />
      case "Events":
        return <EventList events={filteredEvents} />
      case "Businesses":
        return <BusinessList businesses={filteredBusinesses} />
    }
  }

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

  if (loading)
    return <p>Loading...</p>

  return (
    <div className="explore-container">
      <div className="sidebar">
        <div className="header">
          <h2>Explore</h2>
        </div>
        <div className="selectors">
          <h3
            className={`selector ${view === "Users" ? "active" : ""}`}
            onClick={() => {setView("Users")}}
          > Users</h3>
          <h3
            className={`selector ${view === "Events" ? "active" : ""}`}
            onClick={() => {setView("Events")}}
          > Events</h3>
          <h3
            className={`selector ${view === "Businesses" ? "active" : ""}`}
            onClick={() => {setView("Businesses")}}
          > Businesses</h3>
        </div>
        
        <div className="header">
          <h2>Search</h2>
        </div>
        <div className="search">
          <input 
            type="text"
            id="search-bar"
            value={query}
            onChange={(e) => { setQuery(e.target.value) }}
            />
        </div>

        <div className="header">
          <h2>Filter</h2>
        </div>
        <div className="filter">
          { view === "Events" &&
            <div className="filter-option">
              <input
                type="checkbox"
                id="view-past"
                value={viewPastEvents}
                onChange={() => {setViewPastEvents(!viewPastEvents)}}
                />
              <label htmlFor="view-past"> View Past Events</label>
            </div>
          }
        </div>
      </div>

      <div className="content">
        <div className={`explore-list ${view === "Users" ? "user-list" : ""}`}>
          {renderList()}
        </div>
      </div>
    </div>
  );
};

export default Explore;
