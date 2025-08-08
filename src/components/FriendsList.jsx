import React, { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import axios from "axios";
import "./AuthStyles.css";
import { API_URL } from "../shared";
import FriendsCard from "./FriendsCard";

const FriendsList = ({ socket }) => {
  const { profileId } = useParams();
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const fetchAllFriends = async () => {
      const friends = await axios.get(
        `${API_URL}/api/profiles/user/${profileId}/friends`,
        { withCredentials: true }
      );
      console.log(friends.data);
      setFriends(friends.data);
    };
    fetchAllFriends();
  }, []);

  return (
    <div className="friends-list">
      <div className="search-bar">
        <input type="text" placeholder="Search..." />
      </div>
      <div className="friend-cards">
        {friends.map((friend) => (
          <FriendsCard key={friend.user.id} friend={friend.user} />
        ))}
      </div>
    </div>
  );
};

export default FriendsList;
