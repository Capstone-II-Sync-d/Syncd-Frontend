import React from "react";
import "../Cards/styling/UserCardStyles.css";
import { Link } from "react-router-dom";

const UserCard = ({ user }) => {
  return (
    <Link to={`/user/profile/${user.id}`} className="user-card">
      <img src={user.profilePicture} />
      <h3>{user.username}</h3>
    </Link>
  );
};

export default UserCard;
