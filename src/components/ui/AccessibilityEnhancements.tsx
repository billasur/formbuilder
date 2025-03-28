'use client'

import React from 'react';
import { Button, Typography, Switch, Space } from 'antd';
import { useTheme } from 'next-themes';
import { 
  FontSizeOutlined,
  ContrastOutlined,
  EyeOutlined,
  SoundOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function AccessibilityEnhancements() {
  const { theme, setTheme } = useTheme();
  const [fontSize, setFontSize] = React.useState('medium');
  const [highContrast, setHighContrast] = React.useState(false);
  
  // Apply font size to document
  React.useEffect(() => {
    const sizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'extra-large': '20px'
    };
    
    document.documentElement.style.fontSize = sizes[fontSize];
  }, [fontSize]);
  
  // Apply high contrast
  React.useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [highContrast]);
  
  return (
    <div className="accessibility-panel">
      <Title level={4}><EyeOutlined /> Accessibility Options</Title>
      
      <Space direction="vertical" style={{ width: '100%' }}>
        <div className="accessibility-option">
          <Text strong><FontSizeOutlined /> Text Size</Text>
          <Space>
            <Button 
              size="small" 
              onClick={() => setFontSize('small')}
              type={fontSize === 'small' ? 'primary' : 'default'}
            >
              Small
            </Button>
            <Button 
              size="small" 
              onClick={() => setFontSize('medium')}
              type={fontSize === 'medium' ? 'primary' : 'default'}
            >
              Medium
            </Button>
            <Button 
              size="small" 
              onClick={() => setFontSize('large')}
              type={fontSize === 'large' ? 'primary' : 'default'}
            >
              Large
            </Button>
            <Button 
              size="small" 
              onClick={() => setFontSize('extra-large')}
              type={fontSize === 'extra-large' ? 'primary' : 'default'}
            >
              Extra Large
            </Button>
          </Space>
        </div>
        
        <div className="accessibility-option">
          <Text strong><ContrastOutlined /> Dark Mode</Text>
          <Switch 
            checked={theme === 'dark'} 
            onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          />
        </div>
        
        <div className="accessibility-option">
          <Text strong><ContrastOutlined /> High Contrast</Text>
          <Switch 
            checked={highContrast} 
            onChange={setHighContrast}
          />
        </div>
      </Space>
    </div>
  );
} 