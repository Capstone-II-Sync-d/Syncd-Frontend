import React from "react";
import "../Cards/styling/UserCardStyles.css";
import { Link } from "react-router-dom";

const Conversation = ({
  friend,
  user,
  setUserClicked,
  setShowMessage,
  setRoom,
  showMessage,
  joinMessageRoom,
  sortingMessages,
}) => {
  return (
    <div>
      <button
        className="user-card"
        onClick={(e) => {
          e.preventDefault();
          setUserClicked(friend);
          const roomName =
            friend.id < user.id
              ? `${friend.id}-${user.id}`
              : `${user.id}-${friend.id}`;
          setRoom(roomName);
          joinMessageRoom(roomName, user, friend);
          setShowMessage(!showMessage);
          sortingMessages(friend.id, user.id);
        }}
      >
        <img src={friend.profilePicture} />
        <h3>{friend.username}</h3>
      </button>
    </div>
  );
};

export default Conversation;
