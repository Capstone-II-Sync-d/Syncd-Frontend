import React from "react";
import "../Cards/styling/UserCardStyles.css";
import { Link } from "react-router-dom";

const UserCard = ({ user }) => {
  return (
    <Link to={`/user/profile/${user.id}`} className="user-card">
      <img 
        src={user.profilePicture || '/default-avatar.png'} 
        alt={`${user.username}'s profile`}
        onError={(e) => {
          e.target.src = '/default-avatar.png';
        }}
      />
      <div className="user-info">
        <h3>{user.username}</h3>
        {(user.firstName || user.lastName) && (
          <p className="full-name">
            {user.firstName} {user.lastName}
          </p>
        )}
      </div>
    </Link>
  );
};

export default UserCard;
