'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import styles from './BeautifulLayout.module.css';

interface BeautifulLayoutProps {
  children: React.ReactNode;
  backgroundStyle?: 'gradient' | 'dots' | 'waves' | 'none';
  animate?: boolean;
  fullHeight?: boolean;
  maxWidth?: number;
  centerContent?: boolean;
}

export default function BeautifulLayout({
  children,
  backgroundStyle = 'gradient',
  animate = true,
  fullHeight = false,
  maxWidth = 1200,
  centerContent = false
}: BeautifulLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  
  // Handle mounting for theme detection
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  // Get background class based on style
  const getBackgroundClass = () => {
    switch (backgroundStyle) {
      case 'gradient':
        return styles.gradientBackground;
      case 'dots':
        return styles.dotsBackground;
      case 'waves':
        return styles.wavesBackground;
      case 'none':
      default:
        return '';
    }
  };
  
  return (
    <div 
      className={`${styles.beautifulLayout} ${getBackgroundClass()}`}
      style={{ 
        minHeight: fullHeight ? '100vh' : 'auto',
      }}
    >
      <div 
        className={styles.contentContainer}
        style={{ 
          maxWidth: `${maxWidth}px`,
          display: centerContent ? 'flex' : 'block',
          flexDirection: centerContent ? 'column' : 'unset',
          justifyContent: centerContent ? 'center' : 'unset',
          alignItems: centerContent ? 'center' : 'unset',
          minHeight: fullHeight ? 'calc(100vh - 48px)' : 'auto',
        }}
      >
        {animate ? (
          <AnimatePresence mode="wait">
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={styles.animatedContent}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        ) : (
          children
        )}
      </div>
    </div>
  );
} 