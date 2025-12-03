import { useState, useRef, useEffect } from 'react';
import Icon from './Icon';
import '../../styles/StoryPointsSelect.css';

const StoryPointsSelect = ({
  value,
  onChange,
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState('');
  const inputRef = useRef(null);

  // Al abrir el editor, establecer el valor temporal y hacer foco
  useEffect(() => {
    if (isEditing) {
      setTempValue(value !== null && value !== undefined ? String(value) : '');
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  }, [isEditing, value]);

  const handleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    const numValue = tempValue === '' ? null : Number(tempValue);
    if (numValue === null || (!isNaN(numValue) && numValue >= 0)) {
      onChange(numValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleChange = (e) => {
    const inputValue = e.target.value;
    // Permitir solo números y punto decimal
    if (inputValue === '' || /^\d*\.?\d*$/.test(inputValue)) {
      setTempValue(inputValue);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        className={`story-points-input story-points-${size}`}
        value={tempValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        placeholder="0"
      />
    );
  }

  return (
    <div
      className={`story-points-badge story-points-${size} ${value !== null && value !== undefined ? 'has-value' : 'empty'} has-tooltip`}
      onClick={handleClick}
      data-tooltip="Story Points"
    >
      <Icon name="zap" size={12} />
      <span>{value !== null && value !== undefined ? value : '-'}</span>
    </div>
  );
};

export default StoryPointsSelect;
