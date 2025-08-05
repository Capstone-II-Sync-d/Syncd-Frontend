import axios from "axios";
import React, { useEffect, useState } from "react";
import { API_URL } from "../shared";
import EventCard from "./EventCard";
import "./ExploreStyles.css";

const Explore = () => {
  const [loading, setLoading] = useState(true);
  const [viewToggle, setViewToggle] = useState(true);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);

  const getEvents = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/calendarItems/events`);
      setEvents(response.data);
      setFilteredEvents(response.data);
      console.log(`Successfully retrieved ${response.data.length} events`);
    } catch (error) {
      console.error("Error getting events:", error);
    }

    setLoading(false);
  };

  const filterEvents = async (e) => {
    const search = e.target.value.toLowerCase();
    setFilteredEvents(
      events.filter((event) => (
        event.title.toLowerCase().includes(search) ||
        event.description.toLowerCase().includes(search) ||
        (event.business ?
        event.business.toLowerCase().includes(search) :
        event.creatorUsername.toLowerCase().includes(search))
      ))
    );
  };

  const getBusinesses = async () => {

  };

  useEffect(() => {
    getEvents();
  }, []);

  if (loading)
    return <p>Loading...</p>

  return (
    <div className="explore-container">
      <h1>Explore</h1>

      <div className="search-bar">
        <label htmlFor="search-bar">Search: </label>
        <input 
          type="text"
          id="search-bar"
          onChange={filterEvents}
        />
      </div>

      <div className="explore-list">
        {/* Explore Events */}
        { viewToggle && 
          filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (<EventCard key={event.id} event={event} />))
          ) : (
            <p> No events found </p>
          )
        }
      </div>
    </div>
  );
};

export default Explore;
