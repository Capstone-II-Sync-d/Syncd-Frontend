import React from "react";
import { Link } from "react-router-dom";

const FriendsCard = ({ friend }) => {
  return (
    <Link to={`/user/profile/${friend.id}`}>
      <div className="businessCard">
        <img src={friend.profilePicture} className="businessCardPic" />
        <div className="businessCardInfo">
          <h2>
            {friend.firstName} {friend.lastName}
          </h2>
        </div>
      </div>
    </Link>
  );
};

export default FriendsCard;
