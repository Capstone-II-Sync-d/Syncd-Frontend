import React, { useRef, useEffect, useState } from 'react';
import Calendar from '@toast-ui/react-calendar';
import '@toast-ui/calendar/dist/toastui-calendar.min.css';

const CalendarComponent = ({ userId, userCalendarItems = [] }) => {
  const calendarRef = useRef();
  const [events, setEvents] = useState([]);
  const [calendars, setCalendars] = useState([]);

  // Debug: Log what we're receiving
  console.log('📅 CalendarComponent received:', { 
    userId, 
    userCalendarItems, 
    userCalendarItemsCount: userCalendarItems.length 
  });

  // Define your calendar categories (moved outside useEffect)
  const defaultCalendars = [
    {
      id: 'personal',
      name: 'Personal',
      backgroundColor: '#9e5fff',
      borderColor: '#9e5fff',
      dragBackgroundColor: '#9e5fff',
      color: '#ffffff'
    },
    {
      id: 'business',
      name: 'Business Events',
      backgroundColor: '#00a9ff',
      borderColor: '#00a9ff',
      dragBackgroundColor: '#00a9ff',
      color: '#ffffff'
    },
    {
      id: 'friends',
      name: 'Friends',
      backgroundColor: '#ff5583',
      borderColor: '#ff5583',
      dragBackgroundColor: '#ff5583',
      color: '#ffffff'
    }
  ];

  // Set calendars on mount
  useEffect(() => {
    console.log('📅 Setting calendars:', defaultCalendars);
    setCalendars(defaultCalendars);
  }, []);

  // Transform your calendar items to Toast UI format
  useEffect(() => {
    console.log('📅 Processing calendar items:', userCalendarItems);
    
    if (userCalendarItems && userCalendarItems.length > 0) {
      const transformedEvents = userCalendarItems.map(item => {
        console.log('📅 Processing item:', item);
        
        // Determine calendar ID based on item type
        let calendarId = 'personal';
        if (item.businessId) {
          calendarId = 'business';
        } else if (item.itemType === 'event') {
          calendarId = 'friends';
        }

        const event = {
          id: item.id.toString(),
          calendarId: calendarId,
          title: item.title || 'Untitled Event',
          category: 'time', // 'time', 'allday', 'milestone', or 'task'
          start: new Date(item.start),
          end: new Date(item.end),
          location: item.location || '',
          body: item.description || '',
          isReadOnly: false,
          raw: item // Keep original data for reference
        };
        
        console.log('📅 Transformed event:', event);
        return event;
      });
      
      console.log('📅 All transformed events:', transformedEvents);
      setEvents(transformedEvents);
    } else {
      console.log('📅 No calendar items found, using sample data');
      // Add sample events for testing
      const sampleEvents = [
        {
          id: 'sample1',
          calendarId: 'personal',
          title: 'Sample Personal Event',
          category: 'time',
          start: new Date(),
          end: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
          body: 'This is a sample event to test the calendar'
        },
        {
          id: 'sample2',
          calendarId: 'business',
          title: 'Sample Business Event',
          category: 'time',
          start: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // Tomorrow + 1 hour
          body: 'This is another sample event'
        }
      ];
      setEvents(sampleEvents);
    }
  }, [userCalendarItems]);

  // Event handlers
  const onSelectDateTime = (selectInfo) => {
    console.log('📅 Selected date/time:', selectInfo);
    // You can open a modal here to create a new event
  };

  const onClickEvent = (eventInfo) => {
    console.log('📅 Clicked event:', eventInfo.event);
    // You can open event details modal here
  };

  const onUpdateEvent = (eventInfo) => {
    console.log('📅 Updated event:', eventInfo);
    // Handle event updates (drag & drop, resize)
  };

  const onDeleteEvent = (eventInfo) => {
    console.log('📅 Deleted event:', eventInfo);
    // Handle event deletion
  };

  const [currentDate, setCurrentDate] = useState(new Date());

  // Format current date for display
  const formatCurrentDate = () => {
    return currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Navigation methods
  const goToToday = () => {
    const calendarInstance = calendarRef.current?.getInstance();
    const today = new Date();
    calendarInstance?.today();
    setCurrentDate(today);
  };

  const goToPrev = () => {
    const calendarInstance = calendarRef.current?.getInstance();
    calendarInstance?.prev();
    // Update current date for previous month
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const calendarInstance = calendarRef.current?.getInstance();
    calendarInstance?.next();
    // Update current date for next month
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const changeView = (view) => {
    const calendarInstance = calendarRef.current?.getInstance();
    calendarInstance?.changeView(view);
  };

  return (
    <div className="calendar-container">
      {/* Calendar Header with Date and Navigation */}
      <div className="calendar-header" style={{ 
        marginBottom: '20px', 
        padding: '20px',
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #e0e0e0'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          {/* Date Display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: '24px', 
              fontWeight: '600',
              color: '#1a1a1a'
            }}>
              {formatCurrentDate()}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                onClick={goToPrev} 
                style={{ 
                  padding: '8px',
                  backgroundColor: 'transparent',
                  color: '#666',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                ‹
              </button>
              <button 
                onClick={goToNext}
                style={{ 
                  padding: '8px',
                  backgroundColor: 'transparent',
                  color: '#666',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                ›
              </button>
            </div>
          </div>

          {/* Right side controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={goToToday} 
              style={{ 
                padding: '8px 16px',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Today
            </button>
            
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                onClick={() => changeView('month')} 
                style={{ 
                  padding: '6px 12px',
                  backgroundColor: '#f8f9fa',
                  color: '#333',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Month
              </button>
              <button 
                onClick={() => changeView('week')} 
                style={{ 
                  padding: '6px 12px',
                  backgroundColor: '#f8f9fa',
                  color: '#333',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Week
              </button>
              <button 
                onClick={() => changeView('day')}
                style={{ 
                  padding: '6px 12px',
                  backgroundColor: '#f8f9fa',
                  color: '#333',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Day
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast UI Calendar */}
      <div style={{ 
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        border: '1px solid #e0e0e0'
      }}>
        <Calendar
          ref={calendarRef}
          height="700px"
          view="month"
          calendars={calendars}
          events={events}
          usageStatistics={false}
          
          // Event handlers
          onSelectDateTime={onSelectDateTime}
          onClickEvent={onClickEvent}
          onUpdateEvent={onUpdateEvent}
          onDeleteEvent={onDeleteEvent}
          
          // Calendar options to match your screenshot
          month={{
            dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            visibleWeeksCount: 0, // Show all weeks in month
            workweek: false,
            narrowWeekend: false,
            startDayOfWeek: 0, // Start from Sunday
            isAlways6Week: false
          }}
          week={{
            showNowIndicator: true,
            dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            hourStart: 0,
            hourEnd: 24,
            workweek: false
          }}
          
          // Theme to match the colorful look
          theme={{
            common: {
              backgroundColor: '#ffffff',
              border: '1px solid #e5e5e5',
              gridSelection: {
                backgroundColor: 'rgba(81, 92, 230, 0.05)',
                border: '1px solid #515ce6'
              }
            },
            month: {
              dayName: {
                borderLeft: 'none',
                backgroundColor: '#f8f9fa'
              },
              holidayExceptThisMonth: {
                color: '#f54f3d'
              },
              dayExceptThisMonth: {
                color: '#bbb'
              },
              weekend: {
                backgroundColor: '#fafafa'
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default CalendarComponent;