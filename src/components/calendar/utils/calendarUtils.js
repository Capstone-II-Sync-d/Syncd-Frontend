// Determine calendar category for event
export const determineCalendarId = (item) => {
  console.log(`Determining calendar ID for item ${item.id}:`, {
    hasEvent: !!item.event,
    published: item.event?.published,
    businessId: item.event?.businessId,
    public: item.public
  });

  // Check if this item has an associated event
  if (item.event) {
    // If the event is not published, it's a draft
    if (!item.event.published) {
      return "drafts";
    }
    // If the event has a businessId, it's a business event
    if (item.event.businessId) {
      return "business";
    }
    // If the event has no businessId, it's a user-created event
    return "events";
  }
  // If no event record, it's a personal calendar item
  return "personal";
};

// Check if event spans full day
export const isAllDayEvent = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const timeDiff = endDate - startDate;
  const hoursDiff = timeDiff / (1000 * 60 * 60);

  return hoursDiff >= 24;
};

// Get event color based on type
export const getEventColor = (item) => {
  const calendarId = determineCalendarId(item);

  switch (calendarId) {
    case "personal":
      return "#8b5cf6"; // Purple
    case "business":
      return "#3b82f6"; // Blue
    case "events":
      return "#ec4899"; // Pink
    case "drafts":
      return "#6b7280"; // Gray
    default:
      return "#6b7280"; // Gray
  }
};

// Transform calendar items to TOAST UI format
export const transformCalendarData = (items, calendarVisibility) => {
  console.log("Raw calendar items:", items); // Debug log

  return items.map((item) => {
    const calendarId = determineCalendarId(item);
    console.log(`Item ${item.id}: calendarId = ${calendarId}, event =`, item.event); // Debug log

    return {
      id: item.id.toString(),
      calendarId: calendarId,
      title: item.title,
      body: item.description || "",
      start: new Date(item.start),
      end: new Date(item.end),
      location: item.location || "",
      isAllday: isAllDayEvent(item.start, item.end),
      category: "time",
      isVisible: calendarVisibility[calendarId], // Use current visibility setting
      backgroundColor: getEventColor(item),
      borderColor: getEventColor(item),
      raw: item, // Store original data for reference
    };
  });
};

// Determine if event should be visible based on current filters
export const shouldEventBeVisible = (item, calendarVisibility) => {
  const calendarId = determineCalendarId(item);

  // Check privacy for personal items
  if (calendarId === "personal" && !item.public) {
    return calendarVisibility.personal;
  }

  return calendarVisibility[calendarId];
};

// Calculate event statistics
export const getEventStats = (calendarItems, calendarVisibility) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayEvents = calendarItems.filter((item) => {
    const eventDate = new Date(item.start);
    eventDate.setHours(0, 0, 0, 0);
    return (
      eventDate.getTime() === today.getTime() && 
      shouldEventBeVisible(item, calendarVisibility)
    );
  });

  const totalVisibleEvents = calendarItems.filter(item => 
    shouldEventBeVisible(item, calendarVisibility)
  );

  return {
    total: totalVisibleEvents.length,
    today: todayEvents.length,
  };
};

// Format date for display
export const formatCurrentDate = (date) => {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

// Calendar configuration for TOAST UI
export const getCalendarOptions = () => ({
  defaultView: 'month',
  useFormPopup: false,
  useDetailPopup: false,
  calendars: [
    {
      id: "personal",
      name: "Personal",
      backgroundColor: "#8b5cf6",
      borderColor: "#8b5cf6",
      dragBackgroundColor: "#8b5cf6",
    },
    {
      id: "business",
      name: "Business",
      backgroundColor: "#3b82f6",
      borderColor: "#3b82f6",
      dragBackgroundColor: "#3b82f6",
    },
    {
      id: "events",
      name: "Events",
      backgroundColor: "#ec4899",
      borderColor: "#ec4899",
      dragBackgroundColor: "#ec4899",
    },
    {
      id: "drafts",
      name: "Drafts",
      backgroundColor: "#6b7280",
      borderColor: "#6b7280",
      dragBackgroundColor: "#6b7280",
    },
  ],
  week: {
    startDayOfWeek: 0,
    dayNames: ["S", "M", "T", "W", "T", "F", "S"],
    hourStart: 0,
    hourEnd: 24,
  },
  month: {
    startDayOfWeek: 0,
    dayNames: ["S", "M", "T", "W", "T", "F", "S"],
  },
});