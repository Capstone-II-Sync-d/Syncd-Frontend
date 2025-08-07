import axios from "axios";
import React, { useEffect, useState } from "react";
import { API_URL } from "../shared";
import EventCard from "./EventCard";
import "./ExploreStyles.css";
import BusinessCard from "./BusinessCard";

const Explore = () => {
  const [loading, setLoading] = useState(true);
  const [viewToggle, setViewToggle] = useState(true);
  const [query, setQuery] = useState("");

  const [events, setEvents] = useState([]);
  const [viewPastEvents, setViewPastEvents] = useState(false);
  const [filteredEvents, setFilteredEvents] = useState([]);
  
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);

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

  // Get all events and businesses on load
  useEffect(() => {
    getEvents();
    getBusinesses();
  }, []);

  // Filter events and businesses whenever the query changes
  useEffect(() => {
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
      <h1>Explore {viewToggle ? "Events" : "Businesses"}</h1>

      <div className="search">
        <div className="search-bar">
          <label htmlFor="search-bar">Search: </label>
          <input 
            type="text"
            id="search-bar"
            value={query}
            onChange={(e) => { setQuery(e.target.value) }}
          />
        </div>

        <div className="search-toggle">
          <label className="toggle">
            Events
            <label className="switch">
              <input
                type="checkbox"
                value={viewToggle}
                onChange={() => {setViewToggle(!viewToggle)}}
              />
              <span className="slider round"></span>
            </label>
            Businesses
          </label>
        </div>

        { viewToggle &&
          <div>
            <label htmlFor="view-past">View Past Events</label>
            <input
              type="checkbox"
              id="view-past"
              value={viewPastEvents}
              onChange={() => {setViewPastEvents(!viewPastEvents)}}
            />
          </div>
        }
      </div>

      <div className="explore-list">
        { 
          viewToggle ? (
            /* Explore Events */
            filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (<EventCard key={event.id} event={event} />))
            ) : (
              <p> No events found </p>
            )
          ) : (
            /* Explore Businesses */
            filteredBusinesses.length > 0 ? (
              filteredBusinesses.map((business) => (<BusinessCard key={business.id} business={business}/>))
            ) : (
              <p> No businesses found </p>
            )
          )
        }
      </div>
    </div>
  );
};

export default Explore;
