import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Search, Plus, User, Bell } from 'lucide-react';

const SyncdCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2023, 0, 1)); // January 2023 to match Figma
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Modal states
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showCreateCalendarModal, setShowCreateCalendarModal] = useState(false);
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  
  // Form states
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    description: ''
  });
  
  const [calendarForm, setCalendarForm] = useState({
    name: '',
    description: '',
    color: '#3b82f6'
  });

  // Sample events data
  const sampleEvents = [
    {
      id: '1',
      title: 'Team Meeting',
      start: new Date(2023, 0, 15, 10, 0),
      end: new Date(2023, 0, 15, 11, 0),
      color: '#ff6b6b'
    },
    {
      id: '2',
      title: 'Project Review',
      start: new Date(2023, 0, 20, 14, 0),
      end: new Date(2023, 0, 20, 15, 30),
      color: '#4ecdc4'
    },
    {
      id: '3',
      title: 'Design Workshop',
      start: new Date(2023, 0, 8, 9, 0),
      end: new Date(2023, 0, 8, 12, 0),
      color: '#45b7d1'
    },
    {
      id: '4',
      title: 'Client Call',
      start: new Date(2023, 0, 25, 16, 0),
      end: new Date(2023, 0, 25, 17, 0),
      color: '#96ceb4'
    }
  ];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    const todayFirst = new Date(today.getFullYear(), today.getMonth(), 1);
    setCurrentDate(todayFirst);
  };

  const handleCreateEvent = () => {
    setShowCreateEventModal(true);
  };

  const handleCreateCalendar = () => {
    setShowCreateCalendarModal(true);
  };

  const handleDiscover = () => {
    setShowDiscoverModal(true);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    console.log('Searching for:', query);
    // Add your search logic here
  };

  const handleCreateEventSubmit = (e) => {
    e.preventDefault();
    console.log('Creating event:', eventForm);
    // Add your event creation logic here
    setShowCreateEventModal(false);
    setEventForm({ title: '', date: '', startTime: '', endTime: '', description: '' });
  };

  const handleCreateCalendarSubmit = (e) => {
    e.preventDefault();
    console.log('Creating calendar:', calendarForm);
    // Add your calendar creation logic here
    setShowCreateCalendarModal(false);
    setCalendarForm({ name: '', description: '', color: '#3b82f6' });
  };

  const closeModal = (modalSetter) => {
    modalSetter(false);
  };

  const getEventsForDate = (date) => {
    return sampleEvents.filter(event => 
      event.start.toDateString() === date.toDateString()
    );
  };

  // Inline styles as fallback if Tailwind isn't working
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e7eb',
      padding: '16px 24px'
    },
    headerContent: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      maxWidth: '1280px',
      margin: '0 auto'
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    logoIcon: {
      width: '32px',
      height: '32px',
      background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    logoText: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#111827'
    },
    navButton: {
      padding: '8px 16px',
      backgroundColor: '#f3f4f6',
      color: '#111827',
      borderRadius: '8px',
      border: 'none',
      fontWeight: '500',
      cursor: 'pointer'
    },
    headerControls: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    todayButton: {
      padding: '8px 16px',
      color: '#6b7280',
      background: 'none',
      border: 'none',
      fontWeight: '500',
      cursor: 'pointer'
    },
    monthNav: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    monthButton: {
      padding: '4px',
      background: 'none',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      color: '#6b7280'
    },
    monthText: {
      fontSize: '18px',
      fontWeight: '500',
      color: '#111827',
      minWidth: '140px',
      textAlign: 'center'
    },
    discoverButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      color: '#6b7280',
      background: 'none',
      border: 'none',
      cursor: 'pointer'
    },
    iconButton: {
      padding: '8px',
      background: 'none',
      border: 'none',
      borderRadius: '50%',
      cursor: 'pointer',
      color: '#6b7280'
    },
    mainContainer: {
      display: 'flex',
      maxWidth: '1280px',
      margin: '0 auto',
      height: 'calc(100vh - 80px)', // Fixed height based on header
      minHeight: '800px', // Minimum height
      position: 'relative', // Establish positioning context
      overflow: 'hidden' // Prevent any overflow that could cause size changes
    },
    sidebar: {
      width: '320px',
      backgroundColor: 'white',
      borderRight: '1px solid #e5e7eb',
      padding: '24px',
      flexShrink: 0, // Prevent sidebar from shrinking
      overflowY: 'auto' // Allow scrolling if content is too tall
    },
    sidebarSection: {
      marginBottom: '24px'
    },
    createButton: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '12px 16px',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      marginBottom: '12px',
      fontWeight: '500'
    },
    createSecondaryButton: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '12px 16px',
      backgroundColor: 'white',
      color: '#374151',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '500'
    },
    searchSection: {
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      padding: '16px'
    },
    searchHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '12px'
    },
    searchTitle: {
      fontWeight: '500',
      color: '#111827'
    },
    searchSubtext: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '12px'
    },
    searchInput: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px'
    },
    calendarArea: {
      flex: 1,
      padding: '24px',
      width: 'calc(100% - 320px)', // Fixed width based on sidebar
      minWidth: '800px', // Minimum width to prevent squishing
      maxWidth: '960px', // Maximum width for consistency
      boxSizing: 'border-box' // Include padding in width calculation
    },
    colorBar: {
      height: '8px',
      background: 'linear-gradient(to right, #ef4444, #3b82f6, #8b5cf6, #14b8a6, #22c55e, #eab308)',
      borderRadius: '4px',
      marginBottom: '24px'
    },
    calendarContainer: {
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      overflow: 'hidden',
      width: '100%',
      height: '700px', // Absolutely fixed height
      display: 'flex',
      flexDirection: 'column',
      position: 'relative' // Prevent any external influence
    },
    calendarHeader: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      borderBottom: '1px solid #e5e7eb',
      height: '60px', // Fixed header height
      flexShrink: 0 // Prevent header from shrinking
    },
    dayHeader: {
      textAlign: 'center',
      fontSize: '14px',
      fontWeight: '500',
      color: '#6b7280',
      padding: '16px 8px',
      backgroundColor: '#f9fafb',
      borderRight: '1px solid #f3f4f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    calendarGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gridTemplateRows: 'repeat(6, 1fr)',
      height: '640px', // Fixed grid height (700 - 60 for header)
      flex: 1
    },
    calendarDay: {
      padding: '6px',
      borderRight: '1px solid #f3f4f6',
      borderBottom: '1px solid #f3f4f6',
      cursor: 'pointer',
      backgroundColor: 'white',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '0' // Important: allows flex child to shrink
    },
    dayNumber: {
      fontSize: '14px',
      fontWeight: '500',
      marginBottom: '4px',
      flexShrink: 0 // Prevent day number from shrinking
    },
    eventItem: {
      fontSize: '11px',
      padding: '1px 6px',
      borderRadius: '3px',
      color: 'white',
      marginBottom: '1px',
      fontWeight: '500',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      maxWidth: '100%'
    },
    // Modal styles
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      width: '100%',
      maxWidth: '500px',
      maxHeight: '80vh',
      overflowY: 'auto',
      position: 'relative',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      paddingBottom: '16px',
      borderBottom: '1px solid #e5e7eb'
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#111827'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#6b7280',
      padding: '4px',
      borderRadius: '4px'
    },
    formGroup: {
      marginBottom: '16px'
    },
    label: {
      display: 'block',
      marginBottom: '6px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151'
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      boxSizing: 'border-box'
    },
    textarea: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      minHeight: '80px',
      resize: 'vertical',
      boxSizing: 'border-box'
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      marginTop: '24px'
    },
    cancelButton: {
      padding: '8px 16px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      backgroundColor: 'white',
      color: '#374151',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500'
    },
    submitButton: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '6px',
      backgroundColor: '#3b82f6',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500'
    },
    colorInput: {
      width: '60px',
      height: '40px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      cursor: 'pointer'
    },
    discoverContent: {
      textAlign: 'center',
      padding: '20px'
    },
    discoverText: {
      color: '#6b7280',
      marginBottom: '20px'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <Calendar size={20} color="white" />
            </div>
            <h1 style={styles.logoText}>Sync'd</h1>
            <button style={styles.navButton}>calendar</button>
          </div>

          <div style={styles.headerControls}>
            <button style={styles.todayButton} onClick={goToToday}>
              Today
            </button>
            
            <div style={styles.monthNav}>
              <button style={styles.monthButton} onClick={() => navigateMonth(-1)}>
                <ChevronLeft size={20} />
              </button>
              <span style={styles.monthText}>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <button style={styles.monthButton} onClick={() => navigateMonth(1)}>
                <ChevronRight size={20} />
              </button>
            </div>

            <button style={styles.discoverButton} onClick={handleDiscover}>
              <Search size={16} />
              <span>Discover</span>
            </button>

            <button style={styles.iconButton}>
              <Bell size={20} />
            </button>

            <button style={styles.iconButton}>
              <User size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={styles.mainContainer}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarSection}>
            <button style={styles.createButton} onClick={handleCreateEvent}>
              <Plus size={16} />
              <span>Create Events</span>
            </button>
            
            <button style={styles.createSecondaryButton} onClick={handleCreateCalendar}>
              <Plus size={16} />
              <span>Create Calendars</span>
            </button>
          </div>

          <div style={styles.sidebarSection}>
            <div style={styles.searchSection}>
              <div style={styles.searchHeader}>
                <User size={20} color="#6b7280" />
                <h3 style={styles.searchTitle}>Search For</h3>
              </div>
              <div style={styles.searchSubtext}>
                Friends<br/>/Businesses
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>
        </div>

        {/* Calendar Area */}
        <div style={styles.calendarArea}>
          <div style={styles.colorBar}></div>

          <div style={styles.calendarContainer}>
            <div style={styles.calendarHeader}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} style={styles.dayHeader}>
                  {day}
                </div>
              ))}
            </div>

            <div style={styles.calendarGrid}>
              <CalendarGrid 
                currentDate={currentDate} 
                onDateClick={setSelectedDate}
                selectedDate={selectedDate}
                getEventsForDate={getEventsForDate}
                styles={styles}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateEventModal && (
        <div style={styles.modalOverlay} onClick={() => closeModal(setShowCreateEventModal)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Create New Event</h2>
              <button style={styles.closeButton} onClick={() => closeModal(setShowCreateEventModal)}>
                ×
              </button>
            </div>
            <form onSubmit={handleCreateEventSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Event Title</label>
                <input
                  style={styles.input}
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                  placeholder="Enter event title"
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Date</label>
                <input
                  style={styles.input}
                  type="date"
                  value={eventForm.date}
                  onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                  required
                />
              </div>
              <div style={{display: 'flex', gap: '12px'}}>
                <div style={{...styles.formGroup, flex: 1}}>
                  <label style={styles.label}>Start Time</label>
                  <input
                    style={styles.input}
                    type="time"
                    value={eventForm.startTime}
                    onChange={(e) => setEventForm({...eventForm, startTime: e.target.value})}
                    required
                  />
                </div>
                <div style={{...styles.formGroup, flex: 1}}>
                  <label style={styles.label}>End Time</label>
                  <input
                    style={styles.input}
                    type="time"
                    value={eventForm.endTime}
                    onChange={(e) => setEventForm({...eventForm, endTime: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  style={styles.textarea}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                  placeholder="Event description (optional)"
                />
              </div>
              <div style={styles.buttonGroup}>
                <button type="button" style={styles.cancelButton} onClick={() => closeModal(setShowCreateEventModal)}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitButton}>
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Calendar Modal */}
      {showCreateCalendarModal && (
        <div style={styles.modalOverlay} onClick={() => closeModal(setShowCreateCalendarModal)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Create New Calendar</h2>
              <button style={styles.closeButton} onClick={() => closeModal(setShowCreateCalendarModal)}>
                ×
              </button>
            </div>
            <form onSubmit={handleCreateCalendarSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Calendar Name</label>
                <input
                  style={styles.input}
                  type="text"
                  value={calendarForm.name}
                  onChange={(e) => setCalendarForm({...calendarForm, name: e.target.value})}
                  placeholder="Enter calendar name"
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  style={styles.textarea}
                  value={calendarForm.description}
                  onChange={(e) => setCalendarForm({...calendarForm, description: e.target.value})}
                  placeholder="Calendar description (optional)"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Calendar Color</label>
                <input
                  style={styles.colorInput}
                  type="color"
                  value={calendarForm.color}
                  onChange={(e) => setCalendarForm({...calendarForm, color: e.target.value})}
                />
              </div>
              <div style={styles.buttonGroup}>
                <button type="button" style={styles.cancelButton} onClick={() => closeModal(setShowCreateCalendarModal)}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitButton}>
                  Create Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discover Modal */}
      {showDiscoverModal && (
        <div style={styles.modalOverlay} onClick={() => closeModal(setShowDiscoverModal)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Discover Events & People</h2>
              <button style={styles.closeButton} onClick={() => closeModal(setShowDiscoverModal)}>
                ×
              </button>
            </div>
            <div style={styles.discoverContent}>
              <div style={styles.discoverText}>
                Find events happening around you and connect with friends and businesses.
              </div>
              <div style={styles.formGroup}>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="Search for events, people, or businesses..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <div style={styles.discoverText}>
                Popular categories: Music, Sports, Business, Social, Food & Drink
              </div>
              <div style={styles.buttonGroup}>
                <button style={styles.submitButton} onClick={() => closeModal(setShowDiscoverModal)}>
                  Start Exploring
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Calendar Grid Component with inline styles
const CalendarGrid = ({ currentDate, onDateClick, selectedDate, getEventsForDate, styles }) => {
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startOfMonth.getDay());

  // Always generate exactly 42 days (6 weeks) for consistent layout
  const days = [];
  const date = new Date(startDate);
  
  for (let i = 0; i < 42; i++) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const isSelected = (date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  return (
    <>
      {days.map((day) => {
        const dayEvents = getEventsForDate(day);
        const isCurrentMonthDay = isCurrentMonth(day);
        const isTodayDay = isToday(day);
        const isSelectedDay = isSelected(day);
        
        const dayStyle = {
          ...styles.calendarDay,
          backgroundColor: !isCurrentMonthDay ? '#f9fafb' : isTodayDay ? '#eff6ff' : 'white',
          borderColor: isTodayDay ? '#93c5fd' : isSelectedDay ? '#60a5fa' : '#f3f4f6',
          opacity: !isCurrentMonthDay ? 0.6 : 1 // Dim dates from other months
        };

        const numberStyle = {
          ...styles.dayNumber,
          color: isTodayDay ? '#2563eb' : isCurrentMonthDay ? '#111827' : '#9ca3af'
        };
        
        return (
          <div
            key={`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`} // Better key for consistency
            onClick={() => onDateClick(day)}
            style={dayStyle}
          >
            <div style={numberStyle}>
              {day.getDate()}
            </div>
            
            {/* Events - Only show if current month for cleaner look */}
            {isCurrentMonthDay && (
              <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                overflow: 'hidden',
                minHeight: '0'
              }}>
                {dayEvents.slice(0, 2).map((event) => ( // Show max 2 events to prevent overflow
                  <div
                    key={event.id}
                    style={{
                      ...styles.eventItem,
                      backgroundColor: event.color,
                      flexShrink: 0
                    }}
                    title={`${event.title} - ${event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                  >
                    {event.title}
                  </div>
                ))}
                
                {dayEvents.length > 2 && (
                  <div style={{
                    ...styles.eventItem,
                    backgroundColor: '#e5e7eb',
                    color: '#6b7280',
                    flexShrink: 0
                  }}>
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            )}

            {/* Today indicator */}
            {isTodayDay && (
              <div style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '8px',
                height: '8px',
                backgroundColor: '#2563eb',
                borderRadius: '50%'
              }}></div>
            )}
          </div>
        );
      })}
    </>
  );
};

export default SyncdCalendar;