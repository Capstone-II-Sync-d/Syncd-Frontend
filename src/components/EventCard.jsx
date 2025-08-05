import React from "react";

const EventCard = ({ event }) => {
  return (
    <div className="event-card">
      <p>{event.title}</p>
    </div>
  );
};

export default EventCard;