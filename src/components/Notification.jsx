import React, { useEffect, useState } from "react";

const Notification = ({ notification }) => {
  const [message, setMessage] = useState("");

  const generateRequestMessage = (notif) => {
    const otherUserName = `${notif.otherUser.firstName} (${notif.otherUser.username})`;
    if (notif.status === "accepted")
      return `You and ${otherUserName} are now friends!`;

    else
      return `${otherUserName} sent you a friend request`
  };

  useEffect(() => {
    switch (notification.type) {
      case 'blank':
        setMessage("Blank notification");
        return;
      case 'request':
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
      <div className="notification-time">
        {notification.time}
      </div>
    </div>
  );
};

export default Notification;
