import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { API_URL } from "../shared";
import { AppContext } from "../AppContext";

const Notification = ({ notification }) => {
  const [message, setMessage] = useState("");
  const [showButtons, setShowButtons] = useState(false);
  const { user, socket } = useContext(AppContext);

  if (!user || !notification)
    return;

  const generateRequestMessage = () => {
    const otherUserName = `${notification.otherUser.firstName} (${notification.otherUser.username})`;
    if (notification.status === "accepted")
      return `You and ${otherUserName} are now friends!`;
    else
      return `${otherUserName} sent you a friend request`
  };

  const handleReply = async (action) => {
    const info = {
      action
    };
    try {
      switch (notification.type) {
        case 'blank':
          return;
        case 'request':
          info.receiverId = notification.otherUser.id;
          info.friendshipId = notification.friendshipId;
          socket.emit("friend-request", info);
          console.log(`Sending Friend Request Event`, info);
          return;
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    switch (notification.type) {
      case 'blank':
        setMessage("Blank notification");
        return;
      case 'request':
        setShowButtons(notification.status !== "accepted");
        setMessage(generateRequestMessage());
        return;
    }
  }, []);
  
  return (
    <div 
      className={`notification-item ${notification.read ? '' : 'unread'}`}
    >
      <div className="notification-message">
        {message}
      </div>
      { showButtons &&
        <div className="notification-buttons">
          <button
            className="accept-btn"
            onClick={() => {handleReply('accept')}}
          >
            Accept
          </button>
          <button
            className="decline-btn"
            onClick={() => {handleReply('decline')}}
          >
            Decline
          </button>
        </div>
      }
      <div className="notification-time">
        {notification.time}
      </div>
    </div>
  );
};

export default Notification;
