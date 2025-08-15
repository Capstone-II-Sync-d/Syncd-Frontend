import React, { useContext } from "react";
import { AppContext } from "../../AppContext";
import "../Cards/styling/UserCardStyles.css";

// Conversation.js
const Conversation = ({
  friend,
  setUserClicked,
  setShowMessage,
  setRoom,
  showMessage,
  joinMessageRoom,
}) => {
  const { user } = useContext(AppContext);
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

          // Pass the actual values directly, not relying on state
          joinMessageRoom(roomName, user, friend);

          setShowMessage(true);
        }}
      >
        <img src={friend.profilePicture} />
        <h3>{friend.username}</h3>
      </button>
    </div>
  );
};

export default Conversation;
