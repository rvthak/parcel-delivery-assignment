import React from 'react';

type BannerType = 'success' | 'error' | 'warning';

interface BannerProps {
  type: BannerType;
  message: string;
  onClose: () => void;
}

export const Banner: React.FC<BannerProps> = ({ type, message, onClose }) => {
  return (
    <div className={`banner banner-${type}`}>
      <span>{message}</span>
      <button onClick={onClose} className="banner-close" aria-label="Close">
        &times;
      </button>
    </div>
  );
};
