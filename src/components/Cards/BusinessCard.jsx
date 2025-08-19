import React from "react";
import { Link } from "react-router-dom";
import "../Cards/styling/BusinessCardStyle.css";

const BusinessCard = ({ business }) => {
  if (!business) return null;

  return (
    <Link to={`/business/profile/${business.id}`} className="business-card">
      <div className="header">
        <img src={business.pictureUrl || business.icon} className="icon" alt={business.name} />
        <h2>{business.name}</h2>
      </div>
      <div className="info">
        {business.owner && (
          <p>
            <strong>Owner:</strong> {business.owner}
          </p>
        )}
        <p className="bio">{business.bio}</p>
      </div>
    </Link>
  );
};

export default BusinessCard;
