import React, { useState } from 'react';
import Icon from '../common/Icon';

/**
 * Component to display scheduling warnings for projects
 * Shows issues like unestimated tasks, circular dependencies, etc.
 */
const GanttWarnings = ({ projectId, projectName, warnings, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!warnings || warnings.length === 0) {
    return null;
  }

  const getWarningIcon = (warning) => {
    if (warning.includes('sin story points') || warning.includes('sin estimación')) {
      return 'alert-circle';
    }
    if (warning.includes('circular') || warning.includes('Circular')) {
      return 'alert-triangle';
    }
    if (warning.includes('sin usuario asignado') || warning.includes('sin asignación')) {
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
    return 'warning';
  };

  return (
    <div className={`gantt-warnings ${className}`}>
      <div
        className="gantt-warnings-header"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: 'pointer' }}
      >
        <div className="flex items-center gap-xs">
          <Icon
            name="alert-triangle"
            size={16}
            style={{ color: 'var(--color-warning)' }}
          />
          {projectName && (
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {projectName}:
            </span>
          )}
          <span className="text-sm font-medium" style={{ color: 'var(--color-warning)' }}>
            {warnings.length} {warnings.length === 1 ? 'advertencia' : 'advertencias'}
          </span>
        </div>
        <Icon
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          style={{ color: 'var(--text-secondary)' }}
        />
      </div>

      {isExpanded && (
        <div className="gantt-warnings-list">
          {warnings.map((warning, index) => {
            const warningType = getWarningType(warning);
            const icon = getWarningIcon(warning);

            return (
              <div
                key={index}
                className={`gantt-warning-item gantt-warning-${warningType}`}
              >
                <Icon
                  name={icon}
                  size={14}
                  style={{
                    color: warningType === 'error' ? 'var(--color-error)' : 'var(--color-warning)',
                    flexShrink: 0
                  }}
                />
                <span className="text-xs">{warning}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GanttWarnings;
