'use client'

import React from 'react';
import { Layout, Menu } from 'antd';
import { 
  DashboardOutlined, 
  FormOutlined, 
  FileOutlined,
  SettingOutlined,
  TeamOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import styles from './SideNav.module.css';

const { Sider } = Layout;

interface SideNavProps {
  collapsed: boolean;
}

const SideNav = ({ collapsed }: SideNavProps) => {
  const router = useRouter();
  const pathname = usePathname();

  // Direct click handlers for better navigation
  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => handleNavigation('/dashboard')
    },
    {
      key: '/forms',
      icon: <FormOutlined />,
      label: 'Forms',
      children: [
        {
          key: '/form/create',
          label: 'Create Form',
          onClick: () => handleNavigation('/form/create')
        },
        {
          key: '/form/templates',
          label: 'Templates',
          onClick: () => handleNavigation('/form/templates')
        },
        {
          key: '/form/list',
          label: 'My Forms',
          onClick: () => handleNavigation('/form/list')
        }
      ]
    },
    {
      key: '/responses',
      icon: <FileOutlined />,
      label: 'Responses',
      onClick: () => handleNavigation('/responses')
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
      onClick: () => handleNavigation('/analytics')
    },
    {
      key: '/team',
      icon: <TeamOutlined />,
      label: 'Team',
      onClick: () => handleNavigation('/team')
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => handleNavigation('/settings')
    }
  ];

  return (
    <Sider
      width={220}
      collapsible
      collapsed={collapsed}
      trigger={null}
      className={styles.sideNav}
    >
      <div className={styles.menuContainer}>
        <Menu
          mode="inline"
          selectedKeys={[pathname || '']}
          style={{ height: '100%', borderRight: 0 }}
          items={menuItems}
        />
      </div>
    </Sider>
  );
};

export default SideNav; 