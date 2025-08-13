import React, { useState } from 'react';
import './AboutTab.css';

const AboutTab = ({ username, onFirstInteraction = () => {} }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    if (!isOpen) {
      onFirstInteraction(); // clears the dim on first open
    }
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className="about-container">
      <div
        className="about-tab"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-controls="about-dropdown"
      >
        About FilterFlix
      </div>

      {isOpen && (
        <div className="about-dropdown" id="about-dropdown">
          <button
            className="close-button"
            onClick={handleToggle}
            aria-label="Close about panel"
          >
            ×
          </button>

          <div className="about-content">
            <h3>Why We Made FilterFlix</h3>

            <p>
              <strong>Welcome to FilterFlix!</strong> Are you tired of endlessly
              scrolling across apps just to figure out what to watch on the
              services you already have? <strong>FilterFlix</strong> is here to help.
            </p>

            <p>
              <strong>FilterFlix is the simple, easy way</strong> to find movies you’ll
              actually enjoy—based on your tastes and the streaming services you
              use. Pick the platforms you have, set your favorite genres, and
              discover titles that fit you. You can refine your selections
              anytime.
            </p>

            <p>
              <strong>Our purpose</strong> is to give you control—without ads, affiliates,
              or opaque algorithms. <strong>FilterFlix is different because:</strong>
            </p>

            <ul>
              <li>
                <strong>No sponsored placements.</strong> Our picks are never bought.
              </li>
              <li>
                <strong>Transparent criteria.</strong> Recommendations come from your
                selections only.
              </li>
              <li>
                <strong>User-first controls.</strong> Weight genres, hide titles, and
                fine-tune results to keep the feed honest.
              </li>
              <li>
                <strong>Privacy-respecting.</strong> We only ask for what’s needed to
                personalize your results—you stay in control.
              </li>
            </ul>

            <p>
              <strong>Our mission:</strong> To be the most trusted, unbiased source of
              movie recommendations so people spend less time scrolling and more
              time watching stories they love.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AboutTab;
