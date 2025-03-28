import React from 'react';
import { Layout, Menu } from 'antd';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  DashboardOutlined, 
  FormOutlined, 
  AppstoreOutlined,
  CalendarOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { signOut } from '../../firebase/auth';

const { Header, Sider, Content } = Layout;

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  
  // Define header menu items using the items prop
  const headerMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: async () => {
        try {
          await signOut();
          window.location.href = '/auth/signin';
        } catch (error) {
          console.error('Error signing out:', error);
        }
      }
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => {
        window.location.href = '/settings';
      }
    }
  ];
  
  // Define sider menu items using the items prop
  const siderMenuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">Dashboard</Link>
    },
    {
      key: '/dashboard/kanban',
      icon: <AppstoreOutlined />,
      label: <Link to="/dashboard/kanban">Kanban Board</Link>
    },
    {
      key: '/dashboard/calendar',
      icon: <CalendarOutlined />,
      label: <Link to="/dashboard/calendar">Calendar View</Link>
    },
    {
      type: 'divider'
    },
    {
      key: 'forms',
      icon: <FormOutlined />,
      label: 'Forms',
      children: [
        {
          key: '/form/builder/new',
          label: <Link to="/form/builder/new">Create Form</Link>
        },
        {
          key: '/form/ai',
          label: <Link to="/form/ai">AI Generator</Link>
        }
      ]
    },
    {
      key: '/templates',
      icon: <FileTextOutlined />,
      label: <Link to="/templates">Templates</Link>
    }
  ];

  return (
    <Layout className="dashboard-layout">
      <Header className="dashboard-header">
        <div className="logo">Form Builder</div>
        <div className="header-content">
          <Menu
            mode="horizontal"
            selectedKeys={[]}
            items={headerMenuItems}
            className="header-menu"
          />
        </div>
      </Header>
      
      <Layout>
        <Sider width={200} className="dashboard-sider">
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: '100%', borderRight: 0 }}
            items={siderMenuItems}
          />
        </Sider>
        
        <Content className="dashboard-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}; 