'use client'

import React from 'react';
import { Layout, Menu, Dropdown, Avatar, Space, Button, Badge } from 'antd';
import { 
  UserOutlined, 
  BellOutlined, 
  SettingOutlined, 
  LogoutOutlined,
  QuestionCircleOutlined,
  MoonOutlined,
  SunOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut } from '../../firebase/auth';
import { auth } from '../../firebase/config';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './Header.module.css';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  collapsed: boolean;
  toggleCollapsed: () => void;
}

const Header = ({ collapsed, toggleCollapsed }: HeaderProps) => {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'My Profile',
        onClick: () => router.push('/profile')
      },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: 'Settings',
        onClick: () => router.push('/settings')
      },
      {
        type: 'divider',
      },
      {
        key: 'signout',
        icon: <LogoutOutlined />,
        label: 'Sign Out',
        onClick: handleSignOut
      },
    ],
  };

  return (
    <AntHeader className={styles.header}>
      <div className={styles.leftSection}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleCollapsed}
          className={styles.menuToggle}
        />
        <div className={styles.logo}>
          <Link href="/dashboard">FormBuilder</Link>
        </div>
      </div>
      
      <div className={styles.rightMenu}>
        <div 
          className={styles.darkModeToggle}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
        </div>
        
        <Badge count={5}>
          <Button
            type="text"
            icon={<BellOutlined />}
            onClick={() => router.push('/notifications')}
          />
        </Badge>
        
        <Button
          type="text"
          icon={<QuestionCircleOutlined />}
          onClick={() => router.push('/help')}
        />
        
        <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
          <div className={styles.userDropdown}>
            {auth.currentUser?.photoURL ? (
              <Avatar src={auth.currentUser.photoURL} />
            ) : (
              <Avatar icon={<UserOutlined />} />
            )}
            <span className={styles.username}>
              {auth.currentUser?.displayName || auth.currentUser?.email || 'User'}
            </span>
          </div>
        </Dropdown>
      </div>
    </AntHeader>
  );
};

export default Header; 