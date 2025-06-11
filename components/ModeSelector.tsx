
import React from 'react';
import { AppMode } from '../types';

interface ModeSelectorProps {
  currentMode: AppMode;
  onSwitchMode: (mode: AppMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onSwitchMode }) => {
  const modes = [
    { id: AppMode.Student, label: '📄 Upload Document', ariaLabel: 'Switch to Upload Document mode' },
    { id: AppMode.Shop, label: '🏪 Print Shop', ariaLabel: 'Switch to Print Shop mode' },
  ];

  return (
    <nav 
      className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 mb-8 md:mb-10 bg-white p-2 rounded-xl shadow-sm max-w-md mx-auto" 
      role="tablist"
      aria-label="Application Mode Selector"
    >
      {modes.map(mode => (
        <button
          key={mode.id}
          className={`
            flex-1 py-3 px-6 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2
            ${currentMode === mode.id 
              ? 'bg-brand-primary text-white shadow-md' 
              : 'bg-transparent text-subtle-text hover:bg-slate-100 hover:text-neutral-text'}
          `}
          onClick={() => onSwitchMode(mode.id)}
          role="tab"
          aria-selected={currentMode === mode.id}
          aria-controls={`${mode.id}-interface`} // Assuming corresponding panels have these IDs
          id={`${mode.id}-tab`}
        >
          {mode.label}
        </button>
      ))}
    </nav>
  );
};
    