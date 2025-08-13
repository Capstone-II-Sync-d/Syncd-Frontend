import React, { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../shared";
import UserCard from "../Cards/UserCard";

const UserFriendsList = ({ socket, user }) => {
  // -------------------- State --------------------
  const { profileId } = useParams();
  const [query, setQuery] = useState("");
  const [friends, setFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);

  // -------------------- Checking ownership of profile --------------------
  //Used for conditionals of things displayed for if there are no friends with that specific user
  const isOwner = user && String(user.id) === String(profileId);

  // -------------------- API Calls --------------------
  const getAllFriends = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/profiles/user/${profileId}/friends`,
        { withCredentials: true }
      );
      setFriends(response.data);
      setFilteredFriends(response.data);
    } catch (error) {
      console.error("Error fetching friends:", error);
      setFriends([]);
      setFilteredFriends([]);
    }
  };

  // -------------------- Filtering Logic --------------------
  const filterFriends = () => {
    if (friends.length === 0) {
      setFilteredFriends([]);
      return;
    }

    setFilteredFriends(
      friends.filter(
        (friend) =>
          friend.user &&
          friend.user.username &&
          friend.user.username.toLowerCase().includes(query.toLowerCase())
      )
    );
  };

  // -------------------- Effects --------------------
  // Filter friends when query or friends list changes
  useEffect(() => {
    filterFriends();
  }, [query, friends]);

  // Fetch friends when profileId changes
  useEffect(() => {
    getAllFriends();
  }, [profileId]);

  // -------------------- Render --------------------
  return (
    <div className="friends-list">
      {/* Search Bar */}
      <div className="search">
        <input
          type="text"
          id="search-bar"
          placeholder="Search friends..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Friend Cards */}
      <div className="friend-cards">
        {filteredFriends.length === 0 ? (
          friends.length === 0 ? (
            <p className="no-results">
              {isOwner
                ? "You have no friends yet"
                : "This user has no friends yet"}
            </p>
          ) : (
            <p className="no-results">No friends match your search</p>
          )
        ) : (
          filteredFriends.map((friend) => (
            <UserCard key={friend.user.id} user={friend.user} />
          ))
        )}
      </div>
    </div>
  );
};

export default UserFriendsList;
