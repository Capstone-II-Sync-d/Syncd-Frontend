import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { API_URL } from "../shared";
import { AppContext } from "../AppContext";

const Notification = ({ notification }) => {
  const [message, setMessage] = useState("");
  const [read, setRead] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const { user, socket, notifications, setNotifications } = useContext(AppContext);

  if (!user || !notification)
    return;

  const generateRequestMessage = () => {
    const otherUserName = `${notification.otherUser.firstName} (${notification.otherUser.username})`;
    switch (notification.status) {
      case 'accepted':
        return `You and ${otherUserName} are now friends!`;
      case 'declined':
        return `You declined ${otherUserName}'s friend request`;
      case 'removed':
        return `You and ${otherUserName} are no longer friends`;
      default:
        return `${otherUserName} sent you a friend request`;
    }
  };

  const handleReply = async (action) => {
    const info = {
      action,
    };
    try {
      switch (notification.type) {
        case 'blank':
          return;
        case 'request':
          setShowButtons(false);
          info.receiverId = notification.otherUser.id;
          info.friendshipId = notification.friendshipId;
          socket.emit("friend-request", info);
          console.log(`Sending Friend Request Event`, info);
          return;
      }
    } catch (error) {
      console.error(error);
    }
  };

  const markAsRead = async () => {
    if (read)
      return;

    setRead(true);
    notification.read = true;
    try {
      const response = await axios.patch(`${API_URL}/api/notifications/read/${notification.id}`, {}, {
        withCredentials: true,
      });
      console.log(response.data);
    } catch (error) {
      console.error(`Error saving read state for notification: ${error}`);
      setRead(false);
      notification.read = false;
    }
    const index = notifications.findIndex((n) => (n.id === notification.id));
    setNotifications([
      ...(index > 0 ? notifications.slice(0, index) : []),
      notification,
      ...(index < notifications.length - 1 ? notifications.slice(index + 1) : []),
    ]);
  };

  useEffect(() => {
    setRead(notification.read);
    switch (notification.type) {
      case 'blank':
        setMessage("Blank notification");
        return;
      case 'request':
        setShowButtons(notification.status.includes("pending"));
        setMessage(generateRequestMessage());
        return;
    }
  }, []);
  
  return (
    <div 
      className={`notification-item ${notification.read ? '' : 'unread'}`}
      onMouseEnter={markAsRead}
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
