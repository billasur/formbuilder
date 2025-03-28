'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { auth } from '../firebase/config';
import { getUserSettings } from '../firebase/userService';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
}

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<ThemeType>('light');
  const [darkMode, setDarkMode] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#1890ff');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserTheme = async () => {
      try {
        // Check local storage first for quick loading
        const storedTheme = localStorage.getItem('theme') as ThemeType;
        const storedDarkMode = localStorage.getItem('darkMode') === 'true';
        const storedColor = localStorage.getItem('primaryColor');
        
        if (storedTheme) setTheme(storedTheme);
        if (storedColor) setPrimaryColor(storedColor);
        setDarkMode(storedDarkMode);
        
        // Then try to load from user settings if logged in
        if (auth.currentUser) {
          const settings = await getUserSettings(auth.currentUser.uid);
          if (settings) {
            if (settings.theme) {
              setTheme(settings.theme as ThemeType);
              localStorage.setItem('theme', settings.theme);
            }
            if (settings.primaryColor) {
              setPrimaryColor(settings.primaryColor);
              localStorage.setItem('primaryColor', settings.primaryColor);
            }
            if (settings.darkMode !== undefined) {
              setDarkMode(settings.darkMode);
              localStorage.setItem('darkMode', String(settings.darkMode));
            }
          }
        }
      } catch (error) {
        console.error('Error loading theme settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserTheme();
  }, []);

  useEffect(() => {
    // Apply theme to document body
    document.body.setAttribute('data-theme', theme);
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
    localStorage.setItem('darkMode', String(darkMode));
    localStorage.setItem('primaryColor', primaryColor);
  }, [theme, darkMode, primaryColor]);

  const themeConfig = {
    token: {
      colorPrimary: primaryColor,
    },
    algorithm: darkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
  };

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      
      // Save to localStorage
      localStorage.setItem('theme', newTheme);
      
      // Toggle dark class on document
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      
      return newTheme;
    });
  };

  if (loading) {
    return <div>Loading theme...</div>;
  }

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        toggleTheme, 
        darkMode, 
        setDarkMode, 
        primaryColor, 
        setPrimaryColor 
      }}
    >
      <ConfigProvider theme={themeConfig}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 