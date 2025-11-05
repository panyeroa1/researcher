import React, { useState, useEffect } from 'react';
import { SunIcon, MoonIcon, PaletteIcon } from './common/Icons';

type Theme = 'light' | 'dark';
type AccentColor = 'blue' | 'green' | 'purple' | 'orange';

const ACCENT_COLORS: Record<AccentColor, Record<string, string>> = {
  blue: {
    '--color-brand-primary': '#0D47A1',
    '--color-brand-secondary': '#1565C0',
    '--color-brand-light': '#1E88E5',
  },
  green: {
    '--color-brand-primary': '#1B5E20',
    '--color-brand-secondary': '#2E7D32',
    '--color-brand-light': '#43A047',
  },
  purple: {
    '--color-brand-primary': '#4A148C',
    '--color-brand-secondary': '#6A1B9A',
    '--color-brand-light': '#8E24AA',
  },
  orange: {
    '--color-brand-primary': '#E65100',
    '--color-brand-secondary': '#EF6C00',
    '--color-brand-light': '#F57C00',
  },
};

const ThemeSwitcher: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('light');
  const [accent, setAccent] = useState<AccentColor>('blue');
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const storedAccent = localStorage.getItem('accentColor') as AccentColor | null;
    
    const initialTheme = storedTheme || 'light';
    const initialAccent = storedAccent || 'blue';

    setTheme(initialTheme);
    setAccent(initialAccent);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    const colors = ACCENT_COLORS[accent];
    Object.entries(colors).forEach(([property, value]) => {
      // FIX: Explicitly cast `value` to string. This resolves an issue where the TypeScript compiler
      // incorrectly infers the type of `value` as `unknown` in some environments.
      root.style.setProperty(property, value as string);
    });
    localStorage.setItem('accentColor', accent);
  }, [accent]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <button
          onClick={() => setIsPaletteOpen(!isPaletteOpen)}
          className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Change accent color"
        >
          <PaletteIcon className="w-6 h-6" />
        </button>
        {isPaletteOpen && (
          <div className="absolute right-0 top-full mt-2 p-2 bg-white dark:bg-dark-card rounded-lg shadow-xl border dark:border-gray-700 flex space-x-2">
            {/* FIX: Cast object keys to AccentColor array for type safety. */}
            {(Object.keys(ACCENT_COLORS) as AccentColor[]).map(color => (
              <button
                key={color}
                onClick={() => {
                  setAccent(color);
                  setIsPaletteOpen(false);
                }}
                className={`w-6 h-6 rounded-full border-2 ${accent === color ? 'border-brand-primary' : 'border-transparent'}`}
                style={{ backgroundColor: ACCENT_COLORS[color]['--color-brand-light'] }}
                aria-label={`Set ${color} accent color`}
              />
            ))}
          </div>
        )}
      </div>

      <button
        onClick={toggleTheme}
        className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle light/dark theme"
      >
        {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
      </button>
    </div>
  );
};

export default ThemeSwitcher;
