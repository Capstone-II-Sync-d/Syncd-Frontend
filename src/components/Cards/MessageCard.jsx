import React from "react";
import "../Cards/styling/UserCardStyles.css";
import { Link } from "react-router-dom";

const MessageCard = ({ message, user }) => {
  return (
    <div className="message-card">
      <p>{message.content}</p>
      <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
    </div>
  );
};

export default MessageCard;
