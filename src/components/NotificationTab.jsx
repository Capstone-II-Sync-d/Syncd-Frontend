import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../AppContext";
import Notification from "./Notification";

const NotificationsTab = () => {
  const [show, setShow] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { notifications } = useContext(AppContext);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  return (
    <div className="notification-container">
      <button 
        className="nav-action-btn notification-btn"
        onClick={() => setShow(!show)}
      >
        <span className="notification-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>
      
      {show && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
          </div>
          <div className="notification-list">
            {notifications.slice(0, 5).map(notification => (
              <Notification key={notification.id} notification={notification} />
            ))}
          </div>
          <div className="notification-footer">
            <button className="view-all-btn">View All</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsTab;
