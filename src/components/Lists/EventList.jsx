import React from "react";
import EventCard from "../Cards/EventCard";

const EventList = ({ events }) => {
  return events.length > 0 ? (
    events.map((event) => <EventCard key={event.id} event={event} />)
  ) : (
    <p> No events found </p>
  );
};

export default EventList;
