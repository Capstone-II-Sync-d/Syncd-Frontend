import React from "react";
import { Link } from "react-router-dom";

const BusinessCard = ({ business }) => {
  if (!business) return null;

  return (
    <Link to={`/business/profile/${business.id}`}>
      <div className="businessCard">
        <img src={business.pictureUrl} className="businessCardPic" />
        <div className="businessCardInfo">
          <h2>{business.name}</h2>
          {business.bio && <p className="businessCardBio">{business.bio}</p>}
        </div>
      </div>
    </Link>
  );
};

export default BusinessCard;
