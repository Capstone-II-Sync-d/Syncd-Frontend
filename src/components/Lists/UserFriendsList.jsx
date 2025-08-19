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
  const [pendingUpdates, setPendingUpdates] = useState([]); // Track optimistic updates

  // -------------------- Checking ownership of profile --------------------
  const isOwner = user && String(user.id) === String(profileId);

  // -------------------- API Calls --------------------
  const getAllFriends = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/profiles/user/${profileId}/friends`,
        { withCredentials: true }
      );
      console.log("Fetched friends:", response.data);
      const validFriends = response.data
        .filter((friend) => friend?.user?.id && friend?.user?.username)
        .map((friend) => friend.user); // Normalize to user objects
      setFriends(validFriends);
      setFilteredFriends(validFriends);
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

    const validFriends = friends.filter(
      (friend) => friend && friend.id && friend.username
    );
    setFilteredFriends(
      validFriends.filter((friend) =>
        friend.username.toLowerCase().includes(query.toLowerCase())
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

  // Listen for live friends list updates via socket
  useEffect(() => {
    if (!socket || !user?.id) {
      console.warn("Socket or user not available - skipping socket setup", {
        socket,
        user,
      });
      return;
    }

    if (!socket.connected) {
      console.error("Socket not connected - cannot listen for updates");
      return;
    }

    // Join profile room to receive updates
    socket.emit("join-profile-room", Number(profileId), (ack) => {
      console.log(
        "Join profile room acknowledgement:",
        ack || "No acknowledgment"
      );
    });

    const handleFriendsListUpdate = (newFriends) => {
      console.log("Received friendsList:", newFriends);
      const validFriends = newFriends.filter(
        (friend) => friend && friend.id && friend.username
      );
      setFriends(validFriends);
      setPendingUpdates([]); // Clear pending updates on authoritative update
    };

    const handleFriendshipUpdate = async (data) => {
      console.log("Received friendship-update:", data);
      const usersInvolved = [Number(data.user1), Number(data.user2)];
      if (
        usersInvolved.includes(Number(user.id)) &&
        Number(profileId) === Number(user.id)
      ) {
        const otherUserId =
          Number(data.user1) === Number(user.id)
            ? Number(data.user2)
            : Number(data.user1);
        try {
          // Fetch user data for optimistic update (to get username)
          const userResponse = await axios.get(
            `${API_URL}/api/profiles/user/${otherUserId}`,
            { withCredentials: true }
          );
          const userData = userResponse.data;

          if (data.action === "accept") {
            // Optimistically add friend
            setPendingUpdates((prev) => [
              ...prev,
              { action: "accept", userId: otherUserId },
            ]);
            setFriends((prev) => [
              ...prev,
              {
                id: otherUserId,
                username: userData.username || `User ${otherUserId}`,
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
              },
            ]);
          } else if (["unfriend", "decline", "cancel"].includes(data.action)) {
            // Optimistically remove friend
            setPendingUpdates((prev) => [
              ...prev,
              { action: data.action, userId: otherUserId },
            ]);
            setFriends((prev) =>
              prev.filter((friend) => friend.id !== otherUserId)
            );
          }
        } catch (error) {
          console.error(
            "Failed to fetch user data for optimistic update:",
            error
          );
        }
      }
    };

    const handleFriendError = ({ action, error }) => {
      console.error("Friend request error:", { action, error });
      // Revert optimistic updates for this action
      setPendingUpdates((prev) => {
        const update = prev.find((u) => u.action === action);
        if (update) {
          if (update.action === "accept") {
            setFriends((prev) =>
              prev.filter((friend) => friend.id !== update.userId)
            );
          } else if (
            ["unfriend", "decline", "cancel"].includes(update.action)
          ) {
            // Re-fetch friends to restore state
            getAllFriends();
          }
        }
        return prev.filter((u) => u.action !== action);
      });
    };

    socket.on("friendsList", handleFriendsListUpdate);
    socket.on("friendship-update", handleFriendshipUpdate);
    socket.on("friend-error", handleFriendError);

    return () => {
      console.log("Cleaning up socket listeners");
      socket.off("friendsList", handleFriendsListUpdate);
      socket.off("friendship-update", handleFriendshipUpdate);
      socket.off("friend-error", handleFriendError);
      socket.emit("leave-profile-room", Number(profileId));
    };
  }, [socket, user?.id, profileId]);

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
            <UserCard key={friend.id} user={friend} />
          ))
        )}
      </div>
    </div>
  );
};

export default UserFriendsList;
