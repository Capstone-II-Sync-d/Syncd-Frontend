import React from "react";
import "../Cards/styling/UserCardStyles.css";
import { Link } from "react-router-dom";

const MessagingCard = ({
  friend,
  user,
  setUserClicked,
  setShowMessage,
  setRoom,
  showMessage,
  joinMessageRoom,
}) => {
  return (
    <div>
      <button
        className="user-card"
        // Update the onClick handler to use the correct user reference
        onClick={(e) => {
          e.preventDefault();
          setUserClicked(friend); // friend is the other user
          const roomName =
            friend.id < user.id
              ? `${friend.id}-${user.id}`
              : `${user.id}-${friend.id}`;
          setRoom(roomName);
          console.log("Friend clicked:", friend, "User:", user);
          console.log(roomName);
          joinMessageRoom(roomName);
          setShowMessage(!showMessage);
        }}
      >
        <img src={friend.profilePicture} />
        <h3>{friend.username}</h3>
      </button>
    </div>
  );
};

export default MessagingCard;
