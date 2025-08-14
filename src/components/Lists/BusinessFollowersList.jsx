import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../shared";
import UserCard from "../Cards/UserCard";

const BusinessFollowers = ({ socket, user }) => {
  // -------------------- State --------------------
  const { businessId } = useParams();
  const [query, setQuery] = useState("");
  const [followers, setFollowers] = useState([]);
  const [filteredFollowers, setFilteredFollowers] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  // -------------------- Socket: live followers count --------------------
  useEffect(() => {
    if (!socket || !businessId) return;

    // Join business room for live updates
    socket.emit("join-business-room", businessId);

    // Listen for live follower count updates
    socket.on("followers/amount", (count) => {
      setFollowersCount(count);
    });

    // Listen for follow/unfollow updates
    socket.on("follow-status", (data) => {
      if (data.success) {
        // Refresh followers list when follow status changes
        getAllFollowers();
      }
    });

    return () => {
      socket.off("followers/amount");
      socket.off("follow-status");
    };
  }, [socket, businessId]);

  // -------------------- Check if the person viewing the business followers is the owner --------------------
  const checkBusinessOwnership = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/businesses/${businessId}`
      );
      if (user && response.data.ownerId === user.id) {
        setIsOwner(true);
      }
    } catch (error) {
      console.error("Error checking business ownership:", error);
    }
  };

  const getAllFollowers = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/profiles/business/${businessId}/followers`,
        { withCredentials: true }
      );
      setFollowers(response.data);
      setFilteredFollowers(response.data);
      setFollowersCount(response.data.length);
    } catch (error) {
      console.error("Error fetching followers:", error);
      setFollowers([]);
      setFilteredFollowers([]);
      setFollowersCount(0);
    }
  };

  // -------------------- Filtering Logic --------------------
  const filterFollowers = () => {
    if (followers.length === 0) {
      setFilteredFollowers([]);
      return;
    }

    setFilteredFollowers(
      followers.filter(
        (follower) =>
          follower.user &&
          follower.user.username &&
          follower.user.username.toLowerCase().includes(query.toLowerCase())
      )
    );
  };

  // -------------------- Effects --------------------
  // Check ownership when businessId or user changes
  useEffect(() => {
    checkBusinessOwnership();
  }, [businessId, user]);

  // Filter followers when query or followers list changes
  useEffect(() => {
    filterFollowers();
  }, [query, followers]);

  // Fetch followers when businessId changes
  useEffect(() => {
    getAllFollowers();
  }, [businessId]);

  // -------------------- Render --------------------
  return (
    <div className="followers-list">
      {/* Header with count */}
      <div className="followers-header">
        <h3>Followers ({followersCount})</h3>
      </div>

      {/* Search Bar */}
      <div className="search">
        <input
          type="text"
          id="search-bar"
          placeholder="Search followers..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Follower Cards */}
      <div className="follower-cards">
        {filteredFollowers.length === 0 ? (
          followers.length === 0 ? (
            <p className="no-results">
              {isOwner
                ? "Your business has no followers yet"
                : "This business has no followers yet"}
            </p>
          ) : (
            <p className="no-results">No followers match your search</p>
          )
        ) : (
          filteredFollowers.map((follower) => (
            <UserCard key={follower.user.id} user={follower.user} />
          ))
        )}
      </div>
    </div>
  );
};

export default BusinessFollowers;
