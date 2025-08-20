import React from "react";
import { Link } from "react-router-dom";
import "../Cards/styling/BusinessCardStyle.css";

const BusinessCard = ({ business }) => {
  if (!business) return null;

  return (
    <Link to={`/business/profile/${business.id}`} className="business-card">
      <div className="header">
        <img 
          src={business.pictureUrl || business.icon || '/default-business.png'} 
          className="icon" 
          alt={business.name}
          onError={(e) => {
            e.target.src = '/default-business.png';
          }}
        />
        <div className="business-title">
          <h2>{business.name}</h2>
          {business.category && (
            <span className="category">{business.category}</span>
          )}
        </div>
      </div>
      <div className="info">
        {business.owner && (
          <p>
            <strong>👤 Owner:</strong> {business.owner}
          </p>
        )}
        {business.location && (
          <p>
            <strong>📍 Location:</strong> {business.location}
          </p>
        )}
        {business.bio && (
          <p className="bio">{business.bio}</p>
        )}
      </div>
      <div className="business-indicator">
        🏢
      </div>
    </Link>
  );
};

export default BusinessCard;
