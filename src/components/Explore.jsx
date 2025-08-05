import axios from "axios";
import React, { useEffect, useState } from "react";
import { API_URL } from "../shared";
import EventCard from "./EventCard";
import "./ExploreStyles.css";

const Explore = () => {
  const [loading, setLoading] = useState(true);
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

    setLoading(false);
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

      <div className="explore-list">
        {/* Explore Events */}
        { viewToggle && 
          events.length > 0 ? (
            events.map((event) => (<EventCard key={event.id} event={event} />))
          ) : (
            <p> No events found </p>
          )
        }
      </div>
    </div>
  );
};

export default Explore;
