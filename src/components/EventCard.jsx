import React from "react";
import "./EventCardStyles.css";

const EventCard = ({ event }) => {
  return (
    <div className="event-card">
      <h3 className="event-title">{event.title}</h3>
      <p className="description">{event.description}</p>
      <p className="hostname">
        <strong>Hosted By: </strong>
        {
          event.business ? (
            event.business
          ) : (
            event.creatorUsername
          )
        }
      </p>
      <p className="start-time">
        <strong>Start:</strong> {event.startTime}
      </p>
      <p className="end-time">
        <strong>End:</strong> {event.endTime}
      </p>
    </div>
  );
};

export default EventCard;