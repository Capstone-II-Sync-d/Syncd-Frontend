import React, { useContext, useState } from "react";
import { AppContext } from "../AppContext";

const NotificationsTab = () => {
  const [show, setShow] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const { notifications } = useContext(AppContext);

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
            {notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`notification-item ${notification.unread ? 'unread' : ''}`}
              >
                <div className="notification-message">
                  {notification.message}
                </div>
                <div className="notification-time">
                  {notification.time}
                </div>
              </div>
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
