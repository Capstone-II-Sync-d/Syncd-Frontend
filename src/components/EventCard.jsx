import React from "react";
import "./EventCardStyles.css";

const EventCard = ({ event }) => {
  if (!event)
    return;

  const start = new Date(event.startTime);
  const startDate = start.toLocaleDateString();
  let startHour = start.getHours();
  if (startHour > 12)
    startHour -= 12;
  const startTime = `${startHour}:${start.getMinutes().toString().padStart(2, '0')} ${start.getHours() > 11 ? "pm" : "am"}`;
  
  const end = new Date(event.endTime);
  let endHour = end.getHours();
  if (endHour > 12)
    endHour -= 12;
  const endDate = end.toLocaleDateString();
  const endTime = `${endHour}:${end.getMinutes().toString().padStart(2, '0')} ${end.getHours() > 11 ? "pm" : "am"}`;
  
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
      { startDate === endDate ? (
        <div className="date">
          <p><strong>Date:</strong> {startDate}</p>
          <p><strong>From:</strong> {startTime}</p>
          <p><strong>To:</strong> {endTime}</p>
        </div>
      ) : (
        <div className="date">
          <p><strong>Date:</strong> {startDate}</p>
          <p><strong>From:</strong> {startTime}</p>
          <p><strong>To:</strong> {endTime}</p>
        </div>
      )}
    </div>
  );
};

export default EventCard;