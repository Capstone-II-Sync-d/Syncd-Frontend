import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../shared";
import BusinessCard from "../Cards/BusinessCard";

const UserFollowing = ({ user }) => {
  const { profileId } = useParams();

  // -------------------- State --------------------
  const [query, setQuery] = useState("");
  const [followingBusinesses, setFollowingBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);

  // -------------------- Logic --------------------
  const isOwner = user && String(user.id) === String(profileId);

  // -------------------- Fetching Businesse User Is Following --------------------
  const getFollowingBusinesses = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/profiles/user/${profileId}/following`,
        { withCredentials: true }
      );
      setFollowingBusinesses(res.data);
      setFilteredBusinesses(res.data);
    } catch (error) {
      console.error("Error fetching following businesses:", error);
    }
  };

  // -------------------- Business Filtering Logic --------------------
  const filterBusinesses = () => {
    if (followingBusinesses.length === 0) {
      setFilteredBusinesses([]);
      return;
    }

    setFilteredBusinesses(
      followingBusinesses.filter(
        (business) =>
          business.business &&
          business.business.name &&
          business.business.name.toLowerCase().includes(query.toLowerCase())
      )
    );
  };

  // -------------------- Effects --------------------
  // Filter businesses when query or following list changes
  useEffect(() => {
    filterBusinesses();
  }, [query, followingBusinesses]);

  // Fetch following businesses when profileId changes
  useEffect(() => {
    getFollowingBusinesses();
  }, [profileId]);

  // -------------------- Render --------------------
  return (
    <div className="following-businesses-list">
      {/* Search Bar */}
      <div className="search">
        <input
          type="text"
          placeholder="Search followed businesses..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Business Cards */}
      <div className="business-cards">
        {filteredBusinesses.length === 0 ? (
          followingBusinesses.length === 0 ? (
            <p className="no-results">
              {isOwner
                ? "You're not following any businesses"
                : "This user isn't following any businesses"}
            </p>
          ) : (
            <p className="no-results">No businesses match your search</p>
          )
        ) : (
          filteredBusinesses.map((business) => (
            <BusinessCard
              key={business.business.id}
              business={business.business}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default UserFollowing;
