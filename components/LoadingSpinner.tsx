
import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 my-8">
      <div className="w-16 h-16 border-4 border-t-4 border-gray-200 border-t-brand-light rounded-full animate-spin"></div>
      {message && <p className="text-lg text-gray-600 dark:text-gray-300 animate-pulse">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
