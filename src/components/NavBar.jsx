import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./NavBarStyles.css";
import NotificationsTab from "./NotificationTab";

const NavBar = ({ user, onLogout }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

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
            <NotificationsTab />

            {/* Profile */}
            <div className="profile-container">
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