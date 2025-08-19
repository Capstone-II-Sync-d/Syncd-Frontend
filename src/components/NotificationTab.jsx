import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../AppContext";
import { API_URL } from "../shared";
import Notification from "./Notification";
import axios from "axios";

const NotificationsTab = ({ notifRef }) => {
  const [show, setShow] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket, notifications, setNotifications } = useContext(AppContext);

  useEffect(() => {
    setUnreadCount(notifications.filter((n) => (
      n.type !== 'blank' && !n.read
    )).length);
  }, [notifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target)
      ) {
        setShow(false);
      }
    };

    if (show)
      document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show]);

  const updateFriendshipNotification = (friendshipId, newStatus) => {
    const index = notifications.findIndex((notification) => (
      notification.friendshipId === friendshipId
    ));
    if (index < 0)
      return;
    
    const notif = notifications[index];
    notif.status = newStatus;
    setNotifications([
      ...(index > 0 ? notifications.slice(0, index) : []),
      notif,
      ...(index < notifications.length - 1 ? notifications.slice(index + 1) : []),
    ]);
  };

  const onRequestReceived = (notif) => {
    setNotifications(prev => [
      notif,
      ...prev,
    ])
  };

  const onAcceptedRequest = (notif) => {
    setNotifications((prev) => ([
      notif,
      ...prev,
    ]));
  };

  const onRequestSuccess = (info) => {
    console.log(`${info.action} request was successful!`);
    updateFriendshipNotification(info.friendshipId, info.newStatus);
  };

  const onRequestFailed = (info) => {
    console.error(info.error);
    updateFriendshipNotification(info.friendshipId, info.status);
  };

  const onFriendshipDeleted = (info) => {
    const index = notifications.findIndex((notif) => (
      notif.friendshipId === info.friendshipId
    ));
    if (index < 0)
      return;

    setNotifications([
      ...(index > 0 ? notifications.slice(0, index) : []),
      ...(index < notifications.length - 1 ? notifications.slice(index + 1) : []),
    ])
  };

  useEffect(() => {
    if (!socket)
      return;

    console.log(`Notifications listening`);
    socket.on("friend-request-received", onRequestReceived);
    socket.on("friend-request-accepted", onAcceptedRequest);
    socket.on("friendship-deleted", onFriendshipDeleted);
    socket.on("friend-request-success", onRequestSuccess);
    socket.on("friendship-error", onRequestFailed);
    
    return () => {
      socket.off("friend-request-received", onRequestReceived);
      socket.off("friend-request-accepted", onAcceptedRequest);
      socket.off("friendship-deleted", onFriendshipDeleted);
      socket.off("friend-request-success", onRequestSuccess);
      socket.off("friendship-error", onRequestFailed);
    };
  }, [notifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target)
      ) {
        setShow(false);
      }
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    };
  }, [show]);

  return (
    <div className="notification-container" ref={notifRef}>
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
            {notifications.filter((notif) => (notif.type !== "blank"))
                          .slice(0, 5)
                          .map((notification) => (
              <Notification
                key={`${notification.id}|${notification.status}`}
                notification={notification}
              />
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
