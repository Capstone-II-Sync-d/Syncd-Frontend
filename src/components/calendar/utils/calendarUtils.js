// Nature-inspired color palette
const COLORS = {
  SOFT_LICHEN: "#C8D3C5",
  GLACIAL_DRIFT: "#A8B8C8",
  FOREST_LIGHT: "#E8E8D8",
  RIDGE_MOSS: "#7A8A6B",
  WORN_TRAIL: "#C8B5A0",
  PINE_SHADOW: "#5A7A6B",
  TEXT_MUTED: "#8A9B87",
};

// Determine calendar category for event
export const determineCalendarId = (item) => {
  console.log(`Determining calendar ID for item ${item.id}:`, {
    hasEvent: !!item.event,
    published: item.event?.published,
    businessId: item.event?.businessId,
    public: item.public,
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

// Get event color based on type with nature palette
export const getEventColor = (item) => {
  const calendarId = determineCalendarId(item);

  switch (calendarId) {
    case "personal":
      return COLORS.SOFT_LICHEN; // Soft sage green for personal items
    case "business":
      return COLORS.GLACIAL_DRIFT; // Cool blue-gray for business
    case "events":
      return COLORS.WORN_TRAIL; // Warm beige for public events
    case "drafts":
      return COLORS.TEXT_MUTED; // Muted gray for drafts
    default:
      return COLORS.TEXT_MUTED;
  }
};

// Get darker shade for borders
export const getEventBorderColor = (item) => {
  const calendarId = determineCalendarId(item);

  switch (calendarId) {
    case "personal":
      return COLORS.RIDGE_MOSS; // Darker green for personal items
    case "business":
      return COLORS.PINE_SHADOW; // Dark teal for business
    case "events":
      return COLORS.RIDGE_MOSS; // Darker green for events
    case "drafts":
      return COLORS.TEXT_MUTED; // Same gray for drafts
    default:
      return COLORS.TEXT_MUTED;
  }
};

// Transform calendar items to TOAST UI format
export const transformCalendarData = (items, calendarVisibility) => {
  console.log("Raw calendar items:", items); // Debug log

  return items.map((item) => {
    const calendarId = determineCalendarId(item);
    console.log(
      `Item ${item.id}: calendarId = ${calendarId}, event =`,
      item.event
    ); // Debug log

    const backgroundColor = getEventColor(item);
    const borderColor = getEventBorderColor(item);

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
      backgroundColor: backgroundColor,
      borderColor: borderColor,
      color: "#FFFFFF", // White text for better contrast
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

  const totalVisibleEvents = calendarItems.filter((item) =>
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

// Calendar configuration for TOAST UI with nature colors
export const getCalendarOptions = () => ({
  defaultView: "month",
  useFormPopup: false,
  useDetailPopup: false,
  calendars: [
    {
      id: "personal",
      name: "Personal",
      backgroundColor: COLORS.SOFT_LICHEN,
      borderColor: COLORS.RIDGE_MOSS,
      dragBackgroundColor: COLORS.SOFT_LICHEN,
      color: "#FFFFFF",
    },
    {
      id: "business",
      name: "Business",
      backgroundColor: COLORS.GLACIAL_DRIFT,
      borderColor: COLORS.PINE_SHADOW,
      dragBackgroundColor: COLORS.GLACIAL_DRIFT,
      color: "#FFFFFF",
    },
    {
      id: "events",
      name: "Events",
      backgroundColor: COLORS.WORN_TRAIL,
      borderColor: COLORS.RIDGE_MOSS,
      dragBackgroundColor: COLORS.WORN_TRAIL,
      color: "#FFFFFF",
    },
    {
      id: "drafts",
      name: "Drafts",
      backgroundColor: COLORS.TEXT_MUTED,
      borderColor: COLORS.TEXT_MUTED,
      dragBackgroundColor: COLORS.TEXT_MUTED,
      color: "#FFFFFF",
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
  theme: {
    common: {
      backgroundColor: "#FFFFFF",
      border: `1px solid ${COLORS.FOREST_LIGHT}`,
      gridSelection: {
        backgroundColor: COLORS.FOREST_LIGHT,
        border: `1px solid ${COLORS.SOFT_LICHEN}`,
      },
    },
    week: {
      today: {
        backgroundColor: COLORS.FOREST_LIGHT,
      },
      pastTime: {
        color: COLORS.TEXT_MUTED,
      },
    },
    month: {
      dayName: {
        backgroundColor: COLORS.FOREST_LIGHT,
        borderLeft: `1px solid ${COLORS.SOFT_LICHEN}`,
        color: COLORS.RIDGE_MOSS,
      },
      holidayExceptThisMonth: {
        color: COLORS.TEXT_MUTED,
      },
      dayExceptThisMonth: {
        color: COLORS.TEXT_MUTED,
      },
      weekend: {
        backgroundColor: COLORS.FOREST_LIGHT,
      },
    },
  },
});
