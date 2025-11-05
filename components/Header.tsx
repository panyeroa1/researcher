import React from 'react';
import { AppMode } from '../types';
import { PresentationIcon, ImageIcon, VideoIcon, LightningIcon, SpeakerIcon } from './common/Icons';
import ThemeSwitcher from './ThemeSwitcher';

interface HeaderProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
}

const NavButton: React.FC<{
  mode: AppMode;
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
  icon: React.ReactNode;
  label: string;
}> = ({ mode, currentMode, setMode, icon, label }) => {
  const isActive = mode === currentMode;
  return (
    <button
      onClick={() => setMode(mode)}
      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-brand-light text-white shadow-lg'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
};

const Header: React.FC<HeaderProps> = ({ currentMode, setMode }) => {
  return (
    <header className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm shadow-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <h1 className="text-xl md:text-2xl font-bold text-brand-primary dark:text-brand-light tracking-tight">
              Galileo
            </h1>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <nav className="flex items-center space-x-1 md:space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <NavButton
                mode={AppMode.PITCH_GENERATOR}
                currentMode={currentMode}
                setMode={setMode}
                icon={<PresentationIcon className="w-5 h-5" />}
                label="Pitch"
              />
              <NavButton
                mode={AppMode.IMAGE_ANALYZER}
                currentMode={currentMode}
                setMode={setMode}
                icon={<ImageIcon className="w-5 h-5" />}
                label="Image"
              />
              <NavButton
                mode={AppMode.VIDEO_ANALYZER}
                currentMode={currentMode}
                setMode={setMode}
                icon={<VideoIcon className="w-5 h-5" />}
                label="Video"
              />
              <NavButton
                mode={AppMode.QUICK_ANSWER}
                currentMode={currentMode}
                setMode={setMode}
                icon={<LightningIcon className="w-5 h-5" />}
                label="Quick"
              />
              <NavButton
                mode={AppMode.TTS}
                currentMode={currentMode}
                setMode={setMode}
                icon={<SpeakerIcon className="w-5 h-5" />}
                label="TTS"
              />
            </nav>
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
