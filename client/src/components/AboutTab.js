import React, { useState } from 'react';
import './AboutTab.css';

const AboutTab = ({ username, onFirstInteraction }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    if (!isOpen) {
      onFirstInteraction(); // This clears the dim on first open
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="about-container">
      <div className="about-tab" onClick={handleToggle}>
        About FilterFlix
      </div>
      {isOpen && (
        <div className="about-dropdown">
          <button className="close-button" onClick={handleToggle}>
            ×
          </button>
          <div className="about-content">
            <h3>Why We Made FilterFlix</h3>
            <p>
              We created FilterFlix to solve the frustration of searching across multiple streaming platforms. 
              Our goal was to provide a unified search experience that saves time and helps users discover 
              content more efficiently.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AboutTab;