/**
 * Instructions Panel Component
 * Displays list of upcoming turn-by-turn instructions
 */

import { useEffect, useRef } from 'react';

export default function InstructionsPanel({ instructions, currentInstructionIndex, onInstructionClick }) {
  const panelRef = useRef(null);
  const currentRef = useRef(null);

  useEffect(() => {
    // Scroll to current instruction
    if (currentRef.current && panelRef.current) {
      currentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentInstructionIndex]);

  if (!instructions || instructions.length === 0) {
    return (
      <div className="instructions-panel">
        <div className="panel-header">
          <h3>Turn-by-Turn Instructions</h3>
        </div>
        <div className="no-instructions">
          <p>No instructions available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="instructions-panel" ref={panelRef}>
      <div className="panel-header">
        <h3>Turn-by-Turn Instructions</h3>
        <div className="instructions-count">
          {instructions.length} steps
        </div>
      </div>
      
      <div className="instructions-list">
        {instructions.map((instruction, index) => {
          const isCurrent = index === currentInstructionIndex;
          const isPast = index < currentInstructionIndex;
          const isFuture = index > currentInstructionIndex;

          return (
            <div
              key={index}
              ref={isCurrent ? currentRef : null}
              onClick={() => onInstructionClick && onInstructionClick(instruction, index)}
              className={`instruction-item ${isCurrent ? 'current' : ''} ${isPast ? 'past' : ''} ${isFuture ? 'future' : ''}`}
              style={{ cursor: onInstructionClick ? 'pointer' : 'default' }}
            >
              <div className="instruction-content">
                {/* Instruction Number and Icon */}
                <div className="instruction-marker">
                  <div className="instruction-number">
                    {isPast ? '✓' : index + 1}
                  </div>
                  <div className="instruction-line"></div>
                </div>

                {/* Instruction Icon */}
                <div className="instruction-icon">
                  {getInstructionIcon(instruction.type)}
                </div>

                {/* Instruction Text */}
                <div className="instruction-text">
                  <div className="instruction-main">
                    {instruction.text}
                  </div>
                  
                  {instruction.distance > 0 && (
                    <div className="instruction-distance">
                      {formatDistance(instruction.distance)}
                      {instruction.duration && (
                        <span className="instruction-duration">
                          • {formatDuration(instruction.duration)}
                        </span>
                      )}
                    </div>
                  )}

                  {instruction.safetyWarning && (
                    <div className="safety-warning">
                      <span className="warning-icon">⚠️</span>
                      {instruction.safetyWarning}
                    </div>
                  )}

                  {instruction.road && (
                    <div className="road-info">
                      {instruction.road}
                    </div>
                  )}
                </div>

                {/* Status Indicator */}
                {isCurrent && (
                  <div className="current-indicator">
                    <div className="pulse-dot"></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .instructions-panel {
          background: var(--bg-primary);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border-light);
          max-height: 500px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-width: 320px;
        }

        .panel-header {
          padding: 1.25rem;
          border-bottom: 1px solid var(--border-light);
          background: var(--bg-secondary);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .panel-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .instructions-count {
          font-size: 0.875rem;
          color: var(--text-tertiary);
          background: var(--bg-tertiary);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
        }

        .no-instructions {
          padding: 2rem;
          text-align: center;
          color: var(--text-tertiary);
          font-style: italic;
        }

        .instructions-list {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }

        .instruction-item {
          padding: 1rem;
          border-radius: var(--radius-md);
          margin-bottom: 0.75rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid transparent;
          background: var(--bg-primary);
          position: relative;
        }

        .instruction-item:hover {
          background: var(--bg-secondary);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .instruction-item.current {
          background: rgba(59, 130, 246, 0.08);
          border-color: var(--accent-primary);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }

        .instruction-item.past {
          opacity: 0.7;
          background: var(--bg-tertiary);
        }

        .instruction-item.past .instruction-number {
          background: var(--accent-success);
          color: white;
        }

        .instruction-content {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          position: relative;
        }

        .instruction-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .instruction-number {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--bg-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          transition: all 0.3s ease;
        }

        .instruction-item.current .instruction-number {
          background: var(--accent-primary);
          color: white;
          transform: scale(1.1);
        }

        .instruction-line {
          width: 2px;
          flex: 1;
          background: var(--border-light);
          border-radius: 1px;
        }

        .instruction-item:last-child .instruction-line {
          display: none;
        }

        .instruction-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--bg-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .instruction-item.current .instruction-icon {
          background: var(--accent-primary);
          color: white;
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .instruction-item.past .instruction-icon {
          background: var(--text-tertiary);
          color: white;
        }

        .instruction-text {
          flex: 1;
          min-width: 0;
        }

        .instruction-main {
          font-weight: 500;
          font-size: 0.95rem;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }

        .instruction-item.current .instruction-main {
          font-weight: 600;
          color: var(--accent-primary);
          font-size: 1rem;
        }

        .instruction-distance {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .instruction-duration {
          color: var(--text-tertiary);
          font-size: 0.75rem;
        }

        .safety-warning {
          font-size: 0.75rem;
          color: var(--accent-danger);
          background: rgba(239, 68, 68, 0.1);
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
          border-left: 3px solid var(--accent-danger);
        }

        .warning-icon {
          font-size: 0.9rem;
        }

        .road-info {
          font-size: 0.8rem;
          color: var(--text-tertiary);
          margin-top: 0.25rem;
          font-style: italic;
        }

        .current-indicator {
          position: absolute;
          top: 1rem;
          right: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background: var(--accent-success);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        /* Scrollbar Styling */
        .instructions-list::-webkit-scrollbar {
          width: 6px;
        }

        .instructions-list::-webkit-scrollbar-track {
          background: var(--bg-tertiary);
          border-radius: 3px;
        }

        .instructions-list::-webkit-scrollbar-thumb {
          background: var(--border-medium);
          border-radius: 3px;
        }

        .instructions-list::-webkit-scrollbar-thumb:hover {
          background: var(--text-tertiary);
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .instructions-panel {
            max-height: 300px;
            min-width: 280px;
          }

          .instruction-content {
            gap: 0.75rem;
          }

          .instruction-icon {
            width: 36px;
            height: 36px;
            font-size: 1.1rem;
          }

          .instruction-main {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}

function getInstructionIcon(type) {
  const icons = {
    'depart': '🚀',
    'turn-left': '↰',
    'turn-right': '↱',
    'turn-sharp-left': '↲',
    'turn-sharp-right': '↳',
    'turn-slight-left': '⬋',
    'turn-slight-right': '⬊',
    'continue': '→',
    'uturn': '↶',
    'roundabout': '🔄',
    'fork': '⇶',
    'merge': '🔄',
    'ramp': '↗️',
    'exit': '↘️',
    'arrive': '🏁',
    'arrive-left': '🏁',
    'arrive-right': '🏁',
    'start': '📍'
  };

  return icons[type] || '•';
}

function formatDistance(meters) {
  if (!meters || meters < 0) return '';
  
  if (meters < 10) {
    return `${Math.round(meters)} m`;
  } else if (meters < 1000) {
    return `${Math.round(meters / 10) * 10} m`;
  } else {
    return `${(meters / 1000).toFixed(1)} km`;
  }
}

function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '';
  
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remainingMinutes} min`;
}