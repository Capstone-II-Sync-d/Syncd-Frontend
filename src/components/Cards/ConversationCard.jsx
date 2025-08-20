import React, { useContext } from "react";
import { AppContext } from "../../AppContext";
import "../Cards/styling/UserCardStyles.css";

const Conversation = ({
  friend,
  setUserClicked,
  setShowMessage,
  setRoom,
  joinMessageRoom,
  setShowConversation,
}) => {
  const { user } = useContext(AppContext);

  const handleClick = () => {
    const roomName =
      friend.id < user.id
        ? `${friend.id}-${user.id}`
        : `${user.id}-${friend.id}`;

    setUserClicked(friend);
    setRoom(roomName);
    joinMessageRoom(roomName, user, friend);
    setShowMessage(true);
    setShowConversation(false); // Close the friends list when opening a chat
  };

  return (
    <button className="user-card" onClick={handleClick}>
      <img src={friend.profilePicture} alt={friend.username} />
      <h3>{friend.username}</h3>
    </button>
  );
};

export default Conversation;
