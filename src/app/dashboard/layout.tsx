'use client'

import React, { useState, useCallback, memo } from 'react'
import { Layout, Menu, Dropdown, Avatar, Space, Button } from 'antd'
import { 
  DashboardOutlined, 
  FormOutlined, 
  FileOutlined,
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  DownOutlined
} from '@ant-design/icons'
import Link from 'next/link'
import { signOut } from '../../firebase/auth'
import { auth } from '../../firebase/config'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { MenuProps } from 'antd'

const { Header, Sider, Content } = Layout

// Define proper types for the MemoizedMenu component
interface MemoizedMenuProps {
  items: MenuProps['items'];
  selectedKeys: string[];
  mode: 'vertical' | 'horizontal' | 'inline';
}

// Memoized menu items to prevent re-renders
const MemoizedMenu = memo(({ items, selectedKeys, mode }: MemoizedMenuProps) => (
  <Menu
    mode={mode}
    selectedKeys={selectedKeys}
    items={items}
    style={{ height: '100%', borderRight: 0 }}
  />
));

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  
  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
      router.push('/auth/signin')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }, [router])
  
  // Make sure userMenu uses the correct types for MenuItem
  const userMenu: MenuProps['items'] = [
    {
      key: 'profile',
      label: (
        <Link href="/profile">
          My Profile
        </Link>
      ),
      icon: <UserOutlined />
    },
    {
      key: 'settings',
      label: (
        <Link href="/settings">
          Settings
        </Link>
      ),
      icon: <SettingOutlined />
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Sign Out',
      icon: <LogoutOutlined />,
      onClick: handleSignOut
    },
  ]

  // Fix the type of sidebarItems
  const sidebarItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link href="/dashboard">Dashboard</Link>
    },
    {
      key: '/templates',
      icon: <FileOutlined />,
      label: <Link href="/templates">Templates</Link>
    },
    {
      key: 'forms',
      icon: <FormOutlined />,
      label: 'Forms',
      children: [
        {
          key: '/form/builder/new',
          label: <Link href="/form/builder/new">Create New Form</Link>
        },
        {
          key: '/form/ai',
          label: <Link href="/form/ai">AI Form Generator</Link>
        }
      ]
    }
  ]
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="dashboard-header">
        <div className="logo">
          <Link href="/dashboard">FormBuilder</Link>
        </div>
        <div className="header-right">
          <Space>
            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <Space className="user-dropdown-trigger">
                <Avatar icon={<UserOutlined />} />
                <span className="username">
                  {auth.currentUser?.displayName || auth.currentUser?.email || 'User'}
                </span>
                <DownOutlined />
              </Space>
            </Dropdown>
          </Space>
        </div>
      </Header>
      
      <Layout>
        <Sider 
          width={200} 
          className="dashboard-sider"
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
        >
          <Button 
            type="text" 
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="sider-trigger"
          />
          <MemoizedMenu
            mode="inline"
            selectedKeys={[pathname || '']}
            items={sidebarItems}
          />
        </Sider>
        
        <Content className="dashboard-content">
          {children}
        </Content>
      </Layout>
    </Layout>
  )
} 