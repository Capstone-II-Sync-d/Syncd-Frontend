import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import "./NavBarStyles.css";

const NavBar = ({ user, onLogout }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current && 
        !profileRef.current.contains(event.target)
      ) {
        setShowProfileDropdown(false);
      }
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    if (showProfileDropdown || showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileDropdown, showNotifications]);

  // Mock notifications 
  const notifications = [
    { id: 1, message: "New event invitation from Sarah", time: "5 min ago", unread: true },
    { id: 2, message: "Coffee meeting reminder", time: "1 hour ago", unread: true },
    { id: 3, message: "Weekly team sync tomorrow", time: "2 hours ago", unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <nav className="navbar">
      {/* Left side - Brand */}
      <div className="nav-brand">
        <Link to="/" className="brand-link">
          <span className="brand-name">Sync'd</span>
        </Link>
      </div>

      {/* Center - Empty for now */}
      <div className="nav-center">
        {/* Navigation controls moved to calendar */}
      </div>

      {/* Right side - User actions */}
      <div className="nav-right">
        {user ? (
          <>
            {/* Search */}
            <button className="nav-action-btn">
              <span className="search-icon">🔍</span>
            </button>

            {/* Discover/Explore */}
            <Link to="/discover" className="nav-action-btn discover-btn">
              <span className="discover-icon">✨</span>
              <span className="discover-text">Discover</span>
            </Link>

            {/* Notifications */}
            <div className="notification-container" ref={notifRef}>
              <button 
                className="nav-action-btn notification-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <span className="notification-icon">🔔</span>
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>
              
              {showNotifications && (
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

            {/* Profile */}
            <div className="profile-container" ref={profileRef}>
              <button
                className="profile-btn"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                <img 
                  src={user.profilePicture || '/default-avatar.png'} 
                  alt={user.username}
                  className="profile-avatar"
                />
              </button>
              
              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <div className="profile-info">
                    <img 
                      src={user.profilePicture || '/default-avatar.png'} 
                      alt={user.username}
                      className="dropdown-avatar"
                    />
                    <div className="user-details">
                      <div className="user-name">{user.firstName} {user.lastName}</div>
                      <div className="user-email">@{user.username}</div>
                    </div>
                  </div>
                  
                  <div className="profile-menu">
                    <Link to="/profile" className="profile-menu-item">
                      👤 My Profile
                    </Link>
                    <Link to="/settings" className="profile-menu-item">
                      ⚙️ Settings
                    </Link>
                    <Link to="/friends" className="profile-menu-item">
                      👥 Friends
                    </Link>
                    <Link to="/businesses" className="profile-menu-item">
                      🏢 My Businesses
                    </Link>
                    <hr className="menu-divider" />
                    <button onClick={onLogout} className="profile-menu-item logout">
                      🚪 Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="auth-links">
            <Link to="/login" className="auth-btn login-btn">
              Login
            </Link>
            <Link to="/signup" className="auth-btn signup-btn">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;