import axios from "axios";
import React, { useEffect, useState } from "react";
import { API_URL } from "../shared";

const Explore = () => {
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
      <p>Explore page</p>
    </div>
  );
};

export default Explore;