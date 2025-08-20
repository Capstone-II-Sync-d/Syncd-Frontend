import React from "react";

const MessageCard = ({ message, user }) => {
  return (
    <div className="message-card">
      <p>{message.content}</p>
      <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
    </div>
  );
};

export default MessageCard;
