import { useEffect } from 'react';

export const useClickOutside = (ref, callback, { enabled = true, delay = 0, capture = false } = {}) => {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    if (delay > 0) {
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside, capture);
      }, delay);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside, capture);
      };
    }

    document.addEventListener('mousedown', handleClickOutside, capture);
    return () => document.removeEventListener('mousedown', handleClickOutside, capture);
  }, [ref, callback, enabled, delay, capture]);
};
