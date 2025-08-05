import axios from "axios";
import React, { useEffect, useState } from "react";
import { API_URL } from "../shared";
import EventCard from "./EventCard";

const Explore = () => {
  const [viewToggle, setViewToggle] = useState(true);
  const [events, setEvents] = useState([]);
  const [businesses, setBusinesses] = useState([]);

  const getEvents = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/calendarItems/events`);
      setEvents(response.data);
      console.log(`Successfully retrieved ${response.data.length} events`);
    } catch (error) {
      console.error("Error getting events:", error);
    }
  };

  const getBusinesses = async () => {

  };

  useEffect(() => {
    getEvents();
  }, []);

  return (
    <div className="explore-container">
      <h1>Explore</h1>

      <div className="explore-list">
        {/* Explore Events */}
        { viewToggle && 
          events.length > 0 ? (
            events.map((event) => (<EventCard event={event} />))
          ) : (
            <p> No events found </p>
          )
        }
      </div>
    </div>
  );
};

export default Explore;