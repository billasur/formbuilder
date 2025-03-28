
import './globals.css'
import React, { useState } from 'react'
import { ThemeProvider } from '../contexts/ThemeContext'
import { AuthProvider } from '../contexts/AuthContext'
import { Inter } from 'next/font/google'
import { App as AntApp, Layout } from 'antd'
import Header from '../components/layout/Header'
import SideNav from '../components/layout/SideNav'
import { MessageProviderComponent } from './MessageProvider'
import RouteGuard from '../components/auth/RouteGuard'
import { usePathname } from 'next/navigation'

const { Content } = Layout

const inter = Inter({ subsets: ['latin'] })

// Metadata must be exported from a Server Component, not a Client Component
export const metadata = {
  title: 'Form Builder',
  description: 'A powerful form builder application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  // Check if we're on an auth page
  const isAuthPage = pathname?.startsWith('/auth/') || pathname === '/';

  return (
    <html lang="en">
      <head>
        <title>Form Builder</title>
        <meta name="description" content="Advanced form builder application" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider>
            <MessageProviderComponent>
              <AntApp>
                <RouteGuard>
                  {isAuthPage ? (
                    // Don't show header/sidenav on auth pages
                    <div className="auth-layout">
                      {children}
                    </div>
                  ) : (
                    // Show full layout on other pages
                    <Layout style={{ minHeight: '100vh' }}>
                      <Header 
                        collapsed={collapsed} 
                        toggleCollapsed={toggleCollapsed} 
                      />
                      <Layout style={{ marginTop: '64px' }}>
                        <SideNav collapsed={collapsed} />
                        <Content className="main-content">
                          {children}
                        </Content>
                      </Layout>
                    </Layout>
                  )}
                </RouteGuard>
              </AntApp>
            </MessageProviderComponent>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
} 