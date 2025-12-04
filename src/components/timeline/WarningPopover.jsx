import React, { useState, useRef, useEffect } from 'react';
import Icon from '../common/Icon';

/**
 * Popover component that appears on hover over the warning icon
 */
const WarningPopover = ({ warnings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);
  const hideTimeoutRef = useRef(null);

  useEffect(() => {
    if (isOpen && triggerRef.current && popoverRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate initial position (to the right of the icon)
      let left = triggerRect.right + 8;
      let top = triggerRect.top;

      // Check if it goes off the right edge
      if (left + popoverRect.width > viewportWidth - 20) {
        // Position to the left of the icon instead
        left = triggerRect.left - popoverRect.width - 8;
      }

      // Check if it goes off the bottom edge
      if (top + popoverRect.height > viewportHeight - 20) {
        // Adjust to fit within viewport
        top = viewportHeight - popoverRect.height - 20;
      }

      // Check if it goes off the top edge
      if (top < 20) {
        top = 20;
      }

      setPosition({ top, left });
    }
  }, [isOpen]);

  const getWarningIcon = (warning) => {
    if (warning.includes('sin story points') || warning.includes('sin estimación')) {
      return 'alert-circle';
    }
    if (warning.includes('circular') || warning.includes('Circular')) {
      return 'alert-triangle';
    }
    if (warning.includes('sin asignar') || warning.includes('simulada')) {
      return 'user-x';
    }
    if (warning.includes('extiende') || warning.includes('fecha límite')) {
      return 'clock';
    }
    if (warning.includes('fecha de inicio') || warning.includes('sin fecha')) {
      return 'calendar';
    }
    return 'alert-circle';
  };

  const getWarningType = (warning) => {
    if (warning.includes('circular') || warning.includes('Circular')) {
      return 'error';
    }
    if (warning.includes('simulada') || warning.includes('sin asignar')) {
      return 'info';
    }
    return 'warning';
  };

  if (!warnings || warnings.length === 0) return null;

  const handleMouseEnter = () => {
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    // Delay hiding to allow moving to the popover
    hideTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handlePopoverMouseEnter = () => {
    // Cancel hide if mouse enters popover
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const handlePopoverMouseLeave = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="warning-trigger-btn"
        style={{ display: 'inline-flex' }}
      >
        <Icon
          name="alert-triangle"
          size={16}
          style={{ color: 'var(--color-warning)' }}
        />
      </div>

      {isOpen && (
        <div
          ref={popoverRef}
          className="warning-popover"
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: 10000
          }}
          onMouseEnter={handlePopoverMouseEnter}
          onMouseLeave={handlePopoverMouseLeave}
        >
          <div className="warning-popover-header">
            <Icon
              name="alert-triangle"
              size={14}
              style={{ color: 'var(--color-warning)' }}
            />
            <span className="text-xs font-medium">
              {warnings.length} {warnings.length === 1 ? 'Advertencia' : 'Advertencias'}
            </span>
          </div>

          <div className="warning-popover-list">
            {warnings.map((warning, index) => {
              const warningType = getWarningType(warning);
              const icon = getWarningIcon(warning);

              return (
                <div
                  key={index}
                  className={`warning-popover-item warning-popover-${warningType}`}
                >
                  <Icon
                    name={icon}
                    size={12}
                    style={{
                      color: warningType === 'error'
                        ? 'var(--color-error)'
                        : warningType === 'info'
                        ? 'var(--color-primary)'
                        : 'var(--color-warning)',
                      flexShrink: 0
                    }}
                  />
                  <span className="text-xs">{warning}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default WarningPopover;
