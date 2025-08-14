import React, { useEffect, useState } from "react";

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
          <button>Accept</button>
          <button>Decline</button>
        </div>
      }
      <div className="notification-time">
        {notification.time}
      </div>
    </div>
  );
};

export default Notification;
