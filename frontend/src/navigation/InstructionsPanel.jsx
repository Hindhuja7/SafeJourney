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
      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <p style={{ color: '#666', margin: 0 }}>No instructions available</p>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        maxHeight: '400px',
        overflowY: 'auto',
        padding: '10px'
      }}
    >
      <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold', padding: '0 10px' }}>
        Turn-by-Turn Instructions
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {instructions.map((instruction, index) => {
          const isCurrent = index === currentInstructionIndex;
          const isPast = index < currentInstructionIndex;
          const isFuture = index > currentInstructionIndex;

          return (
            <div
              key={index}
              ref={isCurrent ? currentRef : null}
              onClick={() => onInstructionClick && onInstructionClick(instruction, index)}
              style={{
                padding: '12px',
                borderRadius: '6px',
                backgroundColor: isCurrent ? '#e7f3ff' : (isPast ? '#f5f5f5' : 'white'),
                border: isCurrent ? '2px solid #007bff' : '1px solid #e0e0e0',
                cursor: onInstructionClick ? 'pointer' : 'default',
                opacity: isPast ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (onInstructionClick && !isCurrent) {
                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                }
              }}
              onMouseLeave={(e) => {
                if (!isCurrent) {
                  e.currentTarget.style.backgroundColor = isPast ? '#f5f5f5' : 'white';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                {/* Instruction Icon */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: isCurrent ? '#007bff' : (isPast ? '#ccc' : '#e0e0e0'),
                  color: isCurrent ? 'white' : '#666',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  flexShrink: 0,
                  fontWeight: 'bold'
                }}>
                  {getInstructionIcon(instruction.type)}
                </div>

                {/* Instruction Text */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: isCurrent ? 'bold' : 'normal',
                    fontSize: isCurrent ? '15px' : '14px',
                    color: isCurrent ? '#007bff' : '#333',
                    marginBottom: '4px'
                  }}>
                    {instruction.text}
                  </div>
                  
                  {instruction.distance > 0 && (
                    <div style={{
                      fontSize: '12px',
                      color: '#666',
                      marginTop: '4px'
                    }}>
                      {formatDistance(instruction.distance)}
                    </div>
                  )}

                  {instruction.safetyWarning && (
                    <div style={{
                      fontSize: '11px',
                      color: '#dc3545',
                      marginTop: '4px',
                      padding: '4px 8px',
                      backgroundColor: '#fff3cd',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      ⚠️ {instruction.safetyWarning}
                    </div>
                  )}
                </div>

                {/* Status Indicator */}
                {isCurrent && (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#28a745',
                    flexShrink: 0,
                    marginTop: '12px',
                    animation: 'pulse 2s infinite'
                  }} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

function getInstructionIcon(type) {
  switch (type) {
    case 'turn-left':
      return '↶';
    case 'turn-right':
      return '↷';
    case 'u-turn':
      return '↻';
    case 'continue':
      return '→';
    case 'arrive':
      return '✓';
    case 'start':
      return '▶';
    default:
      return '•';
  }
}

function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  } else {
    return `${(meters / 1000).toFixed(1)} km`;
  }
}

