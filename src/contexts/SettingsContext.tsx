import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { SiteSettings, ThemeMode } from '../types';

interface SettingsContextType {
  settings: SiteSettings;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  updateSettingsState: (newSettings: Partial<SiteSettings>) => void;
  reloadSettings: () => Promise<void>;
  isThemeModalOpen: boolean;
  openThemeModal: () => void;
  closeThemeModal: () => void;
  applyAccentColor: (hex: string) => void;
  saveDefaultSiteSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
}

const defaultSettings: SiteSettings = {
  site_name: 'ZoneTube',
  logo: 'ZoneTube',
  accent_color: '#E50914',
  default_theme_mode: 'dark',
  homepage_title: 'Watch the videos you love.',
  homepage_description: 'Stream trending, popular, and high quality videos in 4K.',
  default_results_per_page: 20,
  enable_registration: true,
  enable_favorites: true,
  enable_history: true,
  enable_comments: true,
  maintenance_mode: false,
};

// Helper to apply theme mode (dark, light, cyber, emerald) to document element
export function applyThemeModeToDOM(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  
  // Remove all previous theme classes
  root.classList.remove('dark', 'light', 'theme-cyber', 'theme-emerald');

  if (mode === 'light') {
    root.classList.add('light');
    root.setAttribute('data-theme', 'light');
  } else if (mode === 'cyber') {
    root.classList.add('dark', 'theme-cyber');
    root.setAttribute('data-theme', 'cyber');
  } else if (mode === 'emerald') {
    root.classList.add('dark', 'theme-emerald');
    root.setAttribute('data-theme', 'emerald');
  } else {
    // Default Dark
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  }
}

// Helper to convert hex to RGB and apply all dynamic theme variables to document root
export function applyThemeAccentColor(hexColor: string) {
  if (!hexColor || typeof hexColor !== 'string') return;
  const cleanHex = hexColor.trim().startsWith('#') ? hexColor.trim() : `#${hexColor.trim()}`;

  // Parse hex to RGB
  let r = 229, g = 9, b = 20;
  if (/^#[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    r = parseInt(cleanHex.slice(1, 3), 16);
    g = parseInt(cleanHex.slice(3, 5), 16);
    b = parseInt(cleanHex.slice(5, 7), 16);
  } else if (/^#[0-9A-Fa-f]{3}$/.test(cleanHex)) {
    r = parseInt(cleanHex[1] + cleanHex[1], 16);
    g = parseInt(cleanHex[2] + cleanHex[2], 16);
    b = parseInt(cleanHex[3] + cleanHex[3], 16);
  }

  // Calculate slightly lighter/darker hover color
  const hoverR = Math.min(255, Math.round(r * 1.15));
  const hoverG = Math.min(255, Math.round(g * 1.15));
  const hoverB = Math.min(255, Math.round(b * 1.15));
  const hoverHex = `#${hoverR.toString(16).padStart(2, '0')}${hoverG.toString(16).padStart(2, '0')}${hoverB.toString(16).padStart(2, '0')}`;

  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.style.setProperty('--accent-red', cleanHex);
    root.style.setProperty('--accent-hover', hoverHex);
    root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
    root.style.setProperty('--accent-glow', `rgba(${r}, ${g}, ${b}, 0.4)`);
    root.style.setProperty('--accent-subtle', `rgba(${r}, ${g}, ${b}, 0.16)`);
    root.style.setProperty('--accent-border', `rgba(${r}, ${g}, ${b}, 0.42)`);
  }
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('zonetube_theme_mode') as ThemeMode;
      if (saved && ['dark', 'light', 'cyber', 'emerald'].includes(saved)) {
        return saved;
      }
    } catch (e) {}
    return 'dark'; // Dark mode by default
  });

  const [settings, setSettings] = useState<SiteSettings>(() => {
    let initialColor = defaultSettings.accent_color;
    try {
      const saved = localStorage.getItem('zonetube_accent_color');
      if (saved) initialColor = saved;
    } catch (e) {}
    return { ...defaultSettings, accent_color: initialColor };
  });

  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  const openThemeModal = () => setIsThemeModalOpen(true);
  const closeThemeModal = () => setIsThemeModalOpen(false);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    applyThemeModeToDOM(mode);
    try {
      localStorage.setItem('zonetube_theme_mode', mode);
    } catch (e) {}
  }, []);

  const applyAccentColor = useCallback((hex: string) => {
    applyThemeAccentColor(hex);
    setSettings((prev) => ({ ...prev, accent_color: hex }));
    try {
      localStorage.setItem('zonetube_accent_color', hex);
    } catch (e) {}
  }, []);

  // Initial theme & color application on load
  useEffect(() => {
    applyThemeModeToDOM(themeMode);

    let activeColor = settings.accent_color || defaultSettings.accent_color;
    try {
      const saved = localStorage.getItem('zonetube_accent_color');
      if (saved) activeColor = saved;
    } catch (e) {}
    applyThemeAccentColor(activeColor);
  }, [themeMode, settings.accent_color]);

  const reloadSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data?.settings) {
        const fetched: SiteSettings = res.data.settings;
        setSettings((prev) => ({ ...prev, ...fetched }));

        // If user hasn't chosen custom local theme, apply admin default
        try {
          const userSavedColor = localStorage.getItem('zonetube_accent_color');
          if (!userSavedColor && fetched.accent_color) {
            applyThemeAccentColor(fetched.accent_color);
          }
          const userSavedMode = localStorage.getItem('zonetube_theme_mode') as ThemeMode;
          if (!userSavedMode && fetched.default_theme_mode) {
            setThemeModeState(fetched.default_theme_mode);
            applyThemeModeToDOM(fetched.default_theme_mode);
          }
        } catch (e) {}

        if (fetched.site_name) {
          document.title = fetched.site_name;
        }
      }
    } catch (err) {
      console.warn('Could not load site settings:', err);
    }
  };

  useEffect(() => {
    reloadSettings();
  }, []);

  const updateSettingsState = (newSettings: Partial<SiteSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (updated.accent_color) {
        applyThemeAccentColor(updated.accent_color);
      }
      if (updated.site_name) {
        document.title = updated.site_name;
      }
      return updated;
    });
  };

  const saveDefaultSiteSettings = async (newSettings: Partial<SiteSettings>) => {
    const updated = { ...settings, ...newSettings };
    updateSettingsState(updated);
    await api.put('/admin/settings', updated);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        themeMode,
        setThemeMode,
        updateSettingsState,
        reloadSettings,
        isThemeModalOpen,
        openThemeModal,
        closeThemeModal,
        applyAccentColor,
        saveDefaultSiteSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

