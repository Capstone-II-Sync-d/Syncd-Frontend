import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../shared";
import BusinessCard from "../Cards/BusinessCard";
import "./styling/MyBusinessesListStyle.css";

const MyBusinessesList = ({ user }) => {
  // -------------------- State --------------------
  const [query, setQuery] = useState("");
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);

  // -------------------- Fetching all businesses owned by user --------------------
  const getMyBusinesses = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/profiles/me/businesses`,
        { withCredentials: true }
      );
      setBusinesses(response.data || []);
    } catch (error) {
      console.error("Error fetching businesses:", error);
      setBusinesses([]);
    }
  };

  // -------------------- Business Filtering logic for search bar --------------------
  const filterBusinesses = () => {
    if (businesses.length === 0) {
      setFilteredBusinesses([]);
      return;
    }

    setFilteredBusinesses(
      businesses.filter(
        (business) =>
          business &&
          business.name &&
          business.name.toLowerCase().includes(query.toLowerCase())
      )
    );
  };

  // -------------------- Effects --------------------
  // Filter businesses when query or businesses list changes
  useEffect(() => {
    filterBusinesses();
  }, [query, businesses]);

  // Fetch businesses when user changes
  useEffect(() => {
    getMyBusinesses();
  }, [user]);

  // -------------------- Render --------------------
  return (
    <div className="following-businesses-list">
      {/* Search Bar */}
      <div className="search">
        <input
          type="text"
          placeholder="Search your businesses..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Business Cards */}
      <div className="business-cards">
        {filteredBusinesses.length === 0 ? (
          businesses.length === 0 ? (
            <p className="no-results">You don't own any businesses yet</p>
          ) : (
            <p className="no-results">No businesses match your search</p>
          )
        ) : (
          filteredBusinesses.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))
        )}
      </div>
    </div>
  );
};

export default MyBusinessesList;
