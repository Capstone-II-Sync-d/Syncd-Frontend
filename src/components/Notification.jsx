import axios from "axios";
import React, { useEffect, useState } from "react";
import { API_URL } from "../shared";

const Notification = ({ notification }) => {
  const [message, setMessage] = useState("");
  const [showButtons, setShowButtons] = useState(false);

  const generateRequestMessage = (notif) => {
    const otherUserName = `${notif.otherUser.firstName} (${notif.otherUser.username})`;
    if (notif.status === "accepted")
      return `You and ${otherUserName} are now friends!`;

    else
      return `${otherUserName} sent you a friend request`
  };

  const handleReply = async (status) => {
    const info = { status };
    try {
      switch (notification.type) {
        case 'blank':
          return;
        case 'request':
          info.friendshipId = notification.friendshipId;
          const response = await axios.patch(`${API_URL}/api/`, info, {withCredentials: true});
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
        setMessage(generateRequestMessage(notification));
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
          <button onClick={() => {handleReply('accepted')}}>Accept</button>
          <button onClick={() => {handleReply('declined')}}>Decline</button>
        </div>
      }
      <div className="notification-time">
        {notification.time}
      </div>
    </div>
  );
};

export default Notification;
