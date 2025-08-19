import React from "react";
import { Link } from "react-router-dom";
import "./LandingStyles.css";

const Landing = () => {
  return (
    <div className="landingpage">
      {/* Hero Section */}
      <section className="hero">
        {/* Container - centers content and sets max width */}
        <div className="container">
          {/* Left side - text content and buttons */}
          <div className="hero-content">
            {/* Main Headline */}
            <h1 className="hero-title">
                Stay <span className="highlight">Sync'd</span> with What Matters
            </h1>
            {/* Subtitle - explains what the app does */}
            <p className="hero-subtitle">
                Connect with friends, follow your favorite businesses, and never miss an event again.
                Your social calendar, all in one place.
            </p>
            {/* Action buttons */}
            <div className="hero-buttons">
                {/* Primary button - sign up */}
                <Link to="/signup" className="btn-primary">Get Started</Link>
                {/* Secondary button - learn more */}
                <button className="btn-secondary">Learn More</button>
            </div>
          </div>
          {/* Right side - visual elements */}
          <div className="hero-visual">
            {/* Calendar preview - Mock up of the actual app interface */}
            <div className="calendar-preview">
              {/* Calendar header - top part with navigation */}
              <div className="calendar-header">
                <h3>Your Events</h3>
                {/* Date navigation - Shows current month/period */}
                <div className="calendar-nav">
                  <span>January 2025</span>
                </div>
              </div>
              {/* Event list - shows sample events to demonstrate the app */}
              <div className="event-cards">
                {/* Sample business event */}
                <div className="event-card">
                  {/* Color dot to visually indicate event type */}
                  <div className="event-dot business"></div>
                  {/* Event details */}
                  <div className="event-info">
                    <h4>Coffee Shop Grand Opening</h4>
                    <p>Green Leaf Café • Tomorrow 10:00 AM</p>
                  </div>
                </div>
                {/* Sample personal event */}
                <div className="event-card">
                  {/* Another color dot for personal event */}
                  <div className="event-dot personal"></div>
                  <div className="event-info">
                    <h4>Study Group</h4>
                    <p>With friends • Friday 2:00 PM</p>
                  </div>
                </div>
                {/* Another sample business event */}
                <div className="event-card">
                  <div className="event-dot business"></div>
                  <div className="event-info">
                    <h4>Yoga Class</h4>
                    <p>MindSpring Studio • Weekend</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - shows the functionality and benefits of the app */}
      <section className="features">
        {/* Container for centering*/}
        <div className="container">
          {/* Section header */}
          <div className="section-header">
            {/* Main title of the section */}
            <h2>Everything You Need to Stay Connected</h2>
            {/* Section description */}
            <p>Manage your social life effortlessly</p>
          </div>

          {/* Features grid - Container that holds all the feature cards
          (2x2 on desktop, 1 column on mobile) */}
          <div className="features-grid">

            {/* Card #1 (personal) */}
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              {/* Title of the feature */}
              <h3>Connect with Friends</h3>
              {/* Description */}
              <p>Add friends, send invites, and coordinate events together. Never lose touch with the people who matter most.</p>
            </div>

            {/* Card #2 (business) */}
            <div className="feature-card">
              <div className="feature-icon">🏢</div>
              <h3>Follow Businesses</h3>
              <p>Stay updated with your favorite cafés, gyms, and local spots. Get notified about special events and offers.</p>
            </div>

            {/* Card #3 (calendar functionality) */}
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Smart Calendar</h3>
              <p>Create personal events and public gatherings. Set reminders and share your network seamlessly.</p>
            </div>

            {/* Card #4 (notifications functionality) */}
            <div className="feature-card">
              <div className="feature-icon">🔔</div>
              <h3>Never Miss Out</h3>
              <p>Get timely notifications about upcoming events, your friend's activities, and business updates you care about.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        {/* Container */}
        <div className="container">
          {/* Content */}
          <div className="cta-content">
            {/* Headline */}
            <h2>Ready to Get Sync'd?</h2>
            <p>Join thousands of users who are already staying connected with Sync'd</p>
            {/* Final CTA Button (making it large) */}
            <Link to="/signup" className="btn-primary large">Sign Up For Free</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;