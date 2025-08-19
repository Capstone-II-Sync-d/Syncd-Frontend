import { API_URL } from "../../../shared";

// Generic API call function
const apiCall = async (endpoint, options = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    credentials: "include",
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status}`);
  }

  return response.json();
};

// Authentication API calls
export const authAPI = {
  getMe: () => apiCall("/auth/me"),
  logout: () => apiCall("/auth/logout", { method: "POST" }),
};

// Calendar Items API calls
export const calendarAPI = {
  // Get user's calendar items
  getMyItems: () => apiCall("/api/calendarItems/me"),

  // Create calendar item
  createItem: (itemData) =>
    apiCall("/api/calendarItems/user/item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemData),
    }),

  // Update calendar item
  updateItem: (itemId, itemData) =>
    apiCall(`/api/calendarItems/user/item/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemData),
    }),

  // Delete calendar item
  deleteItem: (itemId) =>
    apiCall(`/api/calendarItems/user/item/${itemId}`, {
      method: "DELETE",
    }),
};

// Events API calls
export const eventsAPI = {
  // Create event from calendar item
  createEvent: (eventData) =>
    apiCall("/api/calendarItems/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData),
    }),

  // Update event (publish/unpublish)
  updateEvent: (eventId, eventData) =>
    apiCall(`/api/calendarItems/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData),
    }),

  // Delete event
  deleteEvent: (eventId) =>
    apiCall(`/api/calendarItems/events/${eventId}`, {
      method: "DELETE",
    }),

  // Get all public events
  getAllEvents: () => apiCall("/api/calendarItems/events"),

  // Get future events
  getFutureEvents: () => apiCall("/api/calendarItems/events/future"),
};

// Business API calls
export const businessAPI = {
  // Create business
  createBusiness: (businessData) =>
    apiCall("/api/profiles/business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(businessData),
    }),
  
  // Get user's businesses
  getMyBusinesses: () => apiCall("/api/profiles/me/businesses"),
};

export default { authAPI, calendarAPI, eventsAPI, businessAPI };