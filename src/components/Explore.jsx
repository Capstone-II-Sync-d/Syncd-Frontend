import axios from "axios";
import React, { useEffect, useState } from "react";
import { API_URL } from "../shared";
import EventCard from "./EventCard";
import "./ExploreStyles.css";
import BusinessCard from "./BusinessCard";

const Explore = () => {
  const [loading, setLoading] = useState(true);
  const [viewToggle, setViewToggle] = useState(true);
  
  const [events, setEvents] = useState([]);
  const [viewPastEvents, setViewPastEvents] = useState(false);
  const [filteredEvents, setFilteredEvents] = useState([]);
  
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);

  const getEvents = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/calendarItems/events/future`);
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
    try {
      const response = await axios.get(`${API_URL}/api/profiles/businesses`);
      setBusinesses(response.data);
      setFilteredBusinesses(response.data);
      console.log(`Successfully retrieved ${response.data.length} businesses`);
    } catch (error) {
      console.error("Error getting businesses:", error);
    }
  };

  const filterBusinesses = async (e) => {
    const search = e.target.value.toLowerCase();
    setFilteredBusinesses(
      businesses.filter((business) => (
        business.name.toLowerCase().includes(search) ||
        business.bio.toLowerCase().includes(search) ||
        business.owner.toLowerCase().includes(search) ||
        (business.category && business.category.toLowerCase().includes(search))
      ))
    );
  };

  useEffect(() => {
    getEvents();
    getBusinesses();
  }, []);

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
            onChange={(e) => { filterEvents(e); filterBusinesses(e); }}
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
